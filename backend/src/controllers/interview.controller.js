import { AppError } from '../utils/AppError.js';
import {
  createInterview,
  listInterviewsByUser,
  findInterviewById,
  findResumeOwnedByUser,
} from '../services/interview.service.js';
import { replaceQuestionsForInterview, listQuestionsByInterview } from '../services/question.service.js';
import { generateInterviewQuestions } from '../services/ai/questionGeneration.service.js';
import { query } from '../config/db.js';

function toPublicInterview(row) {
  return {
    id: row.id,
    roleId: row.role_id,
    roleName: row.role_name,
    resumeId: row.resume_id,
    resumeName: row.resume_name,
    mode: row.mode,
    difficulty: row.difficulty,
    status: row.status,
    currentQuestionIndex: row.current_question_index,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  };
}

function toPublicQuestion(row) {
  return {
    id: row.id,
    orderIndex: row.order_index,
    text: row.text,
    category: row.category,
    isFollowUp: row.is_follow_up,
    parentQuestionId: row.parent_question_id,
  };
}

function parseInterviewId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid interview id.', 400);
  }
  return id;
}

export async function createInterviewHandler(req, res) {
  const { roleId, resumeId, mode, difficulty } = req.body;

  if (resumeId) {
    const owned = await findResumeOwnedByUser(resumeId, req.user.id);
    if (!owned) {
      throw new AppError('Selected resume was not found.', 404);
    }
  }

  try {
    const interview = await createInterview({
      userId: req.user.id,
      resumeId,
      roleId,
      mode,
      difficulty,
    });
    res.status(201).json({ success: true, data: toPublicInterview(interview) });
  } catch (error) {
    if (error.code === '23503') {
      throw new AppError('Selected role does not exist.', 400);
    }
    throw error;
  }
}

export async function listInterviews(req, res) {
  const interviews = await listInterviewsByUser(req.user.id);
  res.status(200).json({ success: true, data: interviews.map(toPublicInterview) });
}

export async function getInterview(req, res) {
  const id = parseInterviewId(req.params.id);
  const interview = await findInterviewById(id, req.user.id);
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }
  const questions = await listQuestionsByInterview(id);
  res.status(200).json({
    success: true,
    data: { ...toPublicInterview(interview), questions: questions.map(toPublicQuestion) },
  });
}

export async function generateQuestions(req, res) {
  const id = parseInterviewId(req.params.id);

  const interviewResult = await query(
    `SELECT i.id, i.mode, i.difficulty, i.status, i.resume_id, ro.name AS role_name
     FROM interviews i
     JOIN roles ro ON ro.id = i.role_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [id, req.user.id]
  );
  const interview = interviewResult.rows[0];

  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  if (interview.status !== 'created') {
    throw new AppError('Questions cannot be regenerated after the interview session has started.', 409);
  }

  let resumeAnalysis = null;
  if (interview.resume_id) {
    const resumeResult = await query('SELECT analysis FROM resumes WHERE id = $1 AND user_id = $2', [
      interview.resume_id,
      req.user.id,
    ]);
    resumeAnalysis = resumeResult.rows[0]?.analysis || null;
  }

  const generated = await generateInterviewQuestions({
    roleName: interview.role_name,
    difficulty: interview.difficulty,
    mode: interview.mode,
    resumeAnalysis,
  });

  const savedQuestions = await replaceQuestionsForInterview(id, generated);

  const updatedInterview = await findInterviewById(id, req.user.id);

  res.status(200).json({
    success: true,
    data: {
      ...toPublicInterview(updatedInterview),
      questions: savedQuestions.map(toPublicQuestion),
    },
  });
}