import { z } from 'zod';

export const provisionGithubSchema = z.object({
  repositoryUrl: z.string().url('Must be a valid URL').regex(/^https:\/\/github\.com\//, 'Must be a valid GitHub URL'),
});

export const provisionDatabaseSchema = z.object({
  connectionString: z.string().min(1, 'Connection string is required').regex(/^(postgres|postgresql|mysql|mongodb|mongodb\+srv):\/\//i, 'Must be a valid connection string URI'),
});

export const provisionObjectStorageSchema = z.object({
  bucketName: z.string().min(3).max(63).regex(/^[a-z0-9.-]+$/, 'Bucket name must follow AWS naming conventions (lowercase, alphanumeric, hyphens)'),
  accessKeyId: z.string().min(16, 'Access Key ID must be at least 16 characters'),
  secretAccessKey: z.string().min(32, 'Secret Access Key must be at least 32 characters'),
});

export const provisionCustomSchema = z.object({
  genericText: z.string().max(2000, 'Text must be at most 2000 characters').optional(),
});
