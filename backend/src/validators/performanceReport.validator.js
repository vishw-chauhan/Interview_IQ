import { z } from 'zod';

export const performanceReportNarrativeSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  roleReadiness: z.string().min(1),
});