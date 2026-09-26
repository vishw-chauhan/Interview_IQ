import { z } from 'zod';

const CATEGORIES = ['technical', 'project', 'behavioral', 'role_specific', 'problem_solving'];

export function buildQuestionsSchema(expectedCount) {
  return z.object({
    questions: z
      .array(
        z.object({
          text: z.string().min(1),
          category: z.enum(CATEGORIES),
        })
      )
      .length(expectedCount, `Expected exactly ${expectedCount} questions.`),
  });
}