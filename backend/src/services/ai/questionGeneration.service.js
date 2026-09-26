import { completeJson } from './llm.service.js';
import { buildInterviewQuestionsPrompt } from '../../prompts/interviewQuestions.prompt.js';
import { buildQuestionsSchema } from '../../validators/interviewQuestions.validator.js';

const SYSTEM_PROMPT =
  'You are a precise, experienced technical interviewer. You always respond with a single valid JSON object and nothing else. Your questions are specific, realistic, and appropriately calibrated to the stated difficulty.';

const QUESTION_COUNT_BY_MODE = {
  quick: 5,
  standard: 8,
  deep: 12,
};

export function getQuestionCountForMode(mode) {
  return QUESTION_COUNT_BY_MODE[mode] || QUESTION_COUNT_BY_MODE.standard;
}

export async function generateInterviewQuestions({ roleName, difficulty, mode, resumeAnalysis }) {
  const questionCount = getQuestionCountForMode(mode);
  const userPrompt = buildInterviewQuestionsPrompt({ roleName, difficulty, questionCount, resumeAnalysis });
  const schema = buildQuestionsSchema(questionCount);

  const result = await completeJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema,
    maxTokens: 3000,
  });

  return result.questions;
}