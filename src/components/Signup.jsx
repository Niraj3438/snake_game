import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!username.trim()) {
      nextErrors.username = 'Username cannot be empty';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email cannot be empty';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password cannot be empty';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signup({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      navigate('/game', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Could not create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="animated-bg">
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
      </div>

      <div className="auth-container">
        <div className="glass-card">
          <div className="logo">
            <h1>🐍 Create Account</h1>
            <p>Join the Snake Game Premium community</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="newUsername">Username</label>
              <input
                type="text"
                id="newUsername"
                name="newUsername"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <span className="error-message">{errors.username}</span>
            </div>

            <div className="form-group">
              <label htmlFor="newEmail">Email</label>
              <input
                type="email"
                id="newEmail"
                name="newEmail"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="error-message">{errors.email}</span>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <span className="error-message">{errors.password}</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span className="error-message">{errors.confirmPassword}</span>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <button type="submit" className="auth-btn" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
              {isSubmitting && <div className="loader" />}
            </button>

            <div className="form-links">
              <Link to="/login" className="auth-link">
                Already have an account? Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
