import { endOfDay, endOfHour, subDays, subHours, startOfDay, startOfHour } from 'date-fns';
import supertest from 'supertest';

// TODO: Fix module resolutions for Jest, it works tho....
import { app } from 'common/server';
import BitqueryFetcher from 'services/bitquery/fetcher';
import config from 'config';

import expectedDailyOHLC from '../../fixtures/market-data/bitquery-daily-ohlc.json';
import expectedWeeklyOHLC from '../../fixtures/market-data/bitquery-weekly-ohlc.json';

const request = supertest(app);

const validBaseToken = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const validQuoteToken = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

describe.skip('Bitquery market data HTTP tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('GET /daily', () => {
        const url = '/api/v1/marketData/daily';
        let getLastDayOHLC;
        beforeEach(() => {
            getLastDayOHLC = jest.spyOn(BitqueryFetcher, 'getLastDayOHLC');
        });

        test('gets the last day OHLC', async () => {
            getLastDayOHLC.mockResolvedValue(expectedDailyOHLC);

            const res = await request.get(`${url}?baseToken=${validBaseToken}&quoteToken=${validQuoteToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject(expectedDailyOHLC);

            expect(getLastDayOHLC).toBeCalledTimes(1);
            getLastDayOHLC.mockRestore();
        });

        test('400s with an invalid base token', async () => {
            const res = await request.get(`${url}?baseToken=foo&quoteToken=${validQuoteToken}`);
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(`"baseToken" must be a valid ETH address.`);
        });

        test('400s with an invalid quote token', async () => {
            const res = await request.get(`${url}?baseToken=${validBaseToken}&quoteToken=foo`);
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(`"quoteToken" must be a valid ETH address.`);
        });
    });

    describe('GET /weekly', () => {
        const url = '/api/v1/marketData/weekly';
        let getLastWeekOHLC;
        beforeEach(() => {
            getLastWeekOHLC = jest.spyOn(BitqueryFetcher, 'getLastWeekOHLC');
        });

        test('gets the last day OHLC', async () => {
            getLastWeekOHLC.mockResolvedValue(expectedWeeklyOHLC);

            const res = await request.get(`${url}?baseToken=${validBaseToken}&quoteToken=${validQuoteToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject(expectedWeeklyOHLC);

            expect(getLastWeekOHLC).toBeCalledTimes(1);
            getLastWeekOHLC.mockRestore();
        });

        test('400s with an invalid base token', async () => {
            const res = await request.get(`${url}?baseToken=foo&quoteToken=${validQuoteToken}`);
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(`"baseToken" must be a valid ETH address.`);
        });

        test('400s with an invalid quote token', async () => {
            const res = await request.get(`${url}?baseToken=${validBaseToken}&quoteToken=foo`);
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(`"quoteToken" must be a valid ETH address.`);
        });
    });
});