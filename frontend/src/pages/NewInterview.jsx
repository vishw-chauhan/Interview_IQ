import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Gauge, Layers, Video, ArrowRight } from 'lucide-react';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchRoles } from '../services/roles.service.js';
import { fetchResumes } from '../services/resume.service.js';
import { createInterview, fetchInterviews } from '../services/interview.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import './NewInterview.css';

const MODES = [
  { value: 'quick', label: 'Quick', duration: '5–10 minutes', description: 'A short warm-up with a handful of questions.' },
  { value: 'standard', label: 'Standard', duration: '15–20 minutes', description: 'A balanced session covering technical and behavioral questions.' },
  { value: 'deep', label: 'Deep', duration: '30–40 minutes', description: 'A thorough, in-depth interview across all categories.' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

function statusLabel(status) {
  if (status === 'in_progress') return { text: 'In progress', tone: 'pending' };
  if (status === 'completed') return { text: 'Completed', tone: 'ok' };
  return { text: 'Created', tone: 'neutral' };
}

function InterviewCard({ interview }) {
  const status = statusLabel(interview.status);
  return (
    <Link to={`/interviews/${interview.id}`} className="interview-card card">
      <div className="interview-card__icon">
        <Video size={20} aria-hidden="true" />
      </div>
      <div className="interview-card__info">
        <p className="interview-card__title">{interview.roleName}</p>
        <p className="interview-card__meta">
          {interview.mode} · {interview.difficulty} ·{' '}
          {new Date(interview.createdAt).toLocaleDateString()}
          {interview.resumeName && <> · {interview.resumeName}</>}
        </p>
      </div>
      <span className={`interview-card__status interview-card__status--${status.tone}`}>{status.text}</span>
      <ArrowRight size={18} className="interview-card__arrow" aria-hidden="true" />
    </Link>
  );
}

export default function NewInterview() {
  const { user } = useAuth();

  const [roles, setRoles] = useState([]);
  const [resumes, setResumes] = useState([]);

  const [roleId, setRoleId] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [mode, setMode] = useState('standard');
  const [difficulty, setDifficulty] = useState('medium');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [interviews, setInterviews] = useState([]);
  const [listStatus, setListStatus] = useState('loading');
  const [listError, setListError] = useState('');

  useEffect(() => {
    if (user?.targetRoleId) {
      setRoleId(String(user.targetRoleId));
    }
    fetchRoles().then(setRoles).catch(() => {});
    fetchResumes().then(setResumes).catch(() => {});
  }, [user]);

  const loadInterviews = useCallback(async () => {
    setListStatus('loading');
    setListError('');
    try {
      const data = await fetchInterviews();
      setInterviews(data);
      setListStatus('ready');
    } catch (error) {
      setListError(getErrorMessage(error, 'Could not load your interviews.'));
      setListStatus('error');
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    if (!roleId) {
      setFormError('Select a target role.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createInterview({
        roleId: Number(roleId),
        resumeId: resumeId ? Number(resumeId) : undefined,
        mode,
        difficulty,
      });
      await loadInterviews();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not create the interview.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="new-interview-page">
      <div>
        <h1>AI Interview</h1>
        <p className="new-interview-page__subtitle">Configure your practice interview.</p>
      </div>

      <form className="card interview-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="roleId">Target role</label>
          <select id="roleId" value={roleId} onChange={(e) => setRoleId(e.target.value)} disabled={isSubmitting}>
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="resumeId">Resume (optional)</label>
          <select id="resumeId" value={resumeId} onChange={(e) => setResumeId(e.target.value)} disabled={isSubmitting}>
            <option value="">No resume — general questions</option>
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.originalName}
              </option>
            ))}
          </select>
          {resumes.length === 0 && (
            <span className="form-field__hint">
              You haven&apos;t uploaded a resume yet. <Link to="/resumes">Upload one</Link> for more personalized questions.
            </span>
          )}
        </div>

        <div className="form-field">
          <label>Difficulty</label>
          <div className="pill-group">
            {DIFFICULTIES.map((d) => (
              <button
                type="button"
                key={d.value}
                className={`pill ${difficulty === d.value ? 'pill--active' : ''}`}
                onClick={() => setDifficulty(d.value)}
                disabled={isSubmitting}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Interview mode</label>
          <div className="mode-grid">
            {MODES.map((m) => (
              <button
                type="button"
                key={m.value}
                className={`mode-card ${mode === m.value ? 'mode-card--active' : ''}`}
                onClick={() => setMode(m.value)}
                disabled={isSubmitting}
              >
                {m.value === 'quick' && <Zap size={18} aria-hidden="true" />}
                {m.value === 'standard' && <Gauge size={18} aria-hidden="true" />}
                {m.value === 'deep' && <Layers size={18} aria-hidden="true" />}
                <span className="mode-card__label">{m.label}</span>
                <span className="mode-card__duration">{m.duration}</span>
                <span className="mode-card__description">{m.description}</span>
              </button>
            ))}
          </div>
        </div>

        {formError && (
          <p className="form-error-banner" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" loading={isSubmitting}>
          Create interview
        </Button>
      </form>

      <section className="interviews-list">
        <h2 className="interviews-list__title">Your interviews</h2>

        {listStatus === 'loading' && (
          <div className="interviews-list__grid">
            {[1, 2].map((key) => (
              <div className="card interview-card interview-card--skeleton" key={key}>
                <Skeleton style={{ width: 38, height: 38, borderRadius: 10 }} />
                <div className="interview-card__info">
                  <Skeleton style={{ width: '50%', height: 14, marginBottom: 8 }} />
                  <Skeleton style={{ width: '35%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {listStatus === 'error' && (
          <p className="form-error-banner" role="alert">
            {listError}
          </p>
        )}

        {listStatus === 'ready' && interviews.length === 0 && (
          <div className="card">
            <EmptyState
              icon={Video}
              title="No interviews yet"
              description="Configure your first practice interview above."
            />
          </div>
        )}

        {listStatus === 'ready' && interviews.length > 0 && (
          <div className="interviews-list__grid">
            {interviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}