import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { History, TrendingUp, TrendingDown, Minus, Video } from 'lucide-react';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/Button.jsx';
import { fetchInterviewHistory, fetchProgressTrend } from '../services/history.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import './InterviewHistory.css';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const STATUS_LABELS = {
  created: { text: 'Not started', tone: 'neutral' },
  in_progress: { text: 'In progress', tone: 'pending' },
  completed: { text: 'Completed', tone: 'ok' },
};

const TREND_CONFIG = {
  improving: { label: 'Improving', icon: TrendingUp, tone: 'good' },
  declining: { label: 'Declining', icon: TrendingDown, tone: 'low' },
  steady: { label: 'Steady', icon: Minus, tone: 'mid' },
  'not-enough-data': { label: 'Not enough data yet', icon: Minus, tone: 'neutral' },
};

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

export default function InterviewHistory() {
  const [history, setHistory] = useState(null);
  const [trend, setTrend] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const [historyData, trendData] = await Promise.all([fetchInterviewHistory(), fetchProgressTrend()]);
      setHistory(historyData);
      setTrend(trendData);
      setStatus('ready');
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load your interview history.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') {
    return (
      <div className="interview-history">
        <Skeleton style={{ width: 160, height: 16, marginBottom: 16 }} />
        <Skeleton style={{ width: '100%', height: 240 }} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="interview-history">
        <p className="form-error-banner" role="alert">{loadError}</p>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </div>
    );
  }

  const trendInfo = TREND_CONFIG[trend.stats.trend];
  const TrendIcon = trendInfo.icon;

  const chartData = {
    labels: trend.points.map((p) => new Date(p.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Overall score',
        data: trend.points.map((p) => p.overallScore),
        borderColor: '#2f5bd8',
        backgroundColor: '#eaf0ff',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#2f5bd8',
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 100, ticks: { stepSize: 20 } } },
  };

  return (
    <div className="interview-history">
      <div>
        <h1>Interview history</h1>
        <p className="interview-history__subtitle">Every interview you've created, with your progress over time.</p>
      </div>

      <div className="card interview-history__stats">
        <div className="interview-history__stat">
          <p className="interview-history__stat-value">{history.length}</p>
          <p className="interview-history__stat-label">Total interviews</p>
        </div>
        <div className="interview-history__stat">
          <p className="interview-history__stat-value">{trend.stats.evaluatedInterviewCount}</p>
          <p className="interview-history__stat-label">Evaluated interviews</p>
        </div>
        <div className="interview-history__stat">
          <p className="interview-history__stat-value">{trend.stats.averageScore ?? '—'}</p>
          <p className="interview-history__stat-label">Average score</p>
        </div>
        <div className={`interview-history__trend interview-history__trend--${trendInfo.tone}`}>
          <TrendIcon size={16} aria-hidden="true" />
          {trendInfo.label}
        </div>
      </div>

      {trend.points.length >= 2 ? (
        <div className="card">
          <h2 className="interview-history__section-title">Progress over time</h2>
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={TrendingUp}
            title="Not enough data for a chart yet"
            description="Complete at least two interviews with a performance report to see your progress over time."
          />
        </div>
      )}

      <div className="card">
        <h2 className="interview-history__section-title">All interviews</h2>

        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No interviews yet"
            description="Start your first interview to see it here."
            action={<Link to="/interviews/new"><Button>Start an interview</Button></Link>}
          />
        ) : (
          <div className="history-list">
            {history.map((item) => {
              const itemStatus = STATUS_LABELS[item.status] || STATUS_LABELS.created;
              return (
                <Link key={item.id} to={`/interviews/${item.id}`} className="history-row">
                  <div className="history-row__icon">
                    <Video size={18} aria-hidden="true" />
                  </div>
                  <div className="history-row__info">
                    <p className="history-row__title">{item.roleName}</p>
                    <p className="history-row__meta">
                      {item.mode} · {item.difficulty} · {new Date(item.createdAt).toLocaleDateString()}
                      {item.status === 'completed' && <> · {formatDuration(item.durationSeconds)}</>}
                    </p>
                  </div>
                  <span className={`history-row__status history-row__status--${itemStatus.tone}`}>
                    {itemStatus.text}
                  </span>
                  <span className="history-row__score">
                    {item.hasReport ? item.overallScore : '—'}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}