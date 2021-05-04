import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

import { EthGasPrices } from '@sommelier/shared-types';
import config from 'config';

export const ethGasPriceTopic = 'ethGas:getGasPrices';
export const gasPriceTopicRex = /$ethGas:getGasPrices/;

export function useEthGasPrices() {
    const [gasPrices, setGasPrices] = useState<EthGasPrices | null>(null);

    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const { sendJsonMessage, lastJsonMessage } = useWebSocket(config.wsApi);

    useEffect(() => {
        if (!isSubscribed) {
            sendJsonMessage({
                op: 'subscribe',
                topics: ['ethGas:getGasPrices'],
            });
            setIsSubscribed(true);
        }
    }, [isSubscribed]);

    useEffect(() => {
        if (!lastJsonMessage) return;

        const { topic } = lastJsonMessage;
        if (!topic) return;

        if (gasPriceTopicRex.test(topic)) {
            const { data: gasPrices }: { data: EthGasPrices } = lastJsonMessage;
            setGasPrices(gasPrices);
        }
    }, [lastJsonMessage]);

    return gasPrices;
}
