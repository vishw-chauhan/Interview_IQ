import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  FileText,
  Gauge,
  Clock,
  Sparkles,
  ListChecks,
  PlayCircle,
  MessageSquareText,
  BarChart3,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fetchInterview, generateQuestions } from '../services/interview.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import './InterviewDetail.css';

const MODE_LABELS = {
  quick: 'Quick (5–10 minutes)',
  standard: 'Standard (15–20 minutes)',
  deep: 'Deep (30–40 minutes)',
};

const CATEGORY_LABELS = {
  technical: 'Technical',
  project: 'Project',
  behavioral: 'Behavioral',
  role_specific: 'Role-specific',
  problem_solving: 'Problem solving',
};

const STATUS_LABELS = {
  created: { text: 'Not started', tone: 'neutral' },
  in_progress: { text: 'In progress', tone: 'pending' },
  completed: { text: 'Completed', tone: 'ok' },
};

function QuestionItem({ question, index }) {
  return (
    <div className="question-item">
      <span className="question-item__number">{index + 1}</span>
      <div className="question-item__body">
        <p className="question-item__text">{question.text}</p>
        <span className="question-item__category">{CATEGORY_LABELS[question.category] || question.category}</span>
      </div>
    </div>
  );
}

export default function InterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found
  const [loadError, setLoadError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const data = await fetchInterview(id);
      setInterview(data);
      setStatus('ready');
    } catch (error) {
      if (error?.response?.status === 404) {
        setStatus('not-found');
      } else {
        setLoadError(getErrorMessage(error, 'Could not load this interview.'));
        setStatus('error');
      }
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setGenerateError('');
    setIsGenerating(true);
    try {
      const updated = await generateQuestions(id);
      setInterview(updated);
    } catch (error) {
      if (error?.response?.status === 409) {
        setGenerateError('Questions cannot be regenerated after the interview session has started.');
      } else {
        setGenerateError(getErrorMessage(error, 'Could not generate questions.'));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="interview-detail">
        <Skeleton style={{ width: 120, height: 16, marginBottom: 16 }} />
        <Skeleton style={{ width: '100%', height: 160 }} />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="interview-detail">
        <div className="card">
          <EmptyState
            icon={Video}
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
      <div className="interview-detail">
        <p className="form-error-banner" role="alert">{loadError}</p>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </div>
    );
  }

  const questions = interview.questions || [];
  const hasQuestions = questions.length > 0;
  const canGenerate = interview.status === 'created';
  const sessionStatus = STATUS_LABELS[interview.status] || STATUS_LABELS.created;
  const hasAnyProgress = interview.status === 'in_progress' || interview.status === 'completed';
  const isCompleted = interview.status === 'completed';

  return (
    <div className="interview-detail">
      <button className="resume-detail__back" onClick={() => navigate('/interviews/new')}>
        <ArrowLeft size={16} aria-hidden="true" /> Back to interviews
      </button>

      <div className="card interview-detail__header">
        <div className="interview-detail__icon">
          <Video size={22} aria-hidden="true" />
        </div>
        <div>
          <h1>{interview.roleName} interview</h1>
          <p className="interview-detail__meta">
            Created {new Date(interview.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`interview-detail__status interview-detail__status--${sessionStatus.tone}`}>
          {sessionStatus.text}
        </span>
      </div>

      <div className="card interview-detail__config">
        <div className="interview-detail__config-item">
          <Gauge size={16} aria-hidden="true" />
          <div>
            <p className="interview-detail__config-label">Difficulty</p>
            <p className="interview-detail__config-value">{interview.difficulty}</p>
          </div>
        </div>
        <div className="interview-detail__config-item">
          <Clock size={16} aria-hidden="true" />
          <div>
            <p className="interview-detail__config-label">Mode</p>
            <p className="interview-detail__config-value">{MODE_LABELS[interview.mode] || interview.mode}</p>
          </div>
        </div>
        <div className="interview-detail__config-item">
          <FileText size={16} aria-hidden="true" />
          <div>
            <p className="interview-detail__config-label">Resume</p>
            <p className="interview-detail__config-value">{interview.resumeName || 'Not linked'}</p>
          </div>
        </div>
      </div>

      {hasQuestions && (
        <div className="card interview-detail__session-cta">
          <div>
            <h2>Interview session</h2>
            <p>
              {interview.status === 'created' && `${questions.length} questions ready. Start when you're ready.`}
              {interview.status === 'in_progress' && 'This session is in progress.'}
              {interview.status === 'completed' && 'This session is complete.'}
            </p>
          </div>
          <div className="interview-detail__session-actions">
            <Link to={`/interviews/${id}/session`}>
              <Button>
                <PlayCircle size={16} aria-hidden="true" />
                {interview.status === 'created' && 'Start interview'}
                {interview.status === 'in_progress' && 'Resume session'}
                {interview.status === 'completed' && 'View summary'}
              </Button>
            </Link>
            {hasAnyProgress && (
              <Link to={`/interviews/${id}/feedback`}>
                <Button variant="secondary">
                  <MessageSquareText size={16} aria-hidden="true" />
                  View feedback
                </Button>
              </Link>
            )}
            {isCompleted && (
              <Link to={`/interviews/${id}/report`}>
                <Button variant="secondary">
                  <BarChart3 size={16} aria-hidden="true" />
                  View report
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="card interview-detail__questions-cta">
        <div>
          <h2>Interview questions</h2>
          <p>
            {hasQuestions
              ? `${questions.length} questions generated for this interview.`
              : 'Generate personalized questions based on your role, difficulty and resume.'}
          </p>
        </div>
        {canGenerate ? (
          <Button onClick={handleGenerate} loading={isGenerating}>
            <Sparkles size={16} aria-hidden="true" />
            {hasQuestions ? 'Regenerate questions' : 'Generate questions'}
          </Button>
        ) : (
          <span className="interview-detail__locked-hint">Locked — session already started</span>
        )}
      </div>

      {generateError && (
        <p className="form-error-banner" role="alert">
          {generateError}
        </p>
      )}

      {!hasQuestions && !isGenerating && (
        <div className="card">
          <EmptyState
            icon={ListChecks}
            title="No questions yet"
            description="Click Generate questions above to create a personalized question set for this interview."
          />
        </div>
      )}

      {hasQuestions && (
        <div className="card">
          <div className="question-list">
            {questions.map((question, index) => (
              <QuestionItem key={question.id} question={question} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}