import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(50, 'Project name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Project name can only contain letters, numbers, spaces, hyphens, and underscores'),
  platform: z.enum(['REACT_NATIVE', 'EXPO'], {
    message: 'Please select a valid platform',
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
