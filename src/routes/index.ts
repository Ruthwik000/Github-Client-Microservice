import { Router } from 'express';
import {
    ingestRepository,
    getIngestionStatus,
    deleteRepository,
} from '../controllers/ingestionController';
import { queryRepository } from '../controllers/queryController';
import { healthCheck, getStats } from '../controllers/healthController';

const router = Router();

// Health check
router.get('/health', healthCheck);
router.get('/stats', getStats);

// Ingestion routes
router.post('/ingest', ingestRepository);
router.get('/status/:jobId', getIngestionStatus);
router.delete('/repo/:repoId', deleteRepository);

// Query routes
router.post('/query', queryRepository);

export default router;
