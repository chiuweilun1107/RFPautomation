import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
    globalForRedis.redis ||
    new Redis({
        host: redisHost,
        port: redisPort,
        // 如果你的 Redis 有設定密碼，可以在這裡加上 password: process.env.REDIS_PASSWORD
    });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;
