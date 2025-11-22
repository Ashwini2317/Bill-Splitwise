import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLogoutUserMutation } from '../redux/api/authApi';
import { useGetAllGroupsQuery } from '../redux/api/groupApi';
import Navbar from '../components/Navbar';
import '../css/Profile.css';
import '../css/Dashboard.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: groups } = useGetAllGroupsQuery();
  const [logoutUser, { isLoading }] = useLogoutUserMutation();

  const handleLogout = async () => {
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
  };

  const totalGroups = groups?.length || 0;
  const totalExpenses = groups?.reduce((sum, group) => sum + (group.totalExpenses || 0), 0) || 0;

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Main Content */}
      <div className="container py-4">
        {/* Profile Header */}
        <div className="profile-header-card animate-fadeInUp mb-4">
          <div className="row align-items-center">
            <div className="col-auto">
              <div className="profile-avatar-large animate-float">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="col profile-user-info">
              <h2 className="mb-2 fw-bold">{user?.name}</h2>
              <p className="mb-1 opacity-75">
                <i className="bi bi-envelope me-2"></i>
                {user?.email}
              </p>
              {user?.phone && (
                <p className="mb-0 opacity-75">
                  <i className="bi bi-telephone me-2"></i>
                  {user?.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          {/* Left Column - User Info */}
          <div className="col-lg-4 mb-4">
            <div className="card border-0 shadow-sm animate-fadeInUp animation-delay-1" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4 fw-bold">
                  <i className="bi bi-person-circle me-2 text-primary"></i>
                  Personal Information
                </h5>

                <div className="info-display-card" style={{ '--card-color': '#667eea' }}>
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-person-badge"></i>
                    <div className="flex-grow-1">
                      <div className="info-label">Full Name</div>
                      <div className="info-value">{user?.name}</div>
                    </div>
                  </div>
                </div>

                <div className="info-display-card" style={{ '--card-color': '#f093fb' }}>
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-envelope-at"></i>
                    <div className="flex-grow-1">
                      <div className="info-label">Email Address</div>
                      <div className="info-value">{user?.email}</div>
                    </div>
                  </div>
                </div>

                {user?.phone && (
                  <div className="info-display-card" style={{ '--card-color': '#51cf66' }}>
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-phone"></i>
                      <div className="flex-grow-1">
                        <div className="info-label">Phone Number</div>
                        <div className="info-value">{user?.phone}</div>
                      </div>
                    </div>
                  </div>
                )}

                {user?.address && (
                  <div className="info-display-card" style={{ '--card-color': '#ff6b6b' }}>
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-geo-alt"></i>
                      <div className="flex-grow-1">
                        <div className="info-label">Address</div>
                        <div className="info-value">{user?.address}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="col-lg-8">
            {/* Statistics */}
            <div className="card border-0 shadow-sm mb-4 animate-fadeInUp animation-delay-2" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4 fw-bold">
                  <i className="bi bi-graph-up me-2 text-success"></i>
                  Your Statistics
                </h5>

                <div className="profile-stats-grid">
                  <div className="profile-stat-box" style={{ '--stat-color': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <i className="bi bi-people"></i>
                    </div>
                    <div className="profile-stat-value">{totalGroups}</div>
                    <div className="profile-stat-label">Total Groups</div>
                  </div>

                  <div className="profile-stat-box" style={{ '--stat-color': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                      <i className="bi bi-receipt"></i>
                    </div>
                    <div className="profile-stat-value">₹{totalExpenses.toFixed(2)}</div>
                    <div className="profile-stat-label">Total Expenses</div>
                  </div>

                  <div className="profile-stat-box" style={{ '--stat-color': 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)' }}>
                    <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)' }}>
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="profile-stat-value">₹0.00</div>
                    <div className="profile-stat-label">Settled Amount</div>
                  </div>

                  <div className="profile-stat-box" style={{ '--stat-color': 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)' }}>
                    <div className="profile-stat-icon" style={{ background: 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)' }}>
                      <i className="bi bi-calendar-check"></i>
                    </div>
                    <div className="profile-stat-value">
                      {new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </div>
                    <div className="profile-stat-label">Member Since</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card border-0 shadow-sm animate-fadeInUp animation-delay-2" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4 fw-bold">
                  <i className="bi bi-lightning-charge me-2 text-warning"></i>
                  Quick Actions
                </h5>

                <div
                  className="profile-action-card"
                  style={{ '--action-color': '#667eea', '--action-bg': '#f0f4ff' }}
                  onClick={() => navigate('/activity')}
                >
                  <div className="profile-action-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <i className="bi bi-activity"></i>
                  </div>
                  <div className="profile-action-content">
                    <p className="profile-action-title">View Activity</p>
                    <p className="profile-action-desc">Check your balances and transactions</p>
                  </div>
                  <i className="bi bi-arrow-right profile-action-arrow"></i>
                </div>

                <div
                  className="profile-action-card"
                  style={{ '--action-color': '#51cf66', '--action-bg': '#f0fff4' }}
                  onClick={() => navigate('/settlements')}
                >
                  <div className="profile-action-icon" style={{ background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)' }}>
                    <i className="bi bi-cash-stack"></i>
                  </div>
                  <div className="profile-action-content">
                    <p className="profile-action-title">Settlements</p>
                    <p className="profile-action-desc">Manage payments and settle up</p>
                  </div>
                  <i className="bi bi-arrow-right profile-action-arrow"></i>
                </div>

                <div
                  className="profile-action-card"
                  style={{ '--action-color': '#f093fb', '--action-bg': '#fff0fb' }}
                  onClick={() => navigate('/groups/create')}
                >
                  <div className="profile-action-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <i className="bi bi-plus-circle"></i>
                  </div>
                  <div className="profile-action-content">
                    <p className="profile-action-title">Create New Group</p>
                    <p className="profile-action-desc">Start tracking expenses with friends</p>
                  </div>
                  <i className="bi bi-arrow-right profile-action-arrow"></i>
                </div>

                <hr className="my-4" />

                <button
                  className="btn btn-logout"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Logging out...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
