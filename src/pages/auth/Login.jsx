import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRequestOtpMutation } from '../../redux/api/authApi';
import '../../css/auth.css';
import logoSvg from '/logo.svg';

const Login = () => {
  const navigate = useNavigate();
  const [requestOtp, { isLoading }] = useRequestOtpMutation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await requestOtp({ email }).unwrap();
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err?.data?.message || 'Failed to send OTP');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-md-5 col-lg-4">
            <div className="card auth-card shadow-lg border-0 animate-fadeInUp">
              <div className="card-body p-5">
                {/* Logo */}
                <div className="text-center mb-4">
                  <div className="auth-logo-wrapper mb-3">
                    <img src={logoSvg} alt="SplitWise Logo" style={{ width: '80px', height: '80px' }} />
                  </div>
                  <h2 className="auth-title fw-bold mb-2">Welcome Back!</h2>
                  <p className="text-muted">Login to manage your expenses</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-envelope me-2"></i>Email Address
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-at text-primary"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0 ps-0"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show animate-shake" role="alert">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {error}
                      <button type="button" className="btn-close" onClick={() => setError('')}></button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mb-3 btn-gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP <i className="bi bi-arrow-right ms-2"></i>
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-decoration-none fw-semibold text-primary">
                      Register Now
                    </Link>
                  </p>
                </div>

                {/* Features */}
                <div className="row mt-4 pt-4 border-top">
                  <div className="col-6 text-center">
                    <i className="bi bi-shield-check text-success fs-4"></i>
                    <p className="small text-muted mb-0 mt-1">Secure</p>
                  </div>
                  <div className="col-6 text-center">
                    <i className="bi bi-lightning-charge text-warning fs-4"></i>
                    <p className="small text-muted mb-0 mt-1">Fast</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
