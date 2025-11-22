import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLogoutUserMutation } from '../redux/api/authApi';
import logoSvg from '/logo.svg';

const Navbar = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [logoutUser] = useLogoutUserMutation();

  // Memoize handleLogout to prevent recreation on every render
  const handleLogout = useCallback(async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logoutUser().unwrap();
      } catch (err) {
        console.error('Logout failed:', err);
      } finally {
        // Always clear local state and redirect, even if API call fails
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }
    }
  }, [logoutUser]);

  // Memoize isActive function
  const isActive = useCallback((path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  // Memoize user initial
  const userInitial = useMemo(() => {
    return user?.name?.charAt(0).toUpperCase() || 'U';
  }, [user?.name]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-primary shadow-sm">
      <div className="container-fluid px-4">
        <a className="navbar-brand fw-bold d-flex align-items-center" href="#" onClick={() => navigate('/dashboard')}>
          <img src={logoSvg} alt="SplitWise Logo" style={{ width: '40px', height: '40px', marginRight: '10px' }} />
          <span>SplitWise</span>
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <a
                className={`nav-link ${isActive('/dashboard') ? 'active fw-bold' : ''}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/dashboard');
                }}
              >
                <i className="bi bi-house-door me-1"></i>
                Dashboard
              </a>
            </li>

            <li className="nav-item">
              <a
                className={`nav-link ${isActive('/groups') ? 'active fw-bold' : ''}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/groups/create');
                }}
              >
                <i className="bi bi-people me-1"></i>
                Groups
              </a>
            </li>

            <li className="nav-item">
              <a
                className={`nav-link ${isActive('/activity') ? 'active fw-bold' : ''}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/activity');
                }}
              >
                <i className="bi bi-activity me-1"></i>
                Activity
              </a>
            </li>

            <li className="nav-item">
              <a
                className={`nav-link ${isActive('/settlements') ? 'active fw-bold' : ''}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/settlements');
                }}
              >
                <i className="bi bi-cash-stack me-1"></i>
                Settlements
              </a>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div
                  className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center me-2"
                  style={{ width: '32px', height: '32px', fontSize: '14px', fontWeight: '700' }}
                >
                  {userInitial}
                </div>
                <span className="d-none d-lg-inline">{user?.name}</span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end animate-dropdown">
                <li>
                  <button className="dropdown-item" onClick={() => navigate('/profile')}>
                    <i className="bi bi-person me-2"></i>Profile
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>

              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
