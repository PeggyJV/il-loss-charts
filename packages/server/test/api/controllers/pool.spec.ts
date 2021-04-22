import { endOfDay, endOfHour, subDays, subHours, startOfDay, startOfHour } from 'date-fns';
import supertest from 'supertest';

import { app } from 'common/server';
import { UniswapV3Fetchers } from 'services/uniswap-v3/fetchers';

const request = supertest(app);
const fetcher = UniswapV3Fetchers.get('mainnet');

const validId = '0x1581d1a4f79885255e1993765ddee80c5e715181';

describe('pools HTTP tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /ethprice', () => {
    const url = '/api/v1/mainnet/ethprice';
    let getEthPrice;
    beforeEach(() => {
      getEthPrice = jest.spyOn(fetcher, 'getEthPrice');
    });

    test('calls the subgraph', async () => {
      const expected = { ethPrice: 1 };
      getEthPrice.mockResolvedValue(expected);

      const res = await request.get(url);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(expected);

      expect(getEthPrice).toBeCalledTimes(1);
    });
  });

  describe('GET /pools', () => {
    const url = '/api/v1/mainnet/pools';
    let getTopPools;
    beforeEach(() => {
      getTopPools = jest.spyOn(fetcher, 'getTopPools');
    })

    test('calls the subgraph', async () => {
      const expected = [{ id: '123' }, { id: '345' }];
      getTopPools.mockResolvedValue(expected);

      const res = await request.get(url);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(expected);

      expect(getTopPools).toBeCalledTimes(1);
      expect(getTopPools).toBeCalledWith(undefined);
    });

    test('calls the subgraph with count', async () => {
      const expected = [{ id: '123' }, { id: '345' }];
      getTopPools.mockResolvedValue(expected);

      const count = 999;
      const res = await request.get(url).query({ count });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(expected);

      expect(getTopPools).toBeCalledTimes(1);
      expect(getTopPools).toBeCalledWith(count);
    });

    test('400s with invalid count', async () => {
      const res = await request.get(url).query({ count: 'abcd' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error: "count" must be a number')
    });
  });

  describe('GET /pools/:poolId', () => {
    const url = '/api/v1/mainnet/pools';
    let getPoolOverview;
    beforeEach(() => {
      getPoolOverview = jest.spyOn(fetcher, 'getPoolOverview');
    })
      
    test('calls the subgraph', async () => {
      const expected = { id: validId };
      getPoolOverview.mockResolvedValue(expected);

      const res = await request.get(`${url}/${validId}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(expected);

      expect(getPoolOverview).toBeCalledTimes(1);
      expect(getPoolOverview).toBeCalledWith(validId);
    });

    test('400s with invalid pool address', async () => {
      const res = await request.get(`${url}/123abcd`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"id" must be a valid ETH address.');
    });
  })

  describe('GET /pools/:poolId/historical/daily', () => {
    let fetch;
    beforeEach(() => {
      fetch = jest.spyOn(fetcher, 'getHistoricalDailyData');
    })

    const getUrl = (id: string) => `/api/v1/mainnet/pools/${id}/historical/daily`;

    test('calls the subgraph', async () => {
      const expected = [{ id: validId }, { id: validId }];
      fetch.mockResolvedValue(expected);

      const endDate = new Date().getTime();
      const startDate = subDays(new Date(endDate), 1).getTime();
      const query = { startDate, endDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(expected);

      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));
      expect(fetch).toBeCalledTimes(1);
      expect(fetch).toBeCalledWith(validId, start, end);
    });

    test('calls the subgraph with default endDate', async () => {
      const expected = [{ id: validId }, { id: validId }];
      fetch.mockResolvedValue(expected);

      const endDate = new Date().getTime();
      const startDate = subDays(new Date(endDate), 1).getTime();
      const query = { startDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(expected);

      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date());
      expect(fetch).toBeCalledTimes(1);
      expect(fetch).toBeCalledWith(validId, start, end);
    });

    test('400s with invalid pool address', async () => {
      const res = await request.get(getUrl('abcd'));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"id" must be a valid ETH address.');
    });

    test('400s if no startDate passed', async () => {
      const endDate = new Date().getTime();
      const query = { endDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"startDate" is required');
    });

    test('400s if endDate is less than startDate', async () => {
      const startDate = new Date().getTime();
      const endDate = subDays(new Date(startDate), 1).getTime();
      const query = { startDate, endDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"endDate" must be greater');
    });

    test('400s if startDate is invalid', async () => {
      const startDate = 'abcd';
      const query = { startDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"startDate" must be a valid date');
    })

    test('400s if endDate is invalid', async () => {
      const startDate = new Date().getTime();
      const endDate = 'watwat';
      const query = { startDate, endDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"endDate" must be a valid date');
    })
  });

  describe('GET /pools/:poolId/historical/hourly', () => {
    let fetch;
    beforeEach(() => {
      fetch = jest.spyOn(fetcher, 'getHistoricalHourlyData');
    })

    const getUrl = (id: string) => `/api/v1/mainnet/pools/${id}/historical/hourly`;

    test('calls the subgraph', async () => {
      const expected = [{ id: validId }, { id: validId }];
      fetch.mockResolvedValue(expected);

      const endDate = new Date().getTime();
      const startDate = subHours(new Date(endDate), 1).getTime();
      const query = { startDate, endDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(expected);

      const start = startOfHour(new Date(startDate));
      const end = endOfHour(new Date(endDate));
      expect(fetch).toBeCalledTimes(1);
      expect(fetch).toBeCalledWith(validId, start, end);
    });

    test('calls the subgraph with default endDate', async () => {
      const expected = [{ id: validId }, { id: validId }];
      fetch.mockResolvedValue(expected);

      const endDate = new Date().getTime();
      const startDate = subHours(new Date(endDate), 1).getTime();
      const query = { startDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(expected);

      const start = startOfHour(new Date(startDate));
      const end = endOfHour(new Date());
      expect(fetch).toBeCalledTimes(1);
      expect(fetch).toBeCalledWith(validId, start, end);
    });

    test('400s with invalid pool address', async () => {
      const res = await request.get(getUrl('abcd'));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"id" must be a valid ETH address.');
    });

    test('400s if no startDate passed', async () => {
      const endDate = new Date().getTime();
      const query = { endDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"startDate" is required');
    });

    test('400s if endDate is less than startDate', async () => {
      const startDate = new Date().getTime();
      const endDate = subDays(new Date(startDate), 1).getTime();
      const query = { startDate, endDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"endDate" must be greater');
    });

    test('400s if startDate is greater than 1 week before now', async () => {
      const endDate = new Date().getTime();
      const startDate = subDays(new Date(), 8).getTime();
      const query = { startDate, endDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"startDate" must fall within the window of 1 week.');
    })

    test('400s if startDate is invalid', async () => {
      const startDate = 'abcd';
      const query = { startDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"startDate" must be a valid date');
    })

    test('400s if endDate is invalid', async () => {
      const startDate = new Date().getTime();
      const endDate = 'watwat';
      const query = { startDate, endDate };
      const res = await request.get(getUrl(validId)).query(query);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('"endDate" must be a valid date');
    })
  });
});