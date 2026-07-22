import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect if the app is already running as an installed PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDownloadClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      // Browser didn't fire beforeinstallprompt (e.g. iOS Safari, or already installed)
      alert(
        "To install:\n\niPhone (Safari): tap Share ⬆️ then 'Add to Home Screen'.\n\nAndroid (Chrome): tap the ⋮ menu then 'Install app'.\n\nDesktop (Chrome/Edge): click the install icon ⊕ in the address bar."
      );
    }
  };

  return (
    <div className="home-page">
      <div className="home-glow" />
      <div className="home-card">
        <div className="home-icon">🐍</div>
        <h1 className="home-title">Snake Game Premium</h1>
        <p className="home-subtitle">
          Classic snake, leveled up — themes, speed modes, sound, and an installable
          offline app.
        </p>

        <div className="home-actions">
          <Link to={isAuthenticated ? '/game' : '/login'} className="home-btn home-btn-play">
            ▶ Play Game
          </Link>

          <button
            className="home-btn home-btn-download"
            onClick={handleDownloadClick}
            disabled={isInstalled}
          >
            {isInstalled ? '✓ App Installed' : '⬇ Download App'}
          </button>
        </div>

        {!isInstalled && (
          <p className="home-hint">
            Install it once and play offline anytime — no app store needed.
          </p>
        )}
      </div>
    </div>
  );
}
