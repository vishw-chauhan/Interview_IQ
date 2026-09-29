import { z } from 'zod';

export const learningRoadmapSchema = z.object({
  roadmap: z
    .array(
      z.object({
        skill: z.string().min(1),
        priority: z.enum(['high', 'medium', 'low']),
        why: z.string().min(1),
        recommendation: z.string().min(1),
      })
    )
    .min(1),
  overview: z.string().min(1),
});