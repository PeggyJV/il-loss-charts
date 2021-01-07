import { EventEmitter } from 'events';
import ws from 'ws';
import services, { DataSource } from 'services';
import pollingUtil from 'util/polling';
import { tokenizeTopic } from 'util/parse-topics';
import { isValidEthAddress } from 'util/eth';

interface MessagePayload {
    op: 'subscribe' | 'unsubscribe' | 'help';
    topics: string[],
    interval?: string | number
}

// TODO - topic deduper
// TODO - cleaner merged uniswap/infura API

export default class WsMessageHandler {
    static ALLOWED_OPERATIONS = ['subscribe', 'unsubscribe'];
    static ALLOWED_SOURCES = Object.keys(services);

    conn: ws;

    constructor(conn: ws) {
        this.conn = conn;
        conn.on('message', this.handleMessage.bind(this))
    }

    handleMessage(message: string): void {
        // All messages are received as json.
        // Each message should contain an operation. Allowed operations:
        //  - subscribe
        //  - unsubscribe

        let msgPayload: MessagePayload | null = null;
        try {
            msgPayload = JSON.parse(message);
        } catch (e) {
            return this.sendError(400, 'Could not parse message as JSON.');
        }

        if (msgPayload == null) {
            return this.sendError(400, 'Receieved an empty message.');
        }

        if (!WsMessageHandler.ALLOWED_OPERATIONS.includes(msgPayload.op)) {
            return this.sendError(400, `Invalid operation: ${msgPayload.op}`)
        }

        if (msgPayload.op === 'subscribe') {
            return this.handleSubscribe(msgPayload);
        } else if (msgPayload.op === 'unsubscribe') {
            return this.handleUnsubscribe(msgPayload);
        }

    }

    handleSubscribe(msgPayload: MessagePayload): void {
        const { topics, interval } = msgPayload;

        if (!msgPayload.topics || topics.length === 0) {
            return this.sendError(400, `Received 'subscribe' message without topics.`);
        }

        if (interval && typeof interval === 'string') {
            // Interval is a number
            topics.forEach((topic) => {
                const isValid = this.validateTopic(topic);
                if (isValid) this.subscribeOnNewBlocks(topic);
            });

        } else {
            // Interval is a number
            topics.forEach((topic) => {
                const isValid = this.validateTopic(topic);
                if (isValid) this.subscribeToTopic(topic, <number>interval);
            });
        }

    }

    handleUnsubscribe(msgPayload: MessagePayload): void {
        const { topics } = msgPayload

        if (!msgPayload.topics || topics.length === 0) {
            return this.sendError(400, `Received 'subscribe' message without topics.`);
        }

        topics.forEach((topic) => {
            const isValid = this.validateTopic(topic);
            if (isValid) this.unsubscribeFromTopic(topic);
        });
    }

    validateInterval(interval: string | number): boolean {
        if (typeof interval === 'string') {
            return interval === 'newBlocks';
        } else if (typeof interval === 'number') {
            return interval > 0;
        } else {
            return false;
        }
    }

    validateTopic(topic: string): boolean {
        // Topics are colon-delimited breakdowns of different data we can provide.
        // The first token in the topic should be the data source (e.g. uniswap, infura).
        // The second token in the topic should be the query on the datasource (e.g. pair, historical).
        // The third token in the topic should be query-specific arguments. Should look at particular service for documentation.
        // Wildcards can be used in the second and third token. If the second token is a wildcard the third must be as well.

        // Validate source
        const [source, query, args] = tokenizeTopic(topic);
        if (!WsMessageHandler.ALLOWED_SOURCES.includes(source)) {
            this.sendError(400, `Invalid source in topic: ${source}`);
            return false;
        }

        const service = services[source as DataSource];
        if (!service) throw new Error(`Cannot handle topic on data source ${source}`);

        // Validate query
        if (!query) {
            this.sendError(400, `Did not receive query for source ${source}. To subscribe to all queries use a wildcard.`);
            return false;
        }

        if (source === 'uniswap') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (query !== '*' && !(service as any)[query]) {
                this.sendError(400, `Invalid query for source ${source}: ${query}`);
                return false;
            }

            // Validate args - only checking for wildcard right now
            if (query === '*' && args !== '*') {
                this.sendError(400, `Invalid args for wildcard query.`);
                return false;
            }
        } else if (source === 'infura') {
            if (query !== 'newHeads' && query !== 'newBlockHeaders' && query !== 'pendingTransactions') {
                this.sendError(400, `Invalid query for infura source.`)
                return false;
            }

            if (query === 'pendingTransactions' && !isValidEthAddress(args)) {
                this.sendError(400, `Invalid address for pendingTransactions query.`)
                return false;
            }
        }

        return true;
    }

    subscribeToTopic(topic: string, interval: number): void {
        const [source, query, args] = tokenizeTopic(topic);

        // We assume token is valid
        if (source === 'uniswap') {
            pollingUtil.subscribe(topic, interval)
                .on('data', (data: unknown) => this.sendJSON({
                    topic,
                    data
                }));
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (services as any)[source].subscribe(query, args)
                .on('data', (data: unknown) => this.sendJSON({
                    topic,
                    data
                }));
        }
    }

    subscribeOnNewBlocks(topic: string): void {
        const [source, query, args] = tokenizeTopic(topic);

        const dataSource = services[source as DataSource];
        if (!dataSource) throw new Error(`Cannot start polling on data source ${source}`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const queryFn = (dataSource as any)[query];
        if (!queryFn) throw new Error(`Query ${query} does not exist on data source ${source}`);

        // Assume args are comma-delimited
        const argsArr = args.split(',');

        (services.infura.subscribe('newHeads') as EventEmitter)
            .on('data', () => {
                // we got a new block, so fetch result and sendJSON
                queryFn(...argsArr)
                    .then((latest): unknown => this.sendJSON({
                        topic,
                        data: latest
                    }));
            });
    }

    unsubscribeFromTopic(topic: string): void {
        const [source, query] = tokenizeTopic(topic);

        // We assume token is valid
        if (source === 'uniswap') {
            pollingUtil.unsubscribe(topic)
        } else if (source === 'infura') {
            services.infura.unsubscribe(query);
        }
    }

    sendError(code = 500, errorMsg: string): void {
        this.sendJSON({
            result: 'error',
            code,
            message: errorMsg
        });
    }

    sendJSON(obj: unknown): void {
        this.conn.send(JSON.stringify(obj));
    }
}
