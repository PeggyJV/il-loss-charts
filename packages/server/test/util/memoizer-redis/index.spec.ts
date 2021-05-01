import { delay } from 'util/promise';
import redis from 'util/redis';
import memoizer, {
  sha1,
  getFnNamespace,
  getCacheKey,
  lookup,
  serialize,
  deserialize,
} from 'util/memoizer-redis/index';
import { assert } from 'chai';

describe('memoizer-redis tests', () => {
  afterEach(async () => {
    await redis.flushdb();
  });
  const key = 'testKey';
  const val = 'testValue';
  const arg = 'hello';

  describe('memoizer', () => {
    function expected(data: string) {
      return `memo:${data}`
    }

    let mem, fn, mfn;
    beforeEach(() => {
      mem = memoizer(redis, { keyPrefix: 'test' });
      // nb: this does not create a new memoized fn for every test
      // there is a TODO to fix this in util/memoizer-redis
      fn = jest.fn().mockImplementation(expected);
      mfn = mem(fn);
    })

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('fetches from redis on second call', async () => {
      const r1 = await mfn(arg);
      const r2 = await mfn(arg);

      expect(r1).toMatch(expected(arg))
      expect(r1).toMatch(r2);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('hydrates cache after expiry', async () => {
      function ffn(data: string) { return fn(data); }
      const mfn = mem(ffn, { ttl: 50 });

      const r1 = await mfn(arg);
      await delay(51);
      const r2 = await mfn(arg);
      const r3 = await mfn(arg);

      expect(r1).toMatch(expected(arg))
      expect(r1).toMatch(r2);
      expect(r3).toMatch(r2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('calls original function if lookupTimeout expires', async () => {
      const fn = jest.fn().mockImplementation(expected);
      Object.defineProperty(fn, 'name', { value: 'lookupTimeout' });

      const mfn = mem(fn, { lookupTimeout: 1 });
      jest.spyOn(redis, 'get').mockImplementation(async () => {
        await delay(10);
        return JSON.stringify(expected(arg));
      });

      const r1 = await mfn(arg);
      const r2 = await mfn(arg);

      expect(r1).toMatch(arg);
      expect(r1).toMatch(r2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('force cache update', async () => {
      const r1 = await mfn(arg);

      // force cache update
      await mfn.forceUpdate(arg);
      expect(fn).toHaveBeenCalledTimes(2);

      const r2 = await mfn(arg);

      expect(r1).toMatch(expected(arg))
      expect(r1).toMatch(r2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test.skip('calls original function but does not update cache if lock timeout exceeded', async () => {
      // Think I need to spin off some workers to test this with concurrency
    });
  })

  describe('sha1', () => {
    test('creates a sha1 for an array of args', () => {
      const args = [1, 'one', { one: 1 }, [2, 'two']];
      const expected = '8463cd775333c88c62faf035f76625f8f6030169';

      expect(sha1(args)).toMatch(expected);
    })

    // TODO: test more types
  });

  describe('getFnNamespace', () => {
    test('returns the function namespace', () => {
      const expected = 'prefix:myFunc';
      expect(getFnNamespace('prefix', 'myFunc')).toMatch(expected);
    });
  })

  describe('getCacheKey', () => {
    test('returns cache key', () => {
      const argsKey = sha1([1, 2, 3]);
      const expected = `prefix:myFunc:${argsKey}`;

      expect(getCacheKey('prefix', 'myFunc', argsKey)).toMatch(expected);
    });
  })

  describe('lookup', () => {
    beforeEach(async () => {
      await redis.set(key, JSON.stringify(val));
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('fetches data from redis', async () => {
      const wait = new Promise((resolve) => {
        lookup(redis, key, 1000).then(data => {
          expect(data).toMatch(val);
          resolve(null);
        });
      });

      jest.advanceTimersByTime(999);
      await wait;
    });

    test('returns undefined if timeout is exceeded', async () => {
      const wait = new Promise((resolve) => {
        lookup(redis, key, 1000).then(data => {
          expect(data).toBeUndefined();
          resolve(null);
        });
      });

      jest.advanceTimersByTime(1001);
      await wait;
    });
  });
  
  const data = { one: 'two', three: 4, date: new Date(), array: [1,2,3,4] };
  describe('serialize', () => {
    test('serializes using JSON.stringify', () => {
      const expected = JSON.stringify(data);

      expect(serialize(data)).toMatch(expected);
    });
  })

  describe('deserialize', () => {
    test('deserializes with JSON.parse', () => {
      const s = serialize(data);
      const expected = JSON.parse(s);
      expect(deserialize(s)).toStrictEqual(expected);
    });
  });

  describe('serialize / deserialize', () => {
    // TODO: test serialize then deserialize calls against different types
    // int, float, strings, objects, arrays, dates, etc...
  });
});
