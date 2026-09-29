import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  GitBranch,
  AlertTriangle,
  MessageSquareText,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fetchInterviewFeedback } from '../services/interview.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import './InterviewFeedback.css';

const CATEGORY_LABELS = {
  technical: 'Technical',
  project: 'Project',
  behavioral: 'Behavioral',
  role_specific: 'Role-specific',
  problem_solving: 'Problem solving',
};

function ScoreBadge({ label, score }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const tone = safeScore >= 75 ? 'good' : safeScore >= 50 ? 'mid' : 'low';
  return (
    <div className={`feedback-score feedback-score--${tone}`}>
      <span className="feedback-score__value">{safeScore}</span>
      <span className="feedback-score__label">{label}</span>
    </div>
  );
}

export default function InterviewFeedback() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found
  const [loadError, setLoadError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const load = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const result = await fetchInterviewFeedback(id);
      setData(result);
      setStatus('ready');
    } catch (error) {
      if (error?.response?.status === 404) {
        setStatus('not-found');
      } else {
        setLoadError(getErrorMessage(error, 'Could not load this interview\u2019s feedback.'));
        setStatus('error');
      }
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') {
    return (
      <div className="interview-feedback">
        <Skeleton style={{ width: 120, height: 16, marginBottom: 16 }} />
        <Skeleton style={{ width: '100%', height: 320 }} />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="interview-feedback">
        <div className="card">
          <EmptyState
            icon={MessageSquareText}
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
      <div className="interview-feedback">
        <p className="form-error-banner" role="alert">{loadError}</p>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </div>
    );
  }

  const { interview, items } = data;

  if (items.length === 0) {
    return (
      <div className="interview-feedback">
        <button className="resume-detail__back" onClick={() => navigate(`/interviews/${id}`)}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to interview details
        </button>
        <div className="card">
          <EmptyState
            icon={MessageSquareText}
            title="No questions yet"
            description="Generate questions for this interview to see feedback here."
          />
        </div>
      </div>
    );
  }

  const active = items[activeIndex];
  const { question, answer } = active;

  return (
    <div className="interview-feedback">
      <button className="resume-detail__back" onClick={() => navigate(`/interviews/${id}`)}>
        <ArrowLeft size={16} aria-hidden="true" /> Back to interview details
      </button>

      <div>
        <h1>Answer feedback</h1>
        <p className="interview-feedback__subtitle">
          {interview.roleName} · {interview.difficulty} · {items.length} question{items.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="interview-feedback__layout">
        <nav className="interview-feedback__stepper" aria-label="Questions">
          {items.map((item, index) => (
            <button
              key={item.question.id}
              type="button"
              className={`interview-feedback__step ${index === activeIndex ? 'interview-feedback__step--active' : ''} ${
                item.answer ? 'interview-feedback__step--answered' : ''
              }`}
              onClick={() => setActiveIndex(index)}
            >
              <span className="interview-feedback__step-number">{index + 1}</span>
              <span className="interview-feedback__step-text">{item.question.text}</span>
            </button>
          ))}
        </nav>

        <div className="interview-feedback__detail">
          <div className="card">
            <div className="interview-feedback__tags">
              <span className="interview-feedback__category">
                {CATEGORY_LABELS[question.category] || question.category}
              </span>
              {question.isFollowUp && (
                <span className="interview-session__followup-badge">
                  <GitBranch size={12} aria-hidden="true" />
                  Follow-up
                </span>
              )}
            </div>
            <p className="interview-feedback__question-text">{question.text}</p>
          </div>

          {!answer && (
            <div className="card">
              <EmptyState icon={MessageSquareText} title="Not answered yet" description="This question hasn't been answered in this interview yet." />
            </div>
          )}

          {answer && (
            <>
              <div className="card">
                <h2 className="interview-feedback__section-title">Your answer</h2>
                <p className="interview-feedback__answer-text">{answer.text}</p>
              </div>

              {answer.wasEvaluated ? (
                <>
                  <div className="card interview-feedback__scores">
                    <ScoreBadge label="Technical" score={answer.technicalScore} />
                    <ScoreBadge label="Communication" score={answer.communicationScore} />
                  </div>

                  <div className="card interview-feedback__feedback-block">
                    <p>
                      <strong>What went well:</strong> {answer.feedback.wellDone}
                    </p>
                    <p>
                      <strong>What was missing:</strong> {answer.feedback.missing}
                    </p>
                    <p className="interview-feedback__tip">
                      <Lightbulb size={15} aria-hidden="true" />
                      {answer.feedback.tip}
                    </p>
                  </div>

                  <div className="card interview-feedback__better">
                    <h2 className="interview-feedback__section-title">A stronger answer might look like</h2>
                    <p>{answer.betterAnswer}</p>
                  </div>
                </>
              ) : (
                <div className="card interview-feedback__not-evaluated">
                  <AlertTriangle size={18} aria-hidden="true" />
                  <p>This answer wasn&apos;t evaluated automatically. Your answer was still saved.</p>
                </div>
              )}
            </>
          )}

          <div className="interview-feedback__nav">
            <Button
              variant="secondary"
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setActiveIndex((i) => Math.min(items.length - 1, i + 1))}
              disabled={activeIndex === items.length - 1}
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}