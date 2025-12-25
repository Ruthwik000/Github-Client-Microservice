import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import cacheService from '../services/CacheService';
import vectorStoreService from '../services/VectorStoreService';

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
    const redisHealthy = cacheService.isHealthy();
    const pineconeHealthy = vectorStoreService.isHealthy();

    const isHealthy = redisHealthy && pineconeHealthy;

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
            redis: redisHealthy ? 'up' : 'down',
            pinecone: pineconeHealthy ? 'up' : 'down',
        },
    });
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
    const pineconeStats = await vectorStoreService.getStats();

    res.json({
        pinecone: pineconeStats,
    });
});
