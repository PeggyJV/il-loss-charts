import { dayMs } from 'util/date';
import {
    GetEthPriceQueryVariables,
    GetPoolOverviewQueryVariables,
    Pool,
} from 'services/uniswap-v3/generated-types';
import {
    GetEthPriceResult,
    GetPoolDailyDataResult,
    GetPoolHourlyDataResult,
    GetPoolOverviewResult,
    GetTopPoolsResult,
    GetPositionsResult,
    GetPositionSnapshotsResult,
} from '@sommelier/shared-types/src/api'; // how do we export at root level?
import { HTTPError } from 'api/util/errors';
import { toDateInt } from 'util/gql';
import { UniswapV3Sdk } from 'services/util/apollo-client';
import { BigNumber } from 'bignumber.js';

export interface UniswapFetcher {
    getEthPrice(blockNumber?: number): Promise<GetEthPriceResult>;
    getPoolOverview(
        poolId: string,
        blockNumber?: number,
    ): Promise<GetPoolOverviewResult>;
    getTopPools(count: number, orderBy: keyof Pool): Promise<GetTopPoolsResult>;
    getPoolDailyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolDailyDataResult>;
    getPoolHourlyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolHourlyDataResult>;
    getHistoricalDailyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolDailyDataResult>;
    getHistoricalHourlyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolHourlyDataResult>;
    getPositions(owner: string): Promise<GetPositionsResult>;
    getPositionSnapshots(owner: string): Promise<GetPositionSnapshotsResult>;
}

export class UniswapV3Fetcher {
    sdk: UniswapV3Sdk;

    constructor(sdk: UniswapV3Sdk) {
        this.sdk = sdk;
    }

    async getEthPrice(blockNumber?: number): Promise<GetEthPriceResult> {
        let options: GetEthPriceQueryVariables = { id: '1' };
        if (typeof blockNumber === 'number') {
            options = {
                ...options,
                blockNumber,
            };
        }

        try {
            const { bundle } = await this.sdk.getEthPrice(options);

            if (bundle?.ethPriceUSD == null) {
                throw new Error('ethPrice not returned.');
            }

            return { ethPrice: new BigNumber(bundle.ethPriceUSD) };
        } catch (error) {
            throw makeSdkError(`Could not fetch ethPrice.`, error);
        }
    }

    async getPoolOverview(
        poolId: string,
        blockNumber?: number,
    ): Promise<GetPoolOverviewResult> {
        let options: GetPoolOverviewQueryVariables = { id: poolId };
        if (typeof blockNumber === 'number') {
            options = {
                ...options,
                blockNumber,
            };
        }

        let data;
        try {
            data = await this.sdk.getPoolOverview(options);
        } catch (error) {
            // TODO: Clients should throw coded errors, let the route handler deal with HTTP status codes
            throw makeSdkError(`Could not find pool with ID ${poolId}.`, error);
        }

        if (data.pool == null) {
            throw new HTTPError(404);
        }

        return data.pool;
    }

    async getTopPools(
        count = 1000,
        orderBy: keyof Pool,
    ): Promise<GetTopPoolsResult> {
        try {
            const { pools } = await this.sdk.getPoolsOverview({
                first: count,
                orderDirection: 'desc',
                orderBy,
            });
            if (pools == null || pools.length === 0) {
                throw new Error('No pools returned.');
            }

            return pools;
        } catch (error) {
            throw makeSdkError(`Could not fetch top pool.`, error);
        }
    }

    async getPoolDailyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolDailyDataResult> {
        const startDate = toDateInt(start);
        const endDate = toDateInt(end);

        try {
            const { poolDayDatas } = await this.sdk.getPoolDailyData({
                pool: poolId,
                orderBy: 'date',
                orderDirection: 'asc',
                startDate,
                endDate,
            });

            if (poolDayDatas == null) {
                throw new Error('No pools returned.');
            }

            return poolDayDatas;
        } catch (error) {
            throw makeSdkError(
                `Could not fetch daily data for pool ${poolId}.`,
                error,
            );
        }
    }

    async getPoolHourlyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolHourlyDataResult> {
        const startTime = toDateInt(start) - 1;
        const endTime = toDateInt(end);

        try {
            const { poolHourDatas } = await this.sdk.getPoolHourlyData({
                id: poolId,
                orderBy: 'date',
                orderDirection: 'asc',
                startTime,
                endTime,
            });

            if (poolHourDatas == null) {
                throw new Error('No pools returned.');
            }

            return poolHourDatas;
        } catch (error) {
            throw makeSdkError(
                `Could not fetch hourly data for pool ${poolId}.`,
                error,
            );
        }
    }

    async getHistoricalDailyData(
        poolId: string,
        start: Date,
        end: Date = new Date(),
    ): Promise<GetPoolDailyDataResult> {
        const startData = await this.getPoolDailyData(poolId, start, end);

        if (startData.length === 0) {
            throw new HTTPError(
                404,
                `Could not fetch any historical data for the given timeframe. Make sure the window is at least 1 day.`,
            );
        }

        let dailyData = startData; // accumulator
        let cursorEndDate = dailyData[dailyData.length - 1]?.date; // date of last data in current page
        let lastStartDate = start; // start date from previous page
        const endDateTimestamp = Math.floor(end.getTime() / 1000); // final date we want data for

        // Keep fetching until we pass the end date
        while (
            cursorEndDate &&
            cursorEndDate <= endDateTimestamp &&
            Math.floor(lastStartDate.getTime() / 1000) <= endDateTimestamp
        ) {
            // cache old length to compare later
            const oldLength = dailyData.length;

            // skip ahead 24 hours, cache for next query
            lastStartDate = new Date(cursorEndDate * 1000 + dayMs);
            const moreDailyData = await this.getPoolDailyData(
                poolId,
                lastStartDate,
                end,
            );
            dailyData = [...dailyData, ...moreDailyData];
            cursorEndDate = dailyData[dailyData.length - 1]?.date; // set new cursor

            // Nothing more to add
            // @kkennis whats the scenario where there would be no more data to fetch?
            // aka, can we precalculate windows and parallelize?
            if (dailyData.length === oldLength) {
                break;
            }
        }

        return dailyData;
    }

    async getHistoricalHourlyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolHourlyDataResult> {
        const startData = await this.getPoolHourlyData(poolId, start, end);
        if (startData.length === 0) {
            throw new HTTPError(
                404,
                `Could not fetch any historical data for the given timeframe. Make sure the window is at least 1 day.`,
            );
        }

        let hourlyData = startData; // accumulator
        let cursorEndTime = hourlyData[hourlyData.length - 1]?.date; // time of last hour data in current page
        let lastStartTime = start; // start time from previous page
        const endTimestamp = Math.floor(end.getTime() / 1000);

        while (
            cursorEndTime &&
            cursorEndTime <= endTimestamp &&
            Math.floor(lastStartTime.getTime() / 1000) <= endTimestamp
        ) {
            // cache old length to compare later
            const oldLength = hourlyData.length;

            // skip ahead 24 hours, cache for next query
            lastStartTime = new Date(cursorEndTime * 1000 + dayMs);
            const moreHourlyData = await this.getPoolHourlyData(
                poolId,
                lastStartTime,
                end,
            );
            hourlyData = [...hourlyData, ...moreHourlyData];
            cursorEndTime = hourlyData[hourlyData.length - 1]?.date; // set new cursor

            if (hourlyData.length === oldLength) {
                break;
            }
        }

        return hourlyData;
    }

    async getPositions(owner: string): Promise<GetPositionsResult> {
        try {
            const { positions } = await this.sdk.getPositions({
                owner,
            });
            if (positions == null || positions.length === 0) {
                throw new Error('No positions returned.');
            }

            return positions;
        } catch (error) {
            throw makeSdkError(`Could not fetch user positions`, error);
        }
    }

    async getPositionSnapshots(
        owner: string,
    ): Promise<GetPositionSnapshotsResult> {
        try {
            const { positionSnapshots } = await this.sdk.getPositionSnapshots({
                owner,
            });
            if (positionSnapshots == null || positionSnapshots.length === 0) {
                throw new Error('No position snapshots returned.');
            }

            return positionSnapshots;
        } catch (error) {
            throw makeSdkError(
                `Could not fetch user position snapshots`,
                error,
            );
        }
    }
}

function makeSdkError(message: string, error: Error, code = 400) {
    const sdkError = error?.toString() ?? '';
    return new HTTPError(code, `${message} ${sdkError}`);
}
