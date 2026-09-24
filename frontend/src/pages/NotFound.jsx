import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page page--center">
      <main className="empty-state">
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/">Back to home</Link>
      </main>
    </div>
  );
}