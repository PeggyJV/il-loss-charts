import express, { Application, Request, Response, NextFunction } from 'express';
import routes from 'routes';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import os from 'os';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import Mixpanel from 'mixpanel';
import mime from 'mime-types';

import * as OpenApiValidator from 'express-openapi-validator';
import * as middleware from '../api/middlewares';
import { stopRedis } from '../util/redis';

import config from '@config';

let mixpanel: Mixpanel.Mixpanel;

if (config.mixpanel.apiKey.length > 0) {
    mixpanel = Mixpanel.init(config.mixpanel.apiKey);
}

export const app = express();
class ExpressServer {
    public httpServer?: http.Server;

    constructor() {
        const root = path.normalize(__dirname + '/../..');
        const clientRoot = path.normalize(__dirname + '/../../../client');
        app.set('appPath', root + 'client');

        // logging, should be first middleware
        app.use(middleware.logger());

        app.use(middleware.poweredBy);
        app.use(cookieParser(config.session.secret));

        app.use(
            '/static',
            express.static(`${clientRoot}/build/static`, {
                maxAge: '30d',
                immutable: true, // these files never change and can be cached for 1y
            }),
        );

        // if we change these files we'll have to invalidate the cache in gcp console
        app.use(
            express.static(`${clientRoot}/build`, {
                maxAge: '30d', // index.html should be revalidated much more frequently
                setHeaders: (res: Response, path: string) => {
                    // html like index.html should be revalidated often
                    if (mime.lookup(path) === 'text/html') {
                        res.setHeader('Cache-Control', 'public, max-age=60');
                    }
                },
            }),
        );

        // Catch all
        app.use(function (req: Request, res: Response, next: NextFunction) {
            if (req.url.includes('api')) return next();

            mixpanel?.track('server:page_load', { ip: req.ip });

            res.sendFile(path.join(clientRoot, 'build', 'index.html'));
        });
    }

    router(routes: (app: Application) => void): ExpressServer {
        app.use(
            bodyParser.urlencoded({
                extended: true,
                limit: config.requestLimit,
            }),
        );
        app.use(bodyParser.text({ limit: config.requestLimit }));

        routes(app);
        app.use(middleware.errorHandler);
        return this;
    }

    // not being used for now
    mountExplorer(): void {
        const apiSpec = path.join(__dirname, '../docs/api.yml');
        let apiDoc;
        try {
            apiDoc = YAML.load(apiSpec);
        } catch (error) {
            console.log('Error: Could not load and configure API Explorer');
        }

        if (apiDoc) {
            app.use('/api/explorer', swaggerUi.serve, swaggerUi.setup(apiDoc));
            app.use(
                config.openApiSpec,
                express.static(apiSpec, { maxAge: '1h' }),
            );

            const validateResponses = config.enableResponseValidation;
            app.use(
                OpenApiValidator.middleware({
                    apiSpec,
                    validateRequests: true,
                    validateResponses,
                    ignorePaths: /.*\/spec(\/|$)/,
                }),
            );
        }
    }

    listen(port: number): Application {
        const welcome = (p: number) => (): void =>
            console.info(
                `[${
                    config.pid
                }] ${new Date().toISOString()} up and running in ${
                    config.env
                } @: ${os.hostname()} on port: ${p}`,
            );

        this.httpServer = http.createServer(app).listen(port, welcome(port));

        return app;
    }

    async shutdown(signal: string): Promise<void> {
        console.log(`[${config.pid}] Received ${signal}, shutting down server`);

        // Stop accepting new connections, allow in-flight requests to complete
        const close = new Promise((resolve, reject) => {
            server.httpServer?.close((error) => {
                if (error) {
                    console.error(
                        `[${config.pid}] Could not shutdown gracefully`,
                    );
                    reject(null);
                } else {
                    // Gracefully disconnect from Redis
                    stopRedis()
                        .then(() => {
                            console.log(
                                `[${config.pid}] Gracefully shutdown server due to ${signal}`,
                            );
                            resolve(null);
                        })
                        .catch((error) => {
                            console.error(error.message);
                            console.error(
                                `[${config.pid}] Could not shutdown Redis gracefully`,
                            );
                            reject(null);
                        });
                }
            });
        });

        // Set a timeout to shutdown anyway if we're unable to shutdown gracefully
        const delay = new Promise((resolve) => {
            setTimeout(() => {
                console.log(
                    `[${config.pid}] Could not shutdown gracefully, timeout exceeded`,
                );
                resolve(null);
            }, config.server.shutdownTimeout);
        });

        await Promise.race([close, delay]);
    }
}

const server = new ExpressServer();
server.router(routes);
export default server;
