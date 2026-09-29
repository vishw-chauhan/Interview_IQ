import { z } from 'zod';

const baseEvaluationFields = {
  technicalScore: z.number().int().min(0).max(100),
  communicationScore: z.number().int().min(0).max(100),
  feedback: z.object({
    wellDone: z.string().min(1),
    missing: z.string().min(1),
    tip: z.string().min(1),
  }),
  betterAnswer: z.string().min(1),
};

const followUpFields = {
  needsFollowUp: z.boolean(),
  followUpQuestion: z.string().min(1).nullable(),
  followUpReason: z.string().min(1).nullable(),
};

export function buildAnswerEvaluationSchema(allowFollowUp) {
  return allowFollowUp
    ? z.object({ ...baseEvaluationFields, ...followUpFields })
    : z.object(baseEvaluationFields);
}

// Kept for compatibility with any direct import of a static schema.
export const answerEvaluationSchema = z.object(baseEvaluationFields);