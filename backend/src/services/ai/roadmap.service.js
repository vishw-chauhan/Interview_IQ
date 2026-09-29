import { completeJson } from './llm.service.js';
import { buildLearningRoadmapPrompt } from '../../prompts/learningRoadmap.prompt.js';
import { learningRoadmapSchema } from '../../validators/learningRoadmap.validator.js';

const SYSTEM_PROMPT =
  'You are a precise, honest career coach. You always respond with a single valid JSON object and nothing else. You only write advice grounded in the specific data given to you — you never invent scores or skills not present in that data.';

export async function generateLearningRoadmap(input) {
  const userPrompt = buildLearningRoadmapPrompt(input);

  return completeJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema: learningRoadmapSchema,
    maxTokens: 1800,
  });
}