import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetAllGroupsQuery } from '../redux/api/groupApi';
import { useGetUserSettlementsQuery } from '../redux/api/settlement';
import Navbar from '../components/Navbar';
import '../css/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: groups, isLoading } = useGetAllGroupsQuery();
  const { data: settlements } = useGetUserSettlementsQuery(user?._id, {
    skip: !user?._id
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Calculate balances from settlements
  const calculateBalances = () => {
    console.log("💼 DASHBOARD CALCULATION:");
    console.log("  Settlements:", settlements);
    console.log("  Settlements Length:", settlements?.length || 0);
    console.log("  User ID:", user?._id);

    if (!settlements || !user) {
      console.log("  ❌ No settlements or user!");
      return { owe: 0, owed: 0 };
    }

    let totalOwe = 0;
    let totalOwed = 0;

    settlements.forEach(settlement => {
      console.log("  Processing settlement:", {
        from: settlement.from?.name,
        to: settlement.to?.name,
        amount: settlement.amount,
        status: settlement.status
      });

      if (settlement.status?.toUpperCase() !== 'COMPLETED') {
        if (settlement.from?._id === user._id || settlement.from === user._id) {
          totalOwe += settlement.amount;
          console.log(`    💸 You owe ₹${settlement.amount} to ${settlement.to?.name}`);
        } else if (settlement.to?._id === user._id || settlement.to === user._id) {
          totalOwed += settlement.amount;
          console.log(`    💰 ${settlement.from?.name} owes you ₹${settlement.amount}`);
        }
      }
    });

    console.log("\n📊 DASHBOARD TOTALS:");
    console.log("  You Owe: ₹" + totalOwe.toFixed(2));
    console.log("  You Are Owed: ₹" + totalOwed.toFixed(2));
    console.log("=====================================\n");

    return { owe: totalOwe, owed: totalOwed };
  };

  const { owe, owed } = calculateBalances();

  return (
    <div className="dashboard-wrapper">
      <Navbar />

      {/* Main Content */}
      <div className="container-fluid px-4 py-4">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="welcome-card">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-2">Welcome back, <span className="text-gradient">{user?.name}!</span></h2>
                  <p className="text-muted mb-0">
                    <i className="bi bi-calendar-check me-2"></i>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button className="btn btn-gradient-primary btn-lg shadow-sm" onClick={() => navigate('/groups/create')}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="stat-card stat-card-purple animate-scale">
              <div className="stat-icon">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Groups</p>
                <h3 className="stat-value">{groups?.length || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card stat-card-red animate-scale animation-delay-1">
              <div className="stat-icon">
                <i className="bi bi-arrow-down-circle"></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">You Owe</p>
                <h3 className="stat-value text-danger">₹{owe.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-card stat-card-green animate-scale animation-delay-2">
              <div className="stat-icon">
                <i className="bi bi-arrow-up-circle"></i>
              </div>
              <div className="stat-content">
                <p className="stat-label">You Are Owed</p>
                <h3 className="stat-value text-success">₹{owed.toFixed(2)}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Section */}
        <div className="row">
          <div className="col-12">
            <div className="section-header mb-4">
              <h4 className="section-title">
                <i className="bi bi-grid-3x3-gap me-2"></i>
                Your Groups
              </h4>
            </div>

            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3">Loading your groups...</p>
              </div>
            ) : groups && groups.length > 0 ? (
              <div className="row g-4">
                {groups.map((group, index) => (
                  <div key={group._id} className="col-md-6 col-lg-4">
                    <div
                      className={`group-card animate-fadeInUp animation-delay-${index % 3}`}
                      onClick={() => navigate(`/groups/${group._id}`)}
                    >
                      <div className="group-card-header">
                        <div className="group-icon">
                          <i className="bi bi-people"></i>
                        </div>
                        <div className="group-info flex-grow-1">
                          <h5 className="group-name mb-1">{group.name}</h5>
                          <p className="group-desc text-muted mb-0">
                            {group.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <div className="group-card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-muted d-block mb-1">Members</small>
                            <span className="badge bg-primary rounded-pill">
                              <i className="bi bi-people me-1"></i>
                              {group.members?.length || 0}
                            </span>
                          </div>
                          <div className="text-end">
                            <small className="text-muted d-block mb-1">Total Expenses</small>
                            <span className="fw-bold text-primary">₹{group.totalExpenses?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="group-card-footer">
                        <span className="view-details">
                          View Details <i className="bi bi-arrow-right ms-2"></i>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <h5 className="mb-3">No Groups Yet</h5>
                <p className="text-muted mb-4">Create your first group to start tracking expenses with friends!</p>
                <button className="btn btn-gradient-primary btn-lg" onClick={() => navigate('/groups/create')}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Your First Group
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="section-header mb-4">
              <h4 className="section-title">
                <i className="bi bi-lightning-charge me-2"></i>
                Quick Actions
              </h4>
            </div>
            <div className="row g-3">
              <div className="col-md-3 col-6">
                <div className="quick-action-card" onClick={() => navigate('/groups/create')}>
                  <i className="bi bi-plus-circle"></i>
                  <span>Create Group</span>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="quick-action-card" onClick={() => navigate('/settlements')}>
                  <i className="bi bi-cash-stack"></i>
                  <span>Settle Up</span>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="quick-action-card" onClick={() => navigate('/profile')}>
                  <i className="bi bi-person"></i>
                  <span>View Profile</span>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="quick-action-card" onClick={() => navigate('/activity')}>
                  <i className="bi bi-activity"></i>
                  <span>Activity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
