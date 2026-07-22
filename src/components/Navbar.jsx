import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="app-navbar">
      <span className="app-navbar-brand">🐍 Snake Game Premium</span>
      <div className="app-navbar-right">
        {user && <span className="app-navbar-user">Hi, {user.username}</span>}
        <button className="app-navbar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
