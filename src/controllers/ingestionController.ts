import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ingestRequestSchema } from '../middleware/validation';
import { ingestionService } from '../services/IngestionService';
import logger from '../utils/logger';

export const ingestRepository = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = ingestRequestSchema.parse(req.body);

    logger.info({ repoUrl: validatedData.repoUrl, branch: validatedData.branch }, 'Ingestion requested');

    const job = await ingestionService.ingestRepository(
        validatedData.repoUrl,
        validatedData.branch
    );

    res.status(202).json({
        jobId: job.id,
        status: job.status,
        repoId: job.repoId,
        message: 'Ingestion started',
    });
});

export const getIngestionStatus = asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const job = await ingestionService.getJob(jobId);

    if (!job) {
        throw new AppError(404, 'Job not found');
    }

    res.json({
        jobId: job.id,
        repoId: job.repoId,
        status: job.status,
        progress: job.progress,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
        stats: job.stats,
    });
});

export const deleteRepository = asyncHandler(async (req: Request, res: Response) => {
    const { repoId } = req.params;

    await ingestionService.deleteRepository(repoId);

    res.json({
        message: 'Repository deleted successfully',
        repoId,
    });
});
