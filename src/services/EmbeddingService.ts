import OpenAI from 'openai';
import { config } from '../config';
import logger from '../utils/logger';
import { chunkArray } from '../utils/fileUtils';

class EmbeddingService {
    private client: OpenAI;
    private model: string;

    constructor() {
        this.client = new OpenAI({
            apiKey: config.openai.apiKey,
        });
        this.model = config.openai.embeddingModel;
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await this.client.embeddings.create({
                model: this.model,
                input: text,
            });

            return response.data[0].embedding;
        } catch (error) {
            logger.error({ error }, 'Failed to generate embedding');
            throw error;
        }
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) return [];

        try {
            // OpenAI allows up to 2048 inputs per request for embeddings
            const batchSize = 100; // Conservative batch size
            const batches = chunkArray(texts, batchSize);
            const allEmbeddings: number[][] = [];

            for (const batch of batches) {
                const response = await this.client.embeddings.create({
                    model: this.model,
                    input: batch,
                });

                const embeddings = response.data.map(item => item.embedding);
                allEmbeddings.push(...embeddings);

                // Rate limiting - small delay between batches
                if (batches.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            logger.info({ count: texts.length }, 'Generated embeddings');
            return allEmbeddings;
        } catch (error) {
            logger.error({ error, count: texts.length }, 'Failed to generate embeddings');
            throw error;
        }
    }

    async generateEmbeddingsWithRetry(
        texts: string[],
        maxRetries: number = 3
    ): Promise<number[][]> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await this.generateEmbeddings(texts);
            } catch (error) {
                lastError = error as Error;
                logger.warn(
                    { error, attempt: attempt + 1, maxRetries },
                    'Embedding generation failed, retrying'
                );

                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError || new Error('Failed to generate embeddings after retries');
    }
}

export const embeddingService = new EmbeddingService();
export default embeddingService;
