import Redis from 'ioredis';

interface LockOptions {
  lockTimeout: number,
  lockRetry: number,
};

type Locker = (lockKey: string, timeout: number, retry: number) => Promise<Unlocker>;
type Unlocker = () => Promise<void>;

const LOCK_SUCCESSFULY_SET = 'OK';

// binds a redis client to the locking function
export default function lockFactory(client: Redis.Redis, options: LockOptions): Locker {
  const { lockTimeout, lockRetry } = options;

  // locking fn
  return async function lock(lockKey: string, timeout = lockTimeout, retry = lockRetry): Promise<Unlocker> {
    lockKey = `lock:${lockKey}`;
    const expireAt = Date.now() + timeout + 1;

    // try to set a lock
    await setLock(client, lockKey, expireAt, retry);
      // caller can manually unlock before the lock expires
    return async function unlock(): Promise<void> {
      if (Date.now() < expireAt) {
        await client.del(lockKey);
      }
    }
  }
}

async function setLock(client: Redis.Redis, lockKey: string, expireAt: number, lockRetry: number): Promise<boolean> {
  const lockTtl = expireAt - Date.now();
  if (lockTtl <= 0) {
    return false;
  }

  try {
    // PX = key expiry in ms, NX = dont set if exists
    const isSet = await client.set(lockKey, '1', 'PX', lockTtl, 'NX');

    if (isSet !== LOCK_SUCCESSFULY_SET) {
      throw new Error('Lock exists')
    }

    return true;
  } catch (error) {
    // Lock was not set for some reason. Could be network or an existing lock
    // Try again after we waiting a bit
    await new Promise(resolve => setTimeout(resolve, lockRetry));
    return setLock(client, lockKey, expireAt, lockRetry);
  }
}