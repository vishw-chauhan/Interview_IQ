import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Sparkles, TrendingUp, TrendingDown, Target } from 'lucide-react';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fetchInterview, fetchInterviewReport, generateInterviewReport } from '../services/interview.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import './InterviewReport.css';

const CATEGORY_LABELS = {
  technical: 'Technical',
  project: 'Project',
  behavioral: 'Behavioral',
  role_specific: 'Role-specific',
  problem_solving: 'Problem solving',
};

function ScoreRing({ score, label }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const tone = safeScore >= 75 ? 'good' : safeScore >= 50 ? 'mid' : 'low';
  return (
    <div className="report-score-ring">
      <div className={`report-score-ring__circle report-score-ring__circle--${tone}`}>
        <span>{safeScore}</span>
      </div>
      <span className="report-score-ring__label">{label}</span>
    </div>
  );
}

function CategoryBar({ category, score }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  return (
    <div className="category-bar">
      <div className="category-bar__header">
        <span>{CATEGORY_LABELS[category] || category}</span>
        <span className="category-bar__value">{safeScore}</span>
      </div>
      <div className="category-bar__track">
        <div className="category-bar__fill" style={{ width: `${safeScore}%` }} />
      </div>
    </div>
  );
}

export default function InterviewReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found
  const [loadError, setLoadError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const [interviewData, reportData] = await Promise.all([
        fetchInterview(id),
        fetchInterviewReport(id),
      ]);
      setInterview(interviewData);
      setReport(reportData);
      setStatus('ready');
    } catch (error) {
      if (error?.response?.status === 404) {
        setStatus('not-found');
      } else {
        setLoadError(getErrorMessage(error, 'Could not load this report.'));
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
      const generated = await generateInterviewReport(id);
      setReport(generated);
    } catch (error) {
      if (error?.response?.status === 409) {
        setGenerateError('A report can only be generated once the interview is completed.');
      } else if (error?.response?.status === 422) {
        setGenerateError('No answers in this interview were evaluated, so a report cannot be generated.');
      } else {
        setGenerateError(getErrorMessage(error, 'Could not generate the report.'));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="interview-report">
        <Skeleton style={{ width: 120, height: 16, marginBottom: 16 }} />
        <Skeleton style={{ width: '100%', height: 240 }} />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="interview-report">
        <div className="card">
          <EmptyState
            icon={BarChart3}
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
      <div className="interview-report">
        <p className="form-error-banner" role="alert">{loadError}</p>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="interview-report">
      <button className="resume-detail__back" onClick={() => navigate(`/interviews/${id}`)}>
        <ArrowLeft size={16} aria-hidden="true" /> Back to interview details
      </button>

      <div>
        <h1>Performance report</h1>
        <p className="interview-report__subtitle">
          {interview.roleName} · {interview.difficulty}
        </p>
      </div>

      {interview.status !== 'completed' && (
        <div className="card interview-report__notice">
          <p>This interview isn&apos;t completed yet. A report will be available once it is.</p>
        </div>
      )}

      {interview.status === 'completed' && !report && (
        <div className="card interview-report__generate">
          <Sparkles size={28} aria-hidden="true" />
          <h2>No report yet</h2>
          <p>Generate a performance report based on your answers and scores from this interview.</p>
          {generateError && (
            <p className="form-error-banner" role="alert">
              {generateError}
            </p>
          )}
          <Button onClick={handleGenerate} loading={isGenerating}>
            Generate report
          </Button>
        </div>
      )}

      {report && (
        <>
          <div className="card interview-report__overall">
            <ScoreRing score={report.overallScore} label="Overall" />
            <ScoreRing score={report.technicalAverage} label="Technical" />
            <ScoreRing score={report.communicationAverage} label="Communication" />
            <div className="interview-report__regenerate">
              <Button variant="secondary" onClick={handleGenerate} loading={isGenerating}>
                Regenerate
              </Button>
              <p className="interview-report__coverage">
                Based on {report.evaluatedAnswerCount} of {report.totalAnswerCount} answered questions
                {report.evaluatedAnswerCount < report.totalAnswerCount &&
                  ' (some answers could not be evaluated automatically)'}
                .
              </p>
            </div>
          </div>

          {generateError && (
            <p className="form-error-banner" role="alert">
              {generateError}
            </p>
          )}

          <div className="card">
            <h2 className="interview-report__section-title">Category breakdown</h2>
            <div className="category-bar-list">
              {Object.entries(report.categoryScores).map(([category, score]) => (
                <CategoryBar key={category} category={category} score={score} />
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="interview-report__section-title">Summary</h2>
            <p className="interview-report__summary">{report.summary}</p>
          </div>

          <div className="card interview-report__lists">
            <div>
              <h2 className="interview-report__section-title">
                <TrendingUp size={16} aria-hidden="true" /> Strengths
              </h2>
              <ul className="analysis-list analysis-list--good">
                {report.strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="interview-report__section-title">
                <TrendingDown size={16} aria-hidden="true" /> Areas to improve
              </h2>
              <ul className="analysis-list analysis-list--warn">
                {report.weaknesses.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card interview-report__readiness">
            <h2 className="interview-report__section-title">
              <Target size={16} aria-hidden="true" /> Role readiness
            </h2>
            <p>{report.roleReadiness}</p>
          </div>
        </>
      )}
    </div>
  );
}