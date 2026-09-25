import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <main className="dashboard-placeholder">
        <div className="dashboard-placeholder__header">
          <div>
            <h1>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</h1>
            <p>Prepare. Practice. Perform. Improve.</p>
          </div>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>

        <div className="card">
          <p>
            You&apos;re logged in as <strong>{user?.email}</strong>.
          </p>
          {user?.targetRoleName && <p>Target role: {user.targetRoleName}</p>}
          <p className="dashboard-placeholder__note">
            The full dashboard (resume analysis, interviews, reports) is coming in Phase 3.
          </p>
        </div>
      </main>
    </div>
  );
}