import { query, pool } from '../config/db.js';

export async function getInterviewForSession(id, userId) {
  const result = await query(
    `SELECT id, status, current_question_index, started_at, ended_at, duration_seconds, mode, difficulty
     FROM interviews
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function countQuestionsForInterview(interviewId) {
  const result = await query('SELECT COUNT(*)::int AS count FROM questions WHERE interview_id = $1', [
    interviewId,
  ]);
  return result.rows[0].count;
}

export async function startInterviewSession(id, userId) {
  const result = await query(
    `UPDATE interviews
     SET status = 'in_progress', started_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'created'
     RETURNING id, status, current_question_index, started_at, ended_at, duration_seconds`,
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function findQuestionForInterview(questionId, interviewId) {
  const result = await query(
    'SELECT id, order_index, text, category FROM questions WHERE id = $1 AND interview_id = $2',
    [questionId, interviewId]
  );
  return result.rows[0] || null;
}

/**
 * Saves an answer and advances the interview's current_question_index in one
 * transaction. If this was the last question, marks the interview completed
 * with a real elapsed duration. FOR UPDATE locks the interview row so two
 * near-simultaneous submits can't both read the same index and advance twice.
 */
export async function submitAnswerAndAdvance({
  interviewId,
  questionId,
  answerText,
  durationSeconds,
  transcript,
  totalQuestions,
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO answers (question_id, interview_id, answer_text, duration_seconds, transcript)
       VALUES ($1, $2, $3, $4, $5)`,
      [questionId, interviewId, answerText, durationSeconds ?? null, transcript || null]
    );

    const lockedInterview = await client.query(
      'SELECT current_question_index, started_at FROM interviews WHERE id = $1 FOR UPDATE',
      [interviewId]
    );
    const newIndex = lockedInterview.rows[0].current_question_index + 1;
    const isComplete = newIndex >= totalQuestions;

    let updatedInterview;
    if (isComplete) {
      const result = await client.query(
        `UPDATE interviews
         SET current_question_index = $1,
             status = 'completed',
             ended_at = NOW(),
             duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER)
         WHERE id = $2
         RETURNING id, status, current_question_index, started_at, ended_at, duration_seconds`,
        [newIndex, interviewId]
      );
      updatedInterview = result.rows[0];
    } else {
      const result = await client.query(
        `UPDATE interviews SET current_question_index = $1 WHERE id = $2
         RETURNING id, status, current_question_index, started_at, ended_at, duration_seconds`,
        [newIndex, interviewId]
      );
      updatedInterview = result.rows[0];
    }

    await client.query('COMMIT');
    return updatedInterview;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}