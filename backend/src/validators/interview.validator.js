import { z } from 'zod';

export const createInterviewSchema = z.object({
  roleId: z.coerce.number().int().positive('Select a target role.'),
  resumeId: z.coerce.number().int().positive().optional(),
  mode: z.enum(['quick', 'standard', 'deep'], {
    errorMap: () => ({ message: 'Select an interview mode.' }),
  }),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Select a difficulty level.' }),
  }),
});