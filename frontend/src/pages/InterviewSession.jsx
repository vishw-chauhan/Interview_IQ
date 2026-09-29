import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  Send,
  ListChecks,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  GitBranch,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import MediaPanel from '../components/MediaPanel.jsx';
import { useMediaRecorder } from '../hooks/useMediaRecorder.js';
import {
  fetchSession,
  startInterviewSession,
  submitAnswer,
  transcribeAudio,
} from '../services/interview.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import './InterviewSession.css';

const CATEGORY_LABELS = {
  technical: 'Technical',
  project: 'Project',
  behavioral: 'Behavioral',
  role_specific: 'Role-specific',
  problem_solving: 'Problem solving',
};

const LOW_CONFIDENCE_THRESHOLD = 0.6;

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function ScoreBadge({ label, score }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const tone = safeScore >= 75 ? 'good' : safeScore >= 50 ? 'mid' : 'low';
  return (
    <div className={`answer-review__score answer-review__score--${tone}`}>
      <span className="answer-review__score-value">{safeScore}</span>
      <span className="answer-review__score-label">{label}</span>
    </div>
  );
}

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const media = useMediaRecorder();

  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found
  const [loadError, setLoadError] = useState('');

  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [lastTranscript, setLastTranscript] = useState('');
  const [transcriptConfidence, setTranscriptConfidence] = useState(null);

  const [reviewState, setReviewState] = useState(null);

  const questionStartRef = useRef(Date.now());

  const load = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const data = await fetchSession(id);
      setSession(data);
      setStatus('ready');
    } catch (error) {
      if (error?.response?.status === 404) {
        setStatus('not-found');
      } else {
        setLoadError(getErrorMessage(error, 'Could not load this interview session.'));
        setStatus('error');
      }
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (session?.currentQuestion) {
      questionStartRef.current = Date.now();
      setAnswerText('');
      setLastTranscript('');
      setTranscriptConfidence(null);
      media.resetRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.currentQuestion?.id]);

  useEffect(() => {
    if (session?.status === 'completed') {
      media.releaseStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status]);

  async function handleStart() {
    setStartError('');
    setIsStarting(true);
    try {
      const updated = await startInterviewSession(id);
      setSession(updated);
    } catch (error) {
      setStartError(getErrorMessage(error, 'Could not start the interview.'));
    } finally {
      setIsStarting(false);
    }
  }

  const handleTranscribe = useCallback((audioBlob) => transcribeAudio(id, audioBlob), [id]);

  function handleTranscribed(transcript, confidence) {
    setAnswerText(transcript);
    setLastTranscript(transcript);
    setTranscriptConfidence(confidence);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    if (!answerText.trim()) {
      setSubmitError('Please enter an answer before submitting.');
      return;
    }

    const durationSeconds = Math.round((Date.now() - questionStartRef.current) / 1000);
    const transcriptToSend = answerText.trim() === lastTranscript.trim() ? lastTranscript : undefined;

    setIsSubmitting(true);
    try {
      const updated = await submitAnswer(id, {
        questionId: session.currentQuestion.id,
        answerText: answerText.trim(),
        durationSeconds,
        transcript: transcriptToSend,
      });
      const { lastEvaluation, evaluationError, followUpAdded, followUpReason, ...nextSession } = updated;
      setReviewState({ evaluation: lastEvaluation, evaluationError, followUpAdded, followUpReason, nextSession });
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Could not submit your answer.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    if (!reviewState) return;
    setSession(reviewState.nextSession);
    setReviewState(null);
  }

  if (status === 'loading') {
    return (
      <div className="interview-session">
        <Skeleton style={{ width: 120, height: 16, marginBottom: 16 }} />
        <Skeleton style={{ width: '100%', height: 220 }} />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="interview-session">
        <div className="card">
          <EmptyState
            icon={ListChecks}
            title="Interview not found"
            description="It may have been deleted, or it doesn't belong to your account."
            action={<Link to="/interviews/new"><Button variant="secondary">Back to interviews</Button></Link>}
          />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="interview-session">
        <p className="form-error-banner" role="alert">{loadError}</p>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </div>
    );
  }

  if (reviewState) {
    const { evaluation, evaluationError, followUpAdded, followUpReason } = reviewState;
    return (
      <div className="interview-session">
        <div className="card answer-review">
          <h1>Answer feedback</h1>

          {evaluation ? (
            <>
              <div className="answer-review__scores">
                <ScoreBadge label="Technical" score={evaluation.technicalScore} />
                <ScoreBadge label="Communication" score={evaluation.communicationScore} />
              </div>

              <div className="answer-review__feedback">
                <p>
                  <strong>What went well:</strong> {evaluation.feedback.wellDone}
                </p>
                <p>
                  <strong>What was missing:</strong> {evaluation.feedback.missing}
                </p>
                <p className="answer-review__tip">
                  <Lightbulb size={15} aria-hidden="true" />
                  {evaluation.feedback.tip}
                </p>
              </div>

              <div className="answer-review__better">
                <h2>A stronger answer might look like</h2>
                <p>{evaluation.betterAnswer}</p>
              </div>

              {followUpAdded && (
                <div className="answer-review__followup">
                  <GitBranch size={16} aria-hidden="true" />
                  <div>
                    <p className="answer-review__followup-title">Follow-up question added</p>
                    <p>{followUpReason}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="answer-review__error">
              <AlertTriangle size={16} aria-hidden="true" />
              {evaluationError}
            </p>
          )}

          <Button onClick={handleContinue}>
            <ArrowRight size={16} aria-hidden="true" />
            {reviewState.nextSession.status === 'completed' ? 'View summary' : 'Continue'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-session">
      <button
        className="resume-detail__back"
        onClick={() => {
          media.releaseStream();
          navigate(`/interviews/${id}`);
        }}
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to interview details
      </button>

      {session.status === 'created' && (
        <div className="card interview-session__start">
          <PlayCircle size={32} aria-hidden="true" />
          <h1>Ready to begin?</h1>
          <p>
            This session has {session.totalQuestions} question{session.totalQuestions === 1 ? '' : 's'}. Once you
            start, answer each question in order — you can&apos;t skip ahead.
          </p>
          {startError && (
            <p className="form-error-banner" role="alert">
              {startError}
            </p>
          )}
          {session.totalQuestions === 0 ? (
            <p className="interview-session__hint">
              No questions have been generated yet. <Link to={`/interviews/${id}`}>Go back and generate them.</Link>
            </p>
          ) : (
            <Button onClick={handleStart} loading={isStarting}>
              Start interview
            </Button>
          )}
        </div>
      )}

      {session.status === 'in_progress' && session.currentQuestion && (
        <>
          <div className="interview-session__progress">
            <div className="interview-session__progress-bar">
              <div
                className="interview-session__progress-fill"
                style={{ width: `${(session.answeredCount / session.totalQuestions) * 100}%` }}
              />
            </div>
            <span className="interview-session__progress-label">
              Question {session.currentQuestion.orderIndex + 1} of {session.totalQuestions}
            </span>
          </div>

          <div className="card interview-session__question">
            <div className="interview-session__tags">
              <span className="interview-session__category">
                {CATEGORY_LABELS[session.currentQuestion.category] || session.currentQuestion.category}
              </span>
              {session.currentQuestion.isFollowUp && (
                <span className="interview-session__followup-badge">
                  <GitBranch size={12} aria-hidden="true" />
                  Follow-up
                </span>
              )}
            </div>
            <p className="interview-session__question-text">{session.currentQuestion.text}</p>
          </div>

          <MediaPanel media={media} onTranscribe={handleTranscribe} onTranscribed={handleTranscribed} />

          <form className="card interview-session__answer-form" onSubmit={handleSubmit}>
            <label htmlFor="answerText" className="interview-session__label">
              Your answer
            </label>
            <textarea
              id="answerText"
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              rows={8}
              placeholder="Type your answer here, or record above and click Use this recording..."
              disabled={isSubmitting}
              className="interview-session__textarea"
            />
            {transcriptConfidence !== null &&
              transcriptConfidence < LOW_CONFIDENCE_THRESHOLD &&
              answerText.trim() === lastTranscript.trim() && (
                <p className="interview-session__low-confidence">
                  <AlertTriangle size={14} aria-hidden="true" />
                  This transcription may not be fully accurate — please review it before submitting.
                </p>
              )}
            {submitError && (
              <p className="form-error-banner" role="alert">
                {submitError}
              </p>
            )}
            <Button type="submit" loading={isSubmitting}>
              <Send size={16} aria-hidden="true" />
              Submit answer
            </Button>
          </form>
        </>
      )}

      {session.status === 'completed' && (
        <div className="card interview-session__complete">
          <CheckCircle2 size={36} aria-hidden="true" />
          <h1>Interview complete</h1>
          <p>
            You answered {session.answeredCount} of {session.totalQuestions} questions in{' '}
            {formatDuration(session.durationSeconds)}.
          </p>
          <p className="interview-session__hint">
            A full breakdown of every answer is coming in Phase 14, and an aggregate performance report in Phase 15.
          </p>
          <Link to={`/interviews/${id}`}>
            <Button variant="secondary">Back to interview details</Button>
          </Link>
        </div>
      )}
    </div>
  );
}