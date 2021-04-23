import config from './src/config';
import Redis from 'ioredis';

const redis = new Redis({
    host: '127.0.0.1',
    port: 6379,
});

(async function () {
  const key = 'key';
  await redis.set(key, 'hello there');
  console.log('Getting: ', await redis.get(key));
  process.exit();
})();
