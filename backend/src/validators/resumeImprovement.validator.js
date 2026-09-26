import { z } from 'zod';

export const resumeImprovementSchema = z.object({
  bulletImprovements: z
    .array(
      z.object({
        original: z.string().min(1),
        improved: z.string().min(1),
        reason: z.string().min(1),
      })
    )
    .min(1),
  missingSkillsPlan: z.array(
    z.object({
      skill: z.string().min(1),
      suggestion: z.string().min(1),
    })
  ),
  roleRelevanceSuggestions: z.array(z.string()).min(1),
  atsSuggestions: z.array(z.string()).min(1),
  summary: z.string().min(1),
});