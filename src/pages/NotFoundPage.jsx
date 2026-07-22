import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <h1>404</h1>
        <p>🐍 This page slithered away.</p>
        <Link to="/login" className="not-found-link">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
