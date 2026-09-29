import { completeJson } from './llm.service.js';
import { buildPerformanceReportPrompt } from '../../prompts/performanceReport.prompt.js';
import { performanceReportNarrativeSchema } from '../../validators/performanceReport.validator.js';

const SYSTEM_PROMPT =
  'You are a precise, honest technical interviewer writing a performance report. You always respond with a single valid JSON object and nothing else. You never alter or invent scores — you only write narrative text about scores you are given, and you never comment on emotional or psychological state.';

export async function generateReportNarrative(input) {
  const userPrompt = buildPerformanceReportPrompt(input);

  return completeJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    schema: performanceReportNarrativeSchema,
    maxTokens: 1500,
  });
}