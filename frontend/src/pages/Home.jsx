import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getHealth } from '../services/health.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import './Home.css';

function getApiState(status, health) {
  if (status === 'loading') return { tone: 'pending', label: 'Checking…' };
  if (status === 'ready' && health?.api === 'ok') return { tone: 'ok', label: 'Online' };
  return { tone: 'error', label: 'Unreachable' };
}

function getDatabaseState(status, health) {
  if (status === 'loading') return { tone: 'pending', label: 'Checking…' };
  if (status === 'ready' && health?.database === 'connected') return { tone: 'ok', label: 'Connected' };
  if (status === 'ready') return { tone: 'error', label: 'Unavailable' };
  return { tone: 'unknown', label: 'Unknown' };
}

export default function Home() {
  const { isAuthenticated, isInitializing } = useAuth();

  const [status, setStatus] = useState('loading');
  const [health, setHealth] = useState(null);
  const [checkedAt, setCheckedAt] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const checkHealth = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const result = await getHealth();
      if (!result || !result.data) {
        throw new Error('Unexpected response from the server.');
      }
      setHealth(result.data);
      setCheckedAt(new Date(result.data.serverTime).toLocaleTimeString());
      setStatus('ready');
    } catch (error) {
      setHealth(null);
      setErrorMessage(getErrorMessage(error));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const isLoading = status === 'loading';
  const apiState = getApiState(status, health);
  const databaseState = getDatabaseState(status, health);
  const databaseDown = status === 'ready' && health?.database !== 'connected';

  return (
    <div className="page">
      <main className="home">
        <div className="home__brand">
          <span className="home__logo" aria-hidden="true">
            IQ
          </span>
          <span className="home__name">InterviewIQ</span>
        </div>

        <section className="home__hero">
          <h1>Prepare for your next interview.</h1>
          <p className="home__tagline">Prepare. Practice. Perform. Improve.</p>
          <p className="home__lead">
            Practice with questions built from your resume and target role, then get feedback on every answer.
          </p>

          {!isInitializing && (
            <div className="home__cta">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button>Go to dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button>Create account</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary">Log in</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </section>

        <section className="card status-card" aria-labelledby="status-title">
          <div className="status-card__header">
            <h2 id="status-title">System status</h2>
            <Button variant="secondary" onClick={checkHealth} loading={isLoading}>
              Check again
            </Button>
          </div>

          <ul className="status-list" aria-live="polite">
            <li className="status-row">
              <span>API server</span>
              <span className={`status-badge status-badge--${apiState.tone}`}>
                <span className="status-badge__dot" aria-hidden="true" />
                {apiState.label}
              </span>
            </li>
            <li className="status-row">
              <span>Database</span>
              <span className={`status-badge status-badge--${databaseState.tone}`}>
                <span className="status-badge__dot" aria-hidden="true" />
                {databaseState.label}
              </span>
            </li>
          </ul>

          {status === 'error' && (
            <div className="status-message status-message--error" role="alert">
              <p>{errorMessage}</p>
              {import.meta.env.DEV && (
                <p className="status-message__hint">
                  Running locally? Make sure the backend is started with <code>npm run dev</code> in the backend folder.
                </p>
              )}
            </div>
          )}

          {databaseDown && (
            <p className="status-message status-message--error" role="alert">
              The server is running, but it cannot reach the database. Make sure PostgreSQL is running.
            </p>
          )}

          {status === 'ready' && !databaseDown && <p className="status-message">Last checked at {checkedAt}</p>}
        </section>
      </main>
    </div>
  );
}