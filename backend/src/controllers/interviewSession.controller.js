import { AppError } from '../utils/AppError.js';
import {
  getInterviewForSession,
  countQuestionsForInterview,
  countFollowUpsForInterview,
  startInterviewSession,
  findQuestionForInterview,
  submitAnswerAndAdvance,
  getFeedbackItems,
} from '../services/interviewSession.service.js';
import { transcribeAudioBuffer } from '../services/speech/deepgram.service.js';
import { evaluateAnswer } from '../services/ai/answerEvaluation.service.js';
import { computeSpeakingMetrics } from '../services/speakingMetrics.service.js';
import { query } from '../config/db.js';

const MAX_FOLLOW_UPS_PER_INTERVIEW = 2;

function parseInterviewId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid interview id.', 400);
  }
  return id;
}

async function buildSessionPayload(interviewId, userId) {
  const interview = await getInterviewForSession(interviewId, userId);
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  const questionsResult = await query(
    'SELECT id, order_index, text, category, is_follow_up FROM questions WHERE interview_id = $1 ORDER BY order_index ASC',
    [interviewId]
  );
  const questions = questionsResult.rows;

  const answeredResult = await query('SELECT COUNT(*)::int AS count FROM answers WHERE interview_id = $1', [
    interviewId,
  ]);
  const answeredCount = answeredResult.rows[0].count;

  let currentQuestion = null;
  if (interview.status === 'in_progress') {
    const match = questions.find((q) => q.order_index === interview.current_question_index);
    if (match) {
      currentQuestion = {
        id: match.id,
        orderIndex: match.order_index,
        text: match.text,
        category: match.category,
        isFollowUp: match.is_follow_up,
      };
    }
  }

  return {
    id: interview.id,
    status: interview.status,
    startedAt: interview.started_at,
    endedAt: interview.ended_at,
    durationSeconds: interview.duration_seconds,
    currentQuestionIndex: interview.current_question_index,
    totalQuestions: questions.length,
    answeredCount,
    currentQuestion,
  };
}

export async function getSession(req, res) {
  const id = parseInterviewId(req.params.id);
  const payload = await buildSessionPayload(id, req.user.id);
  res.status(200).json({ success: true, data: payload });
}

export async function startInterview(req, res) {
  const id = parseInterviewId(req.params.id);

  const interview = await getInterviewForSession(id, req.user.id);
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }
  if (interview.status !== 'created') {
    throw new AppError('This interview has already been started or completed.', 409);
  }

  const totalQuestions = await countQuestionsForInterview(id);
  if (totalQuestions === 0) {
    throw new AppError('Generate questions before starting the interview.', 422);
  }

  const started = await startInterviewSession(id, req.user.id);
  if (!started) {
    throw new AppError('This interview has already been started or completed.', 409);
  }

  const payload = await buildSessionPayload(id, req.user.id);
  res.status(200).json({ success: true, data: payload });
}

export async function submitAnswer(req, res) {
  const id = parseInterviewId(req.params.id);
  const { questionId, answerText, durationSeconds, transcript, speechWords } = req.body;

  const interview = await getInterviewForSession(id, req.user.id);
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }
  if (interview.status !== 'in_progress') {
    throw new AppError('This interview session is not currently active.', 409);
  }

  const question = await findQuestionForInterview(questionId, id);
  if (!question) {
    throw new AppError('This question does not belong to this interview.', 400);
  }
  if (question.order_index !== interview.current_question_index) {
    throw new AppError('Please answer the current question before moving on.', 409);
  }

  let allowFollowUp = false;
  if (!question.is_follow_up && interview.mode !== 'quick') {
    const existingFollowUps = await countFollowUpsForInterview(id);
    allowFollowUp = existingFollowUps < MAX_FOLLOW_UPS_PER_INTERVIEW;
  }

  let evaluation = null;
  let evaluationError = null;
  try {
    evaluation = await evaluateAnswer({
      roleName: interview.role_name,
      difficulty: interview.difficulty,
      category: question.category,
      questionText: question.text,
      answerText,
      allowFollowUp,
    });
  } catch (error) {
    console.error('Answer evaluation failed:', error.message);
    evaluationError = 'Could not evaluate this answer automatically. Your answer has been saved.';
  }

  const followUpToInsert =
    allowFollowUp && evaluation?.needsFollowUp && evaluation.followUpQuestion
      ? { text: evaluation.followUpQuestion, category: question.category }
      : null;

  // Speaking metrics are computed only from real word timestamps the client
  // sent along — never estimated from duration alone.
  const speakingMetrics = speechWords
    ? computeSpeakingMetrics({ transcript: transcript || answerText, words: speechWords })
    : null;

  try {
    await submitAnswerAndAdvance({
      interviewId: id,
      questionId,
      questionOrderIndex: question.order_index,
      answerText,
      durationSeconds,
      transcript,
      technicalScore: evaluation?.technicalScore,
      communicationScore: evaluation?.communicationScore,
      feedback: evaluation?.feedback,
      betterAnswer: evaluation?.betterAnswer,
      followUp: followUpToInsert,
      speakingMetrics,
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('This question has already been answered.', 409);
    }
    throw error;
  }

  const payload = await buildSessionPayload(id, req.user.id);
  res.status(200).json({
    success: true,
    data: {
      ...payload,
      lastEvaluation: evaluation,
      evaluationError,
      followUpAdded: Boolean(followUpToInsert),
      followUpReason: followUpToInsert ? evaluation.followUpReason : null,
    },
  });
}

export async function transcribeAudio(req, res) {
  const id = parseInterviewId(req.params.id);

  const interview = await getInterviewForSession(id, req.user.id);
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  const { transcript, confidence, words } = await transcribeAudioBuffer(req.file.buffer, req.file.mimetype);

  if (!transcript) {
    throw new AppError(
      "We couldn't hear anything clearly in that recording. Please try again or type your answer instead.",
      422
    );
  }

  res.status(200).json({ success: true, data: { transcript, confidence, words } });
}

export async function getFeedback(req, res) {
  const id = parseInterviewId(req.params.id);

  const interview = await getInterviewForSession(id, req.user.id);
  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  const rows = await getFeedbackItems(id);

  const items = rows.map((row) => ({
    question: {
      id: row.question_id,
      orderIndex: row.order_index,
      text: row.question_text,
      category: row.category,
      isFollowUp: row.is_follow_up,
    },
    answer: row.answer_id
      ? {
          id: row.answer_id,
          text: row.answer_text,
          durationSeconds: row.duration_seconds,
          technicalScore: row.technical_score,
          communicationScore: row.communication_score,
          feedback: row.feedback,
          betterAnswer: row.better_answer,
          answeredAt: row.answered_at,
          wasEvaluated: row.technical_score !== null,
        }
      : null,
  }));

  res.status(200).json({
    success: true,
    data: {
      interview: {
        id: interview.id,
        roleName: interview.role_name,
        difficulty: interview.difficulty,
        mode: interview.mode,
        status: interview.status,
      },
      items,
    },
  });
}