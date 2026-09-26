import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

const client = new GoogleGenAI({ apiKey: env.gemini.apiKey });

function stripCodeFences(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  const message = error.message || '';
  return message.includes('503') || message.includes('UNAVAILABLE') || message.includes('429');
}

/**
 * Sends a prompt expecting a single JSON object back. Retries up to 4 times
 * total, with an increasing delay, since a 503 "model overloaded" response
 * is usually resolved within seconds to a couple of minutes. Throws
 * AppError(502) if all attempts fail — callers must never fabricate a
 * fallback result.
 */
export async function completeJson({ systemPrompt, userPrompt, schema, maxTokens = 2000 }) {
  const MAX_ATTEMPTS = 4;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
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

      if (attempt < MAX_ATTEMPTS && isRetryableError(error)) {
        const delayMs = attempt * 3000; // 3s, 6s, 9s
        console.error(`Retrying in ${delayMs / 1000}s...`);
        await sleep(delayMs);
      } else if (!isRetryableError(error)) {
        break; // non-retryable (e.g. bad JSON, validation) — stop early
      }
    }
  }

  throw new AppError(
    'The AI service is experiencing high demand right now. Please try again in a minute.',
    502
  );
}