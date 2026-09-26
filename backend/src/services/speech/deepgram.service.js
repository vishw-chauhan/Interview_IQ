import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

const DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&language=en';

/**
 * Sends an audio buffer to Deepgram's pre-recorded transcription API and
 * returns the transcript and confidence. Throws AppError(502) if the
 * service call itself fails — never fabricates a transcript.
 */
export async function transcribeAudioBuffer(buffer, mimeType) {
  let response;
  try {
    response = await fetch(DEEPGRAM_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${env.deepgram.apiKey}`,
        'Content-Type': mimeType,
      },
      body: buffer,
    });
  } catch (error) {
    console.error('Deepgram request failed:', error.message);
    throw new AppError('The speech-to-text service could not be reached. Please try again.', 502);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error(`Deepgram responded with ${response.status}:`, errorText);
    throw new AppError('The speech-to-text service could not process this recording. Please try again.', 502);
  }

  const data = await response.json();
  const alternative = data?.results?.channels?.[0]?.alternatives?.[0];

  if (!alternative) {
    console.error('Deepgram response missing expected structure:', JSON.stringify(data));
    throw new AppError('The speech-to-text service returned an unexpected response.', 502);
  }

  return {
    transcript: (alternative.transcript || '').trim(),
    confidence: typeof alternative.confidence === 'number' ? alternative.confidence : null,
  };
}