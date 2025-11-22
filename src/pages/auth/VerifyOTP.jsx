import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginWithOtpMutation } from '../../redux/api/authApi';
import '../../css/auth.css';
import logoSvg from '/logo.svg';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginWithOtp, { isLoading }] = useLoginWithOtpMutation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const email = location.state?.email || '';

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      await loginWithOtp({ email, otp: otpString }).unwrap();
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    }
  };

  return (
    <div className="auth-container" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
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
                {success ? (
                  <div className="text-center py-4">
                    <div className="success-icon mb-4">
                      <i className="bi bi-check-circle text-success" style={{ fontSize: '80px' }}></i>
                    </div>
                    <h3 className="fw-bold text-success mb-2">
                      Login Successful!
                    </h3>
                    <p className="text-muted">Redirecting to dashboard...</p>
                    <div className="spinner-border text-success mt-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Logo */}
                    <div className="text-center mb-4">
                      <div className="auth-logo-wrapper mb-3">
                        <img src={logoSvg} alt="SplitWise Logo" style={{ width: '80px', height: '80px' }} />
                      </div>
                      <h2 className="auth-title fw-bold mb-2" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Verify OTP
                      </h2>
                      <p className="text-muted small">
                        Enter the verification code sent to your email
                      </p>
                      <p className="text-primary fw-semibold small mb-0">
                        <i className="bi bi-envelope me-2"></i>{email}
                      </p>
                    </div>

                    {/* OTP Form */}
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label className="form-label fw-semibold text-center d-block mb-3">
                          Enter 6-Digit Code
                        </label>
                        <div className="d-flex justify-content-center gap-2">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              className="otp-input form-control text-center fw-bold"
                              maxLength="1"
                              value={digit}
                              onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              style={{
                                width: '50px',
                                height: '60px',
                                fontSize: '24px',
                                borderRadius: '12px',
                                border: '2px solid #e9ecef'
                              }}
                              required
                            />
                          ))}
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
                        className="btn btn-lg w-100 mb-3"
                        style={{
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '14px',
                          color: 'white',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Verify OTP
                          </>
                        )}
                      </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center mt-4">
                      <p className="text-muted small mb-2">
                        Didn't receive the code?
                      </p>
                      <button className="btn btn-link text-primary fw-semibold text-decoration-none p-0">
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Resend OTP
                      </button>
                    </div>

                    <div className="text-center mt-3">
                      <button
                        onClick={() => navigate('/login')}
                        className="btn btn-link text-muted text-decoration-none p-0"
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Login
                      </button>
                    </div>

                    {/* Security Info */}
                    <div className="mt-4 pt-4 border-top text-center">
                      <p className="text-muted small mb-0">
                        <i className="bi bi-shield-check text-success me-2"></i>
                        This code is valid for 10 minutes
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
