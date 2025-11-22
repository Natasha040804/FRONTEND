import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
// removed external hook import and implemented local hook to keep file self-contained
import styles from './Login.module.css';
import { IonIcon } from '@ionic/react';
import { personCircle, lockClosed, eyeOutline, eyeOffOutline, timeOutline, cubeOutline, statsChartOutline } from 'ionicons/icons';
import '../../assets/styles/logincss.css';
import { useNavigate } from 'react-router-dom';

/* Local hook: provides refs and a safe mousemove animation for the homepage images */
function useLoginAnimations() {
  const navRef = useRef(null);
  const homeTitleRef = useRef(null);
  const homeDescRef = useRef(null);
  const homeImgRef = useRef(null);
  const moveElementsRef = useRef([]);

  useEffect(() => {
    // Ensure array exists
    if (!moveElementsRef.current) moveElementsRef.current = [];

    let rafId = null;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const maxOffset = 30; // px max translation to avoid moving things off-screen

    const handleMove = (e) => {
      const container = homeImgRef.current;
      const elements = moveElementsRef.current;
      if (!container || !elements || elements.length === 0) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // schedule a single RAF to batch style writes
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        elements.forEach((el) => {
          if (!el) return;
          const speedAttr = parseFloat(el.dataset?.speed);
          const speed = Number.isFinite(speedAttr) ? speedAttr : 1;
          // small proportional offsets, scaled down
          const rawX = (mouseX - centerX) * (speed / 200);
          const rawY = (mouseY - centerY) * (speed / 200);
          const tx = clamp(rawX, -maxOffset, maxOffset);
          const ty = clamp(rawY, -maxOffset, maxOffset);
          el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          el.style.transition = 'transform 220ms cubic-bezier(.22,.9,.23,1)';
        });
      });
    };

    const handleReset = () => {
      const elements = moveElementsRef.current || [];
      elements.forEach((el) => {
        if (!el) return;
        el.style.transform = 'translate3d(0,0,0)';
        el.style.transition = 'transform 300ms ease-out';
      });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseout', handleReset);
    window.addEventListener('mouseleave', handleReset);

    // reset on mount to safe defaults
    handleReset();

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseout', handleReset);
      window.removeEventListener('mouseleave', handleReset);
      if (rafId) cancelAnimationFrame(rafId);
      // final cleanup
      (moveElementsRef.current || []).forEach((el) => {
        if (!el) return;
        el.style.transform = '';
        el.style.transition = '';
      });
    };
  }, []);

  return {
    navRef,
    homeTitleRef,
    homeDescRef,
    homeImgRef,
    moveElementsRef
  };
}

export default function Login() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mainRef = useRef();
  const headerRef = useRef();
  const popupRef = useRef();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Get refs from the local animation hook
  const {
    navRef,
    homeTitleRef,
    homeDescRef,
    homeImgRef,
    moveElementsRef
  } = useLoginAnimations();

  // Focus management and keyboard listeners
  useEffect(() => {
    if (isPopupOpen && popupRef.current) {
      const usernameInput = popupRef.current.querySelector('#username');
      if (usernameInput) usernameInput.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPopupOpen) {
        togglePopup(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPopupOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(formData);
      togglePopup(false);

      // Redirect based on role
      switch ((user.role || '').toLowerCase()) {
        case 'admin':
          navigate('/dashboards/Admindashboard');
          break;
        case 'auditor':
          navigate('/dashboards/Auditordashboard');
          break;
        case 'accountexecutive':
          navigate('/dashboards/AEdashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err?.message || 'Invalid username or password');
      setIsPopupOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePopup = (open) => {
    setIsPopupOpen(open);
    setError('');
    if (mainRef.current) mainRef.current.classList.toggle(styles.blurred, open);
    if (headerRef.current) headerRef.current.classList.toggle(styles.blurred, open);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <header ref={headerRef} className="l-header">
        <nav className="nav bd-grid">
          <div>
            <a href="/" className="nav__logo" ref={navRef}>Logistics Management System</a>
          </div>
          <ul className="nav__list">
            <li className="nav__item">
              <button
                type="button"
                className="nav__button"
                onClick={() => togglePopup(true)}
                aria-haspopup="dialog"
              >
                Login
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main ref={mainRef} className="l-main">
        <section className="home" id="home">
          <div className="home__container bd-grid">
            <div className="home__img collage-mode" ref={homeImgRef}>
              <img src="/Images/123.png" alt="" data-speed="-2" className="move main-img" ref={el => moveElementsRef.current[0] = el} />

             </div>
            <div className="home__data">
              <h1 className="home__title brand-heading" ref={homeTitleRef}>
                MZE<br/>Cellular
              </h1>
              <p className="home__sub" ref={homeDescRef}>Digital Logistics System</p>
              <p className="home__description home__lead">
                Manage your inventory and delivery transactions with ease.
              </p>

              <ul className="home__features" aria-label="Key features">
                <li>
                  <IonIcon icon={timeOutline} aria-hidden="true" />
                  <span>Real-time Inventory Tracking</span>
                </li>
                <li>
                  <IonIcon icon={cubeOutline} aria-hidden="true" />
                  <span>Delivery Management</span>
                </li>
                <li>
                  <IonIcon icon={statsChartOutline} aria-hidden="true" />
                  <span>Branch Reports</span>
                </li>
              </ul>

              <p className="home__legal" aria-label="Copyright">
                © 2025 MZE Cellular Logistics Management System — Internal Use Only
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Login Popup */}
      <div
        className={`popup ${isPopupOpen ? 'active' : ''}`}
        role="dialog"
        aria-modal="true"
        ref={popupRef}
      >
        <div
          className="popup-overlay"
          onClick={() => togglePopup(false)}
          tabIndex={-1}
          aria-label="Close login dialog"
        />

        <div className="login-box">
          <button
            type="button"
            className="close-btn"
            onClick={() => togglePopup(false)}
            aria-label="Close login popup"
          >
            &times;
          </button>

          <form onSubmit={handleSubmit} noValidate>
            <h2>LOGIN</h2>
            {error && (
              <p className={styles.errorMessage} role="alert">
                {error}
              </p>
            )}

            <div className={styles.inputBox}>
              <label htmlFor="username" className="sr-only">Username</label>
              <span className={styles.icon}>
                <IonIcon icon={personCircle} aria-hidden="true" />
              </span>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Username"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className={styles.inputBox}>
              <label htmlFor="password" className="sr-only">Password</label>
              <span className={styles.icon}>
                <IonIcon icon={lockClosed} aria-hidden="true" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
              </button>
            </div>

            

            <button
              type="submit"
              className={styles.loginSubmit}
              disabled={isLoading || !formData.username || !formData.password}
              aria-busy={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}