import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterUserMutation } from '../../redux/api/authApi';
import '../../css/auth.css';
import logoSvg from '/logo.svg';

const Register = () => {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Register user directly (no OTP needed)
      await registerUser(formData).unwrap();

      // Show success message
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
      <div className="auth-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100 py-5">
          <div className="col-md-6 col-lg-5">
            <div className="card auth-card shadow-lg border-0 animate-fadeInUp">
              <div className="card-body p-5">
                {success ? (
                  <div className="text-center py-4">
                    <div className="success-icon mb-4">
                      <i className="bi bi-check-circle text-success" style={{ fontSize: '80px' }}></i>
                    </div>
                    <h3 className="fw-bold text-success mb-2">Account Created Successfully!</h3>
                    <p className="text-muted">Redirecting to login...</p>
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
                      <h2 className="auth-title fw-bold mb-2" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Create Account
                      </h2>
                      <p className="text-muted">Join SplitWise today</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                      {/* Name */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-person me-2"></i>Full Name
                        </label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-person-circle" style={{ color: '#f093fb' }}></i>
                          </span>
                          <input
                            type="text"
                            name="name"
                            className="form-control border-start-0 ps-0"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-envelope me-2"></i>Email Address
                        </label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-at" style={{ color: '#f093fb' }}></i>
                          </span>
                          <input
                            type="email"
                            name="email"
                            className="form-control border-start-0 ps-0"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-telephone me-2"></i>Phone Number
                        </label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-phone" style={{ color: '#f093fb' }}></i>
                          </span>
                          <input
                            type="tel"
                            name="phone"
                            className="form-control border-start-0 ps-0"
                            placeholder="Enter your phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="mb-4">
                        <label className="form-label fw-semibold">
                          <i className="bi bi-geo-alt me-2"></i>Address
                        </label>
                        <div className="input-group input-group-lg">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="bi bi-house" style={{ color: '#f093fb' }}></i>
                          </span>
                          <input
                            type="text"
                            name="address"
                            className="form-control border-start-0 ps-0"
                            placeholder="Enter your address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="alert alert-danger alert-dismissible fade show animate-shake" role="alert">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          {error}
                          <button type="button" className="btn-close" onClick={() => setError('')}></button>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn btn-lg w-100 mb-3"
                        style={{
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Create Account <i className="bi bi-arrow-right ms-2"></i>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center mt-4">
                      <p className="text-muted mb-0">
                        Already have an account?{' '}
                        <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: '#f093fb' }}>
                          Login
                        </Link>
                      </p>
                    </div>

                    {/* Benefits */}
                    <div className="row mt-4 pt-4 border-top g-3">
                      <div className="col-4 text-center">
                        <i className="bi bi-people-fill" style={{ fontSize: '30px', color: '#f093fb' }}></i>
                        <p className="small text-muted mb-0 mt-2">Friends</p>
                      </div>
                      <div className="col-4 text-center">
                        <i className="bi bi-graph-up" style={{ fontSize: '30px', color: '#f5576c' }}></i>
                        <p className="small text-muted mb-0 mt-2">Track</p>
                      </div>
                      <div className="col-4 text-center">
                        <i className="bi bi-cash-stack" style={{ fontSize: '30px', color: '#f093fb' }}></i>
                        <p className="small text-muted mb-0 mt-2">Settle</p>
                      </div>
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

export default Register;
