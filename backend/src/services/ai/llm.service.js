import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

const client = new GoogleGenAI({ apiKey: env.gemini.apiKey });

function stripCodeFences(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

/**
 * Sends a prompt expecting a single JSON object back. Retries once on
 * malformed JSON or a schema validation failure, since LLM output is
 * occasionally imperfect. Throws AppError(502) if both attempts fail —
 * callers must never fabricate a fallback result.
 *
 * Same interface as the previous Claude-based version, so callers
 * (resumeAnalysis.service.js and later phases) need no changes.
 */
export async function completeJson({ systemPrompt, userPrompt, schema, maxTokens = 2000 }) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model: env.gemini.model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          maxOutputTokens: maxTokens,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('AI response contained no text content.');
      }

      const jsonText = stripCodeFences(text);
      const parsed = JSON.parse(jsonText);
      const validated = schema.parse(parsed);
      return validated;
    } catch (error) {
      lastError = error;
      console.error(`AI call attempt ${attempt} failed:`, error.message);
    }
  }

  throw new AppError(
    'The AI service could not process this request right now. Please try again in a moment.',
    502
  );
}