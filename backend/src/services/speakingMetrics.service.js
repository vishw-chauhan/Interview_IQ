const FILLER_WORDS = [
  'um',
  'umm',
  'uh',
  'uhh',
  'like',
  'you know',
  'sort of',
  'kind of',
  'basically',
  'actually',
  'literally',
  'i mean',
];

const LONG_PAUSE_THRESHOLD_SECONDS = 2;

function countFillerWords(transcript) {
  const lowerText = transcript.toLowerCase();
  const breakdown = {};
  let total = 0;

  for (const filler of FILLER_WORDS) {
    // Word-boundary match so "like" doesn't match inside "likely".
    const pattern = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'g');
    const matches = lowerText.match(pattern);
    if (matches && matches.length > 0) {
      breakdown[filler] = matches.length;
      total += matches.length;
    }
  }

  return { total, breakdown };
}

/**
 * Computes speaking metrics from Deepgram word timestamps. Returns null when
 * there isn't enough timing data to measure anything meaningfully (fewer
 * than 2 words) — never fabricates a speed or pause count from nothing.
 */
export function computeSpeakingMetrics({ transcript, words }) {
  if (!Array.isArray(words) || words.length < 2) {
    return null;
  }

  const sorted = [...words].sort((a, b) => a.start - b.start);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const speakingDurationSeconds = Math.max(0.1, last.end - first.start);
  const wordCount = sorted.length;
  const speakingSpeedWpm = Math.round(wordCount / (speakingDurationSeconds / 60));

  let longPauseCount = 0;
  let longestPauseSeconds = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i].start - sorted[i - 1].end;
    if (gap >= LONG_PAUSE_THRESHOLD_SECONDS) {
      longPauseCount += 1;
      longestPauseSeconds = Math.max(longestPauseSeconds, gap);
    }
  }

  const { total: fillerWordCount, breakdown: fillerWordBreakdown } = countFillerWords(transcript || '');

  return {
    wordCount,
    speakingDurationSeconds: Math.round(speakingDurationSeconds * 10) / 10,
    speakingSpeedWpm,
    fillerWordCount,
    fillerWordBreakdown,
    longPauseCount,
    longestPauseSeconds: Math.round(longestPauseSeconds * 10) / 10,
  };
}