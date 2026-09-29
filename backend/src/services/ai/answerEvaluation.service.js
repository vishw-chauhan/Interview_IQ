import { completeJson } from './llm.service.js';
import { buildAnswerEvaluationPrompt } from '../../prompts/answerEvaluation.prompt.js';
import { buildAnswerEvaluationSchema } from '../../validators/answerEvaluation.validator.js';

const SYSTEM_PROMPT =
  'You are a precise, fair technical interviewer evaluating a single answer. You always respond with a single valid JSON object and nothing else. You score strictly based on the actual content of the answer, and you never comment on the candidate\'s emotional or psychological state.';

export async function evaluateAnswer({ roleName, difficulty, category, questionText, answerText, allowFollowUp }) {
  const userPrompt = buildAnswerEvaluationPrompt({
    roleName,
    difficulty,
    category,
    questionText,
    answerText,
    allowFollowUp,
  });
  const schema = buildAnswerEvaluationSchema(allowFollowUp);

  return completeJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema,
    maxTokens: 1400,
  });
}