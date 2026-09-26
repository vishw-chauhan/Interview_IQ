import { z } from 'zod';

export const resumeAnalysisSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  skills: z.object({
    found: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  roleRelevance: z.object({
    score: z.number().int().min(0).max(100),
    notes: z.string(),
  }),
  structure: z.object({
    score: z.number().int().min(0).max(100),
    issues: z.array(z.string()),
    strengths: z.array(z.string()),
  }),
  bulletPointQuality: z.object({
    score: z.number().int().min(0).max(100),
    feedback: z.array(z.string()),
  }),
  atsIssues: z.array(z.string()),
  experience: z.object({
    yearsEstimate: z.string(),
    notes: z.string(),
  }),
  education: z.object({
    notes: z.string(),
  }),
  certifications: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});