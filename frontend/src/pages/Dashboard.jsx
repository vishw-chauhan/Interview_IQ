import { Link } from 'react-router-dom';
import { FileText, Video, BarChart3, MessageSquareText, Target, History, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import './Dashboard.css';

const features = [
  {
    title: 'Resume Analysis',
    description: 'Upload your resume and get AI-powered feedback for your target role.',
    icon: FileText,
    to: '/resumes',
    available: true,
  },
  {
    title: 'AI Interview',
    description: 'Configure and practice an interview based on your resume and role.',
    icon: Video,
    to: '/interviews/new',
    available: true,
  },
  {
    title: 'Skill Analysis',
    description: 'See a skill profile and a personalized learning roadmap from your interviews.',
    icon: Target,
    to: '/skills',
    available: true,
  },
  {
    title: 'Interview History',
    description: 'Browse every past interview and see your progress over time.',
    icon: History,
    to: '/interviews/history',
    available: true,
  },
  {
    title: 'Performance Report',
    description: 'Per-interview scores across technical, communication and more — open from any interview.',
    icon: BarChart3,
    available: true,
    note: true,
  },
  {
    title: 'Answer Improvement',
    description: 'Per-answer feedback and stronger example answers — open from any interview.',
    icon: MessageSquareText,
    available: true,
    note: true,
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
        <Link to="/interviews/new">
          <Button>
            <Sparkles size={16} aria-hidden="true" />
            Start New Interview
          </Button>
        </Link>
      </section>

      <section aria-labelledby="features-title">
        <h2 id="features-title" className="dashboard__section-title">
          What you can do here
        </h2>

        <div className="dashboard__grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            const card = (
              <div className="card feature-card feature-card--available">
                <div className="feature-card__icon">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-card__footer">
                  <span className="feature-card__badge feature-card__badge--available">
                    {feature.note ? 'Open from an interview' : 'Available'}
                  </span>
                </div>
              </div>
            );

            return feature.to ? (
              <Link key={feature.title} to={feature.to} className="feature-card__link">
                {card}
              </Link>
            ) : (
              <div key={feature.title}>{card}</div>
            );
          })}
        </div>
      </section>
    </div>
  );
}