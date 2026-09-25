import { FileText, Video, BarChart3, MessageSquareText, Target, History, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import './Dashboard.css';

const features = [
  {
    title: 'Resume Analysis',
    description: 'Upload your resume and get AI-powered feedback for your target role.',
    icon: FileText,
    phase: 'Phase 5',
  },
  {
    title: 'AI Interview',
    description: 'Practice a personalized interview based on your resume and role.',
    icon: Video,
    phase: 'Phase 9',
  },
  {
    title: 'Performance Report',
    description: 'See your scores across technical, communication and problem solving.',
    icon: BarChart3,
    phase: 'Phase 15',
  },
  {
    title: 'Answer Improvement',
    description: 'Compare your answers with stronger, suggested versions.',
    icon: MessageSquareText,
    phase: 'Phase 14',
  },
  {
    title: 'Skill Analysis',
    description: 'Identify skill gaps and get a personalized learning roadmap.',
    icon: Target,
    phase: 'Phase 17',
  },
  {
    title: 'Interview History',
    description: 'Track your past interviews and your progress over time.',
    icon: History,
    phase: 'Phase 18',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="dashboard">
      <section className="dashboard__welcome">
        <div>
          <h1>Welcome{firstName ? `, ${firstName}` : ''}.</h1>
          <p className="dashboard__tagline">Prepare. Practice. Perform. Improve.</p>
        </div>

        <div className="dashboard__welcome-meta">
          {user?.targetRoleName ? (
            <span className="dashboard__role-pill">Target role: {user.targetRoleName}</span>
          ) : (
            <span className="dashboard__role-pill dashboard__role-pill--muted">
              No target role set yet
            </span>
          )}
        </div>
      </section>

      <section className="card dashboard__cta">
        <div>
          <h2>Start a new interview</h2>
          <p>Practice with questions generated from your resume and target role.</p>
        </div>
        <Button disabled title="Coming in Phase 9">
          <Sparkles size={16} aria-hidden="true" />
          Start New Interview
        </Button>
      </section>

      <section aria-labelledby="features-title">
        <h2 id="features-title" className="dashboard__section-title">
          What you can do here
        </h2>

        <div className="dashboard__grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card feature-card">
                <div className="feature-card__icon">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-card__footer">
                  <span className="feature-card__badge">Coming in {feature.phase}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}