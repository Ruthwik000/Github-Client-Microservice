import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../config';
import logger from '../utils/logger';
import { normalizeRepoId } from '../utils/fileUtils';

export class GitService {
    private cacheDir: string;

    constructor() {
        this.cacheDir = config.storage.cacheDir;
    }

    async cloneRepository(repoUrl: string, branch: string = 'main'): Promise<string> {
        const repoId = normalizeRepoId(repoUrl);
        const repoPath = path.join(this.cacheDir, repoId.replace('/', '_'));

        try {
            // Ensure cache directory exists
            await fs.mkdir(this.cacheDir, { recursive: true });

            // Check if repo already exists
            const exists = await this.repositoryExists(repoPath);

            if (exists) {
                logger.info({ repoId, repoPath }, 'Repository already cloned, pulling latest');
                await this.pullRepository(repoPath, branch);
                return repoPath;
            }

            // Clone the repository
            logger.info({ repoUrl, branch, repoPath }, 'Cloning repository');
            const git: SimpleGit = simpleGit();

            await git.clone(repoUrl, repoPath, {
                '--depth': 1,
                '--single-branch': null,
                '--branch': branch,
            });

            logger.info({ repoId, repoPath }, 'Repository cloned successfully');
            return repoPath;
        } catch (error) {
            logger.error({ error, repoUrl, branch }, 'Failed to clone repository');
            throw error;
        }
    }

    async pullRepository(repoPath: string, branch: string = 'main'): Promise<void> {
        try {
            const git: SimpleGit = simpleGit(repoPath);
            await git.checkout(branch);
            await git.pull('origin', branch);
            logger.info({ repoPath, branch }, 'Repository updated');
        } catch (error) {
            logger.error({ error, repoPath, branch }, 'Failed to pull repository');
            throw error;
        }
    }

    async repositoryExists(repoPath: string): Promise<boolean> {
        try {
            await fs.access(path.join(repoPath, '.git'));
            return true;
        } catch {
            return false;
        }
    }

    async deleteRepository(repoId: string): Promise<void> {
        const repoPath = path.join(this.cacheDir, repoId.replace('/', '_'));

        try {
            await fs.rm(repoPath, { recursive: true, force: true });
            logger.info({ repoId, repoPath }, 'Repository deleted');
        } catch (error) {
            logger.error({ error, repoId }, 'Failed to delete repository');
            throw error;
        }
    }

    getRepositoryPath(repoId: string): string {
        return path.join(this.cacheDir, repoId.replace('/', '_'));
    }

    async getRepositorySize(repoPath: string): Promise<number> {
        try {
            let totalSize = 0;

            async function calculateSize(dirPath: string): Promise<void> {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);

                    if (entry.isDirectory()) {
                        // Skip .git directory
                        if (entry.name === '.git') continue;
                        await calculateSize(fullPath);
                    } else {
                        const stats = await fs.stat(fullPath);
                        totalSize += stats.size;
                    }
                }
            }

            await calculateSize(repoPath);
            return totalSize;
        } catch (error) {
            logger.error({ error, repoPath }, 'Failed to calculate repository size');
            return 0;
        }
    }
}

export const gitService = new GitService();
export default gitService;
