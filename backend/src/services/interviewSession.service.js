import { query, pool } from '../config/db.js';

export async function getInterviewForSession(id, userId) {
  const result = await query(
    `SELECT i.id, i.status, i.current_question_index, i.started_at, i.ended_at, i.duration_seconds,
            i.mode, i.difficulty, ro.name AS role_name
     FROM interviews i
     JOIN roles ro ON ro.id = i.role_id
     WHERE i.id = $1 AND i.user_id = $2`,
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

export async function countFollowUpsForInterview(interviewId) {
  const result = await query(
    'SELECT COUNT(*)::int AS count FROM questions WHERE interview_id = $1 AND is_follow_up = TRUE',
    [interviewId]
  );
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
    'SELECT id, order_index, text, category, is_follow_up FROM questions WHERE id = $1 AND interview_id = $2',
    [questionId, interviewId]
  );
  return result.rows[0] || null;
}

export async function submitAnswerAndAdvance({
  interviewId,
  questionId,
  questionOrderIndex,
  answerText,
  durationSeconds,
  transcript,
  technicalScore,
  communicationScore,
  feedback,
  betterAnswer,
  followUp,
  speakingMetrics,
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO answers
         (question_id, interview_id, answer_text, duration_seconds, transcript,
          technical_score, communication_score, feedback, better_answer, speaking_metrics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        questionId,
        interviewId,
        answerText,
        durationSeconds ?? null,
        transcript || null,
        technicalScore ?? null,
        communicationScore ?? null,
        feedback ? JSON.stringify(feedback) : null,
        betterAnswer || null,
        speakingMetrics ? JSON.stringify(speakingMetrics) : null,
      ]
    );

    if (followUp) {
      await client.query(
        `UPDATE questions SET order_index = order_index + 1
         WHERE interview_id = $1 AND order_index > $2`,
        [interviewId, questionOrderIndex]
      );
      await client.query(
        `INSERT INTO questions (interview_id, order_index, text, category, is_follow_up, parent_question_id)
         VALUES ($1, $2, $3, $4, TRUE, $5)`,
        [interviewId, questionOrderIndex + 1, followUp.text, followUp.category, questionId]
      );
    }

    const totalResult = await client.query('SELECT COUNT(*)::int AS count FROM questions WHERE interview_id = $1', [
      interviewId,
    ]);
    const totalQuestions = totalResult.rows[0].count;

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

export async function getFeedbackItems(interviewId) {
  const result = await query(
    `SELECT
       q.id AS question_id,
       q.order_index,
       q.text AS question_text,
       q.category,
       q.is_follow_up,
       a.id AS answer_id,
       a.answer_text,
       a.duration_seconds,
       a.technical_score,
       a.communication_score,
       a.feedback,
       a.better_answer,
       a.created_at AS answered_at
     FROM questions q
     LEFT JOIN answers a ON a.question_id = q.id
     WHERE q.interview_id = $1
     ORDER BY q.order_index ASC`,
    [interviewId]
  );
  return result.rows;
}