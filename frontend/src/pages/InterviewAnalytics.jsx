import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mic, Clock, ListChecks, Gauge, MessageCircle, PauseCircle } from 'lucide-react';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fetchInterview, fetchInterviewAnalytics } from '../services/interview.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import './InterviewAnalytics.css';

const CATEGORY_LABELS = {
  technical: 'Technical',
  project: 'Project',
  behavioral: 'Behavioral',
  role_specific: 'Role-specific',
  problem_solving: 'Problem solving',
};

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="analytics-stat">
      <Icon size={18} aria-hidden="true" />
      <div>
        <p className="analytics-stat__value">{value}</p>
        <p className="analytics-stat__label">{label}</p>
      </div>
    </div>
  );
}

export default function InterviewAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [interviewData, analyticsData] = await Promise.all([
        fetchInterview(id),
        fetchInterviewAnalytics(id),
      ]);
      setInterview(interviewData);
      setAnalytics(analyticsData);
      setStatus('ready');
    } catch (error) {
      if (error?.response?.status === 404) {
        setStatus('not-found');
      } else {
        setStatus('error');
      }
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') {
    return (
      <div className="interview-analytics">
        <Skeleton style={{ width: 120, height: 16, marginBottom: 16 }} />
        <Skeleton style={{ width: '100%', height: 220 }} />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="interview-analytics">
        <div className="card">
          <EmptyState
            icon={Mic}
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
      <div className="interview-analytics">
        <p className="form-error-banner" role="alert">
          {getErrorMessage({ response: {} }, 'Could not load speaking analytics.')}
        </p>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </div>
    );
  }

  const hasSpeechData = analytics.answersWithSpeechCount > 0;
  const fillerEntries = Object.entries(analytics.fillerWordBreakdown || {});

  return (
    <div className="interview-analytics">
      <button className="resume-detail__back" onClick={() => navigate(`/interviews/${id}`)}>
        <ArrowLeft size={16} aria-hidden="true" /> Back to interview details
      </button>

      <div>
        <h1>Speaking analytics</h1>
        <p className="interview-analytics__subtitle">
          {interview.roleName} · {interview.difficulty}
        </p>
      </div>

      <div className="card analytics-stats-grid">
        <StatCard icon={Clock} label="Total interview duration" value={formatDuration(analytics.totalInterviewDurationSeconds)} />
        <StatCard icon={ListChecks} label="Questions answered" value={analytics.questionsAnswered} />
        <StatCard icon={Clock} label="Average answer duration" value={formatDuration(analytics.averageAnswerDurationSeconds)} />
      </div>

      {!hasSpeechData && (
        <div className="card">
          <EmptyState
            icon={Mic}
            title="No speaking data yet"
            description="Speaking speed, filler words and pauses are measured from recorded and transcribed answers. Answers you typed directly don't include this data."
          />
        </div>
      )}

      {hasSpeechData && (
        <>
          <p className="interview-analytics__coverage">
            Based on {analytics.answersWithSpeechCount} of {analytics.questionsAnswered} answered question
            {analytics.questionsAnswered === 1 ? '' : 's'} that were recorded and transcribed.
          </p>

          <div className="card analytics-stats-grid">
            <StatCard icon={Gauge} label="Average speaking speed" value={`${analytics.averageSpeakingSpeedWpm} wpm`} />
            <StatCard icon={MessageCircle} label="Total filler words" value={analytics.totalFillerWords} />
            <StatCard icon={PauseCircle} label="Long pauses" value={analytics.totalLongPauses} />
          </div>

          {fillerEntries.length > 0 && (
            <div className="card">
              <h2 className="interview-analytics__section-title">Filler word breakdown</h2>
              <div className="filler-breakdown">
                {fillerEntries.map(([word, count]) => (
                  <span key={word} className="filler-breakdown__item">
                    <span className="filler-breakdown__word">{word}</span>
                    <span className="filler-breakdown__count">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="interview-analytics__section-title">Per-question detail</h2>
            <div className="analytics-table">
              {analytics.perAnswer.map((item) => (
                <div key={item.orderIndex} className="analytics-table__row">
                  <span className="analytics-table__index">{item.orderIndex + 1}</span>
                  <span className="analytics-table__category">{CATEGORY_LABELS[item.category] || item.category}</span>
                  <span className="analytics-table__duration">{formatDuration(item.durationSeconds)}</span>
                  {item.hasSpeechData ? (
                    <span className="analytics-table__speech">
                      {item.speakingSpeedWpm} wpm · {item.fillerWordCount} filler · {item.longPauseCount} pause
                      {item.longPauseCount === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="analytics-table__speech analytics-table__speech--muted">Typed answer</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}