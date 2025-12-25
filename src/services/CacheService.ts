import Redis from 'ioredis';
import { config } from '../config';
import logger from '../utils/logger';

class CacheService {
    private client: Redis;
    private isConnected: boolean = false;

    constructor() {
        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            db: config.redis.db,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            logger.info('Redis connected');
        });

        this.client.on('error', (err) => {
            logger.error({ err }, 'Redis error');
            this.isConnected = false;
        });

        this.client.on('close', () => {
            this.isConnected = false;
            logger.warn('Redis connection closed');
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error({ error, key }, 'Cache get error');
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, serialized);
            } else {
                await this.client.set(key, serialized);
            }
        } catch (error) {
            logger.error({ error, key }, 'Cache set error');
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            logger.error({ error, key }, 'Cache delete error');
        }
    }

    async deletePattern(pattern: string): Promise<void> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error) {
            logger.error({ error, pattern }, 'Cache delete pattern error');
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error({ error, key }, 'Cache exists error');
            return false;
        }
    }

    async increment(key: string): Promise<number> {
        try {
            return await this.client.incr(key);
        } catch (error) {
            logger.error({ error, key }, 'Cache increment error');
            return 0;
        }
    }

    async setHash(key: string, field: string, value: any): Promise<void> {
        try {
            await this.client.hset(key, field, JSON.stringify(value));
        } catch (error) {
            logger.error({ error, key, field }, 'Cache setHash error');
        }
    }

    async getHash<T>(key: string, field: string): Promise<T | null> {
        try {
            const value = await this.client.hget(key, field);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error({ error, key, field }, 'Cache getHash error');
            return null;
        }
    }

    async getAllHash<T>(key: string): Promise<Record<string, T>> {
        try {
            const hash = await this.client.hgetall(key);
            const result: Record<string, T> = {};
            for (const [field, value] of Object.entries(hash)) {
                result[field] = JSON.parse(value) as T;
            }
            return result;
        } catch (error) {
            logger.error({ error, key }, 'Cache getAllHash error');
            return {};
        }
    }

    async addToSet(key: string, ...members: string[]): Promise<void> {
        try {
            await this.client.sadd(key, ...members);
        } catch (error) {
            logger.error({ error, key }, 'Cache addToSet error');
        }
    }

    async getSet(key: string): Promise<string[]> {
        try {
            return await this.client.smembers(key);
        } catch (error) {
            logger.error({ error, key }, 'Cache getSet error');
            return [];
        }
    }

    async isInSet(key: string, member: string): Promise<boolean> {
        try {
            const result = await this.client.sismember(key, member);
            return result === 1;
        } catch (error) {
            logger.error({ error, key, member }, 'Cache isInSet error');
            return false;
        }
    }

    getClient(): Redis {
        return this.client;
    }

    isHealthy(): boolean {
        return this.isConnected;
    }

    async close(): Promise<void> {
        await this.client.quit();
    }
}

export const cacheService = new CacheService();
export default cacheService;
