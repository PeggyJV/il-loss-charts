import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

import { debug } from 'util/debug';
import { EthGasPrices } from '@sommelier/shared-types';
import config from 'config/app';

export const ethGasPriceTopic = 'ethGas:getGasPrices';
export const gasPriceTopicRex = /^ethGas:getGasPrices/;

export function useEthGasPrices(): EthGasPrices | null {
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
    }, [isSubscribed, sendJsonMessage]);

    useEffect(() => {
        // if no message, bail
        if (!lastJsonMessage) return;

        // if no topic, bail
        const { topic } = lastJsonMessage;
        if (!topic) return;

        // check if we have the gas price topic
        if (gasPriceTopicRex.test(topic)) {
            const { data: newGasPrices }: { data: EthGasPrices } =
                lastJsonMessage;

            // ensure the price actually changed before setting
            if (isChangedPrice(gasPrices, newGasPrices)) {
                setGasPrices(newGasPrices);
            }

            debug.gasPrices = newGasPrices;
        }
    }, [lastJsonMessage, gasPrices]);

    return gasPrices;
}

export function isChangedPrice(
    oldPrices: EthGasPrices | null,
    prices?: EthGasPrices | null,
): boolean {
    return (
        prices?.safeLow !== oldPrices?.safeLow ||
        prices?.standard !== oldPrices?.standard ||
        prices?.fast !== oldPrices?.fast ||
        prices?.fastest !== oldPrices?.fastest
    );
}
