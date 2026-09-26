import { completeJson } from './llm.service.js';
import { buildResumeImprovementPrompt } from '../../prompts/resumeImprovement.prompt.js';
import { resumeImprovementSchema } from '../../validators/resumeImprovement.validator.js';

const SYSTEM_PROMPT =
  'You are a precise, practical resume writing coach. You always respond with a single valid JSON object and nothing else. Your suggestions are always specific and grounded in the actual resume text provided, never generic.';

export async function improveResumeText({ resumeText, targetRoleName, missingSkills }) {
  const userPrompt = buildResumeImprovementPrompt({ resumeText, targetRoleName, missingSkills });

  return completeJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema: resumeImprovementSchema,
    maxTokens: 2500,
  });
}