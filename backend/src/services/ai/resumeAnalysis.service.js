import { completeJson } from './llm.service.js';
import { buildResumeAnalysisPrompt } from '../../prompts/resumeAnalysis.prompt.js';
import { resumeAnalysisSchema } from '../../validators/resumeAnalysis.validator.js';

const SYSTEM_PROMPT =
  'You are a precise, honest technical resume reviewer. You always respond with a single valid JSON object and nothing else. You never inflate scores to make the candidate feel good.';

export async function analyzeResumeText({ resumeText, targetRoleName }) {
  const userPrompt = buildResumeAnalysisPrompt({ resumeText, targetRoleName });

  return completeJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema: resumeAnalysisSchema,
    maxTokens: 2500,
  });
}