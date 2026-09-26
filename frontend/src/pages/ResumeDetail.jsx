import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, FileText, AlertTriangle, Wand2, ArrowRight } from 'lucide-react';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fetchResume, analyzeResume, improveResume } from '../services/resume.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import { formatBytes } from '../utils/formatBytes.js';
import './ResumeDetail.css';

function ScoreRing({ score, label }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const tone = safeScore >= 75 ? 'good' : safeScore >= 50 ? 'mid' : 'low';
  return (
    <div className="score-ring">
      <div className={`score-ring__circle score-ring__circle--${tone}`}>
        <span>{safeScore}</span>
      </div>
      <span className="score-ring__label">{label}</span>
    </div>
  );
}

function ListSection({ title, items, tone = 'neutral' }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="analysis-section">
      <h3>{title}</h3>
      <ul className={`analysis-list analysis-list--${tone}`}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function BulletImprovementCard({ item }) {
  return (
    <div className="bullet-improvement">
      <div className="bullet-improvement__row bullet-improvement__row--before">
        <span className="bullet-improvement__tag">Before</span>
        <p>{item.original}</p>
      </div>
      <div className="bullet-improvement__arrow">
        <ArrowRight size={16} aria-hidden="true" />
      </div>
      <div className="bullet-improvement__row bullet-improvement__row--after">
        <span className="bullet-improvement__tag">After</span>
        <p>{item.improved}</p>
      </div>
      <p className="bullet-improvement__reason">{item.reason}</p>
    </div>
  );
}

function MissingSkillPlanCard({ item }) {
  return (
    <div className="skill-plan-card">
      <span className="skill-plan-card__skill">{item.skill}</span>
      <p>{item.suggestion}</p>
    </div>
  );
}

export default function ResumeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | not-found
  const [loadError, setLoadError] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  const [isImproving, setIsImproving] = useState(false);
  const [improveError, setImproveError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const data = await fetchResume(id);
      setResume(data);
      setStatus('ready');
    } catch (error) {
      if (error?.response?.status === 404) {
        setStatus('not-found');
      } else {
        setLoadError(getErrorMessage(error, 'Could not load this resume.'));
        setStatus('error');
      }
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAnalyze() {
    setAnalyzeError('');
    setIsAnalyzing(true);
    try {
      const updated = await analyzeResume(id);
      setResume(updated);
    } catch (error) {
      setAnalyzeError(getErrorMessage(error, 'Could not analyze this resume.'));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleImprove() {
    setImproveError('');
    setIsImproving(true);
    try {
      const updated = await improveResume(id);
      setResume(updated);
    } catch (error) {
      setImproveError(getErrorMessage(error, 'Could not generate improvement suggestions.'));
    } finally {
      setIsImproving(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="resume-detail">
        <Skeleton style={{ width: 120, height: 16, marginBottom: 16 }} />
        <Skeleton style={{ width: '100%', height: 120, marginBottom: 16 }} />
        <Skeleton style={{ width: '100%', height: 200 }} />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="resume-detail">
        <div className="card">
          <EmptyState
            icon={FileText}
            title="Resume not found"
            description="It may have been deleted, or it doesn't belong to your account."
            action={<Link to="/resumes"><Button variant="secondary">Back to resumes</Button></Link>}
          />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="resume-detail">
        <p className="form-error-banner" role="alert">{loadError}</p>
        <Button variant="secondary" onClick={load} className="resume-detail__retry">
          Try again
        </Button>
      </div>
    );
  }

  const analysis = resume.analysis;
  const improvement = resume.improvement;

  return (
    <div className="resume-detail">
      <button className="resume-detail__back" onClick={() => navigate('/resumes')}>
        <ArrowLeft size={16} aria-hidden="true" /> Back to resumes
      </button>

      <div className="card resume-detail__header">
        <div>
          <h1>{resume.originalName}</h1>
          <p className="resume-detail__meta">
            {resume.targetRoleName || 'No target role'} · {formatBytes(resume.fileSize)} ·{' '}
            {new Date(resume.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Button onClick={handleAnalyze} loading={isAnalyzing}>
          <Sparkles size={16} aria-hidden="true" />
          {resume.hasAnalysis ? 'Re-analyze' : 'Analyze'}
        </Button>
      </div>

      {!resume.hasText && (
        <div className="card resume-detail__notice">
          <AlertTriangle size={18} aria-hidden="true" />
          <p>
            This resume has no readable text, likely because it&apos;s a scanned image. Try
            uploading a text-based PDF or a DOCX file.
          </p>
        </div>
      )}

      {analyzeError && (
        <p className="form-error-banner" role="alert">
          {analyzeError}
        </p>
      )}

      {!analysis && resume.hasText && (
        <div className="card">
          <EmptyState
            icon={Sparkles}
            title="Not analyzed yet"
            description="Click Analyze above to get AI-powered feedback for this resume."
          />
        </div>
      )}

      {analysis && (
        <>
          <div className="card resume-detail__scores">
            <ScoreRing score={analysis.overallScore} label="Overall" />
            <ScoreRing score={analysis.roleRelevance?.score} label="Role fit" />
            <ScoreRing score={analysis.structure?.score} label="Structure" />
            <ScoreRing score={analysis.bulletPointQuality?.score} label="Bullet points" />
          </div>

          <div className="card">
            <h2 className="analysis-section__title">Summary</h2>
            <p className="analysis-summary">{analysis.summary}</p>
          </div>

          <div className="card">
            <ListSection title="Skills found" items={analysis.skills?.found} tone="good" />
            <ListSection title="Missing skills for this role" items={analysis.skills?.missing} tone="warn" />
          </div>

          <div className="card">
            <ListSection title="Strengths" items={analysis.strengths} tone="good" />
            <ListSection title="Weaknesses" items={analysis.weaknesses} tone="warn" />
          </div>

          <div className="card">
            <ListSection title="Resume structure — strengths" items={analysis.structure?.strengths} tone="good" />
            <ListSection title="Resume structure — issues" items={analysis.structure?.issues} tone="warn" />
          </div>

          <div className="card">
            <ListSection title="Bullet point feedback" items={analysis.bulletPointQuality?.feedback} />
          </div>

          <div className="card">
            <ListSection title="Potential ATS issues" items={analysis.atsIssues} tone="warn" />
          </div>

          <div className="card resume-detail__misc">
            <div>
              <h3>Experience</h3>
              <p>{analysis.experience?.yearsEstimate}</p>
              <p className="resume-detail__muted">{analysis.experience?.notes}</p>
            </div>
            <div>
              <h3>Education</h3>
              <p className="resume-detail__muted">{analysis.education?.notes}</p>
            </div>
            <div>
              <h3>Certifications</h3>
              {analysis.certifications?.length > 0 ? (
                <ul className="analysis-list">
                  {analysis.certifications.map((cert, index) => (
                    <li key={index}>{cert}</li>
                  ))}
                </ul>
              ) : (
                <p className="resume-detail__muted">None found</p>
              )}
            </div>
          </div>

          <div className="card resume-detail__improve-cta">
            <div>
              <h2>Resume improvement suggestions</h2>
              <p>Get concrete rewrites and a plan to close your skill gaps.</p>
            </div>
            <Button onClick={handleImprove} loading={isImproving}>
              <Wand2 size={16} aria-hidden="true" />
              {resume.hasImprovement ? 'Regenerate suggestions' : 'Improve Resume'}
            </Button>
          </div>

          {improveError && (
            <p className="form-error-banner" role="alert">
              {improveError}
            </p>
          )}

          {improvement && (
            <>
              <div className="card">
                <h2 className="analysis-section__title">Improvement summary</h2>
                <p className="analysis-summary">{improvement.summary}</p>
              </div>

              {improvement.bulletImprovements?.length > 0 && (
                <div className="card">
                  <h3>Bullet point rewrites</h3>
                  <div className="bullet-improvement-list">
                    {improvement.bulletImprovements.map((item, index) => (
                      <BulletImprovementCard key={index} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {improvement.missingSkillsPlan?.length > 0 && (
                <div className="card">
                  <h3>Missing skills — what to do</h3>
                  <div className="skill-plan-list">
                    {improvement.missingSkillsPlan.map((item, index) => (
                      <MissingSkillPlanCard key={index} item={item} />
                    ))}
                  </div>
                </div>
              )}

              <div className="card">
                <ListSection title="Make it more relevant to this role" items={improvement.roleRelevanceSuggestions} />
                <ListSection title="ATS suggestions" items={improvement.atsSuggestions} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}