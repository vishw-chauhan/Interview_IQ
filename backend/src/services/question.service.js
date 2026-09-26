import { query, pool } from '../config/db.js';

export async function replaceQuestionsForInterview(interviewId, questions) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM questions WHERE interview_id = $1', [interviewId]);

    const inserted = [];
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const result = await client.query(
        `INSERT INTO questions (interview_id, order_index, text, category)
         VALUES ($1, $2, $3, $4)
         RETURNING id, order_index, text, category, is_follow_up, parent_question_id, created_at`,
        [interviewId, i, q.text, q.category]
      );
      inserted.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listQuestionsByInterview(interviewId) {
  const result = await query(
    `SELECT id, order_index, text, category, is_follow_up, parent_question_id, created_at
     FROM questions
     WHERE interview_id = $1
     ORDER BY order_index ASC`,
    [interviewId]
  );
  return result.rows;
}