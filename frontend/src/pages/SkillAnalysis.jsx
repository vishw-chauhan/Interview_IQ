import { useCallback, useEffect, useState } from 'react';
import { Target, Sparkles, AlertTriangle, FileText, TrendingUp } from 'lucide-react';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fetchSkillAnalysis, generateSkillAnalysis } from '../services/skills.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import './SkillAnalysis.css';

const CATEGORY_LABELS = {
  technical: 'Technical',
  project: 'Project',
  behavioral: 'Behavioral',
  role_specific: 'Role-specific',
  problem_solving: 'Problem solving',
};

const PRIORITY_TONE = { high: 'danger', medium: 'mid', low: 'good' };

function SkillBar({ category, score }) {
  const tone = score >= 75 ? 'good' : score >= 60 ? 'mid' : 'low';
  return (
    <div className="skill-bar">
      <div className="skill-bar__header">
        <span>{CATEGORY_LABELS[category] || category}</span>
        <span className={`skill-bar__value skill-bar__value--${tone}`}>{score}</span>
      </div>
      <div className="skill-bar__track">
        <div className={`skill-bar__fill skill-bar__fill--${tone}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function RoadmapItem({ item }) {
  const tone = PRIORITY_TONE[item.priority] || 'mid';
  return (
    <div className="roadmap-item">
      <div className="roadmap-item__header">
        <span className="roadmap-item__skill">{item.skill}</span>
        <span className={`roadmap-item__priority roadmap-item__priority--${tone}`}>{item.priority} priority</span>
      </div>
      <p className="roadmap-item__why">{item.why}</p>
      <p className="roadmap-item__recommendation">{item.recommendation}</p>
    </div>
  );
}

export default function SkillAnalysis() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const data = await fetchSkillAnalysis();
      setProfile(data);
      setStatus('ready');
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load your skill analysis.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setGenerateError('');
    setIsGenerating(true);
    try {
      const generated = await generateSkillAnalysis();
      setProfile(generated);
    } catch (error) {
      if (error?.response?.status === 422) {
        setGenerateError(
          getErrorMessage(error, 'Complete at least one interview with a performance report first.')
        );
      } else {
        setGenerateError(getErrorMessage(error, 'Could not generate your skill analysis.'));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="skill-analysis">
        <Skeleton style={{ width: 160, height: 16, marginBottom: 16 }} />
        <Skeleton style={{ width: '100%', height: 240 }} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="skill-analysis">
        <p className="form-error-banner" role="alert">{loadError}</p>
        <Button variant="secondary" onClick={load}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="skill-analysis">
      <div className="skill-analysis__header">
        <div>
          <h1>Skill analysis</h1>
          <p className="skill-analysis__subtitle">
            {profile
              ? `Based on ${profile.interviewsAnalyzed} completed interview${profile.interviewsAnalyzed === 1 ? '' : 's'}.`
              : 'A skill profile built from your interview performance and resume.'}
          </p>
        </div>
        <Button onClick={handleGenerate} loading={isGenerating}>
          <Sparkles size={16} aria-hidden="true" />
          {profile ? 'Refresh analysis' : 'Generate analysis'}
        </Button>
      </div>

      {generateError && (
        <p className="form-error-banner" role="alert">
          {generateError}
        </p>
      )}

      {!profile && !isGenerating && (
        <div className="card">
          <EmptyState
            icon={Target}
            title="No skill analysis yet"
            description="Complete at least one interview with a performance report, then generate your skill analysis to see a breakdown and a personalized learning roadmap."
          />
        </div>
      )}

      {profile && (
        <>
          <div className="card">
            <h2 className="skill-analysis__section-title">Skill breakdown</h2>
            <div className="skill-bar-list">
              {Object.entries(profile.skillScores).map(([category, score]) => (
                <SkillBar key={category} category={category} score={score} />
              ))}
            </div>
          </div>

          {profile.weakSkills.length > 0 && (
            <div className="card skill-analysis__weak">
              <AlertTriangle size={18} aria-hidden="true" />
              <p>
                <strong>Needs the most attention:</strong>{' '}
                {profile.weakSkills.map((w) => `${CATEGORY_LABELS[w.category] || w.category} (${w.score})`).join(', ')}
              </p>
            </div>
          )}

          {profile.missingSkillsFromResume.length > 0 && (
            <div className="card skill-analysis__resume-gaps">
              <FileText size={18} aria-hidden="true" />
              <p>
                <strong>Missing from your resume for your target role:</strong>{' '}
                {profile.missingSkillsFromResume.join(', ')}
              </p>
            </div>
          )}

          <div className="card">
            <h2 className="skill-analysis__section-title">
              <TrendingUp size={16} aria-hidden="true" /> Overview
            </h2>
            <p className="skill-analysis__overview">{profile.overview}</p>
          </div>

          <div className="card">
            <h2 className="skill-analysis__section-title">Learning roadmap</h2>
            <div className="roadmap-list">
              {profile.roadmap.map((item, index) => (
                <RoadmapItem key={index} item={item} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}