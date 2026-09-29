import { z } from 'zod';

const speechWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
});

export const submitAnswerSchema = z.object({
  questionId: z.coerce.number().int().positive('A valid question is required.'),
  answerText: z
    .string()
    .trim()
    .min(1, 'Please enter an answer before submitting.')
    .max(5000, 'Answer is too long. Please keep it under 5000 characters.'),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  transcript: z.string().trim().max(5000).optional(),
  speechWords: z.array(speechWordSchema).max(2000).optional(),
});