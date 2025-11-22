import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetAllGroupsQuery } from '../../redux/api/groupApi';
import { useGetUserSettlementsQuery } from '../../redux/api/settlement';
import Navbar from '../../components/Navbar';
import '../../css/Activity.css';
import '../../css/groups.css';

const Activity = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: groups, isLoading } = useGetAllGroupsQuery();
  const { data: settlements } = useGetUserSettlementsQuery(user?._id, {
    skip: !user?._id
  });

  // Calculate overall balances from settlements
  const { youOwe, youAreOwed, personBalances, recentActivity } = useMemo(() => {
    if (!user) return { youOwe: 0, youAreOwed: 0, personBalances: {}, recentActivity: [] };

    console.log("🔍 ACTIVITY CALCULATION:");
    console.log("  Settlements:", settlements);
    console.log("  Settlements Length:", settlements?.length || 0);
    console.log("  User ID:", user._id);

    let totalOwe = 0;
    let totalOwed = 0;
    const balances = {}; // { personId: { name, email, amount, groups: [] } }
    const activities = [];

    // Calculate from settlements
    if (settlements && settlements.length > 0) {
      console.log("  ✅ Processing settlements...");
      settlements.forEach(settlement => {
        // Skip completed settlements
        if (settlement.status?.toUpperCase() === 'COMPLETED') return;

        const isFromUser = settlement.from?._id === user._id || settlement.from === user._id;
        const isToUser = settlement.to?._id === user._id || settlement.to === user._id;
        const groupName = settlement.group?.name || 'Unknown Group';

        if (isFromUser) {
          // User owes money to someone
          totalOwe += settlement.amount;
          console.log(`    💸 You owe ₹${settlement.amount} to ${settlement.to?.name} in ${groupName}`);

          const personId = settlement.to?._id || settlement.to;
          if (!balances[personId]) {
            balances[personId] = {
              name: settlement.to?.name || 'Unknown',
              email: settlement.to?.email || '',
              amount: 0,
              groups: []
            };
          }
          balances[personId].amount -= settlement.amount; // Negative means you owe
          if (!balances[personId].groups.includes(groupName)) {
            balances[personId].groups.push(groupName);
          }
        } else if (isToUser) {
          // Someone owes money to user
          totalOwed += settlement.amount;
          console.log(`    💰 ${settlement.from?.name} owes you ₹${settlement.amount} in ${groupName}`);

          const personId = settlement.from?._id || settlement.from;
          if (!balances[personId]) {
            balances[personId] = {
              name: settlement.from?.name || 'Unknown',
              email: settlement.from?.email || '',
              amount: 0,
              groups: []
            };
          }
          balances[personId].amount += settlement.amount; // Positive means they owe you
          if (!balances[personId].groups.includes(groupName)) {
            balances[personId].groups.push(groupName);
          }
        }

        // Add to activities with clear messaging
        let activityTitle;
        if (isFromUser) {
          activityTitle = `You paid ${settlement.to?.name || 'Unknown'} ₹${settlement.amount} in ${groupName}`;
        } else if (isToUser) {
          activityTitle = `${settlement.from?.name || 'Unknown'} paid you ₹${settlement.amount} in ${groupName}`;
        } else {
          activityTitle = `Settlement: ${settlement.from?.name || 'Unknown'} → ${settlement.to?.name || 'Unknown'} in ${groupName}`;
        }

        activities.push({
          type: 'settlement',
          title: activityTitle,
          amount: settlement.amount,
          date: settlement.date || settlement.createdAt,
          status: settlement.status,
          isFromUser: isFromUser,
          groupName: groupName
        });
      });
    } else {
      console.log("  ❌ NO SETTLEMENTS FOUND!");
      console.log("  ⚠️  Run migration to create settlements from expenses!");
    }

    // Add group activities
    if (groups && groups.length > 0) {
      groups.forEach(group => {
        if (group.totalExpenses > 0) {
          activities.push({
            type: 'group',
            title: group.name,
            groupId: group._id,
            amount: group.totalExpenses,
            date: group.createdAt,
            members: group.members?.length || 0
          });
        }
      });
    }

    // Sort activities by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log("\n📊 FINAL CALCULATION:");
    console.log("  Total You Owe: ₹" + totalOwe.toFixed(2));
    console.log("  Total You Are Owed: ₹" + totalOwed.toFixed(2));
    console.log("  Person Balances:", balances);
    console.log("  Activities:", activities.length);
    console.log("=====================================\n");

    return {
      youOwe: totalOwe,
      youAreOwed: totalOwed,
      personBalances: balances,
      recentActivity: activities.slice(0, 10) // Last 10 activities
    };
  }, [settlements, groups, user]);

  // Convert personBalances object to array for rendering
  const balancesList = useMemo(() => {
    return Object.entries(personBalances).map(([personId, data]) => ({
      personId,
      ...data
    })).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [personBalances]);

  const peopleYouOwe = balancesList.filter(p => p.amount < 0);
  const peopleWhoOweYou = balancesList.filter(p => p.amount > 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="page-wrapper d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="mt-3 text-muted">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Main Content */}
      <div className="container py-5">
        {/* Header */}
        <div className="header-card mb-4 animate-fadeInUp">
          <div className="header-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <i className="bi bi-activity"></i>
          </div>
          <div>
            <h2 className="mb-2">Activity</h2>
            <p className="text-muted mb-0">Your balances and recent transactions</p>
          </div>
        </div>

        {/* Balance Summary Cards */}
        <div className="row mb-5">
          <div className="col-md-6 mb-4">
            <div className="balance-card-large owe animate-fadeInUp">
              <div className="balance-icon owe">
                <i className="bi bi-arrow-up-circle"></i>
              </div>
              <div className="balance-label">Total You Owe</div>
              <div className="balance-amount owe">₹{youOwe.toFixed(2)}</div>
              {youOwe > 0 && (
                <button className="btn btn-settle mt-3">
                  <i className="bi bi-credit-card me-2"></i>
                  Settle Up
                </button>
              )}
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="balance-card-large owed animate-fadeInUp animation-delay-1">
              <div className="balance-icon owed">
                <i className="bi bi-arrow-down-circle"></i>
              </div>
              <div className="balance-label">Total You Are Owed</div>
              <div className="balance-amount owed">₹{youAreOwed.toFixed(2)}</div>
              {youAreOwed > 0 && (
                <button className="btn btn-settle mt-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <i className="bi bi-bell me-2"></i>
                  Send Reminder
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          {/* People You Owe */}
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm animate-slideInLeft" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4 fw-bold">
                  <i className="bi bi-arrow-up-circle me-2" style={{ color: '#ff6b6b' }}></i>
                  You Owe
                </h5>

                {peopleYouOwe.length > 0 ? (
                  <div>
                    {peopleYouOwe.map((person) => (
                      <div
                        key={person.personId}
                        className="person-balance-card"
                        style={{ '--person-color': '#ff6b6b' }}
                      >
                        <div className="person-avatar-large">
                          {person.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="person-info">
                          <p className="person-name">{person.name}</p>
                          <p className="person-status" style={{ color: '#ff6b6b', fontWeight: '500' }}>
                            <i className="bi bi-arrow-right me-1"></i>
                            You need to pay ₹{Math.abs(person.amount).toFixed(2)}
                          </p>
                          {person.groups && person.groups.length > 0 && (
                            <p className="person-status" style={{ fontSize: '11px', marginTop: '2px', color: '#6c757d' }}>
                              <i className="bi bi-people-fill me-1"></i>
                              {person.groups.join(', ')}
                            </p>
                          )}
                          <p className="person-status" style={{ fontSize: '11px', marginTop: '2px' }}>{person.email}</p>
                        </div>
                        <div>
                          <button
                            className="btn btn-sm btn-settle mt-2"
                            style={{ fontSize: '12px', padding: '6px 16px' }}
                          >
                            <i className="bi bi-credit-card me-1"></i>
                            Pay Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-check-circle" style={{ fontSize: '60px', color: '#51cf66' }}></i>
                    <p className="mt-3 text-muted">You're all settled up!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* People Who Owe You */}
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm animate-slideInRight" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4 fw-bold">
                  <i className="bi bi-arrow-down-circle me-2" style={{ color: '#51cf66' }}></i>
                  You Are Owed
                </h5>

                {peopleWhoOweYou.length > 0 ? (
                  <div>
                    {peopleWhoOweYou.map((person) => (
                      <div
                        key={person.personId}
                        className="person-balance-card"
                        style={{ '--person-color': '#51cf66' }}
                      >
                        <div className="person-avatar-large">
                          {person.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="person-info">
                          <p className="person-name">{person.name}</p>
                          <p className="person-status" style={{ color: '#51cf66', fontWeight: '500' }}>
                            <i className="bi bi-arrow-left me-1"></i>
                            {person.name?.split(' ')[0]} needs to pay you ₹{person.amount.toFixed(2)}
                          </p>
                          {person.groups && person.groups.length > 0 && (
                            <p className="person-status" style={{ fontSize: '11px', marginTop: '2px', color: '#6c757d' }}>
                              <i className="bi bi-people-fill me-1"></i>
                              {person.groups.join(', ')}
                            </p>
                          )}
                          <p className="person-status" style={{ fontSize: '11px', marginTop: '2px' }}>{person.email}</p>
                        </div>
                        <div>
                          <button
                            className="btn btn-sm btn-outline-primary mt-2"
                            style={{ fontSize: '12px', padding: '6px 16px' }}
                          >
                            <i className="bi bi-bell me-1"></i>
                            Remind
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox" style={{ fontSize: '60px', color: '#dee2e6' }}></i>
                    <p className="mt-3 text-muted">No one owes you money</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card border-0 shadow-sm mt-4 animate-fadeInUp" style={{ borderRadius: '20px' }}>
          <div className="card-body p-4">
            <h5 className="mb-4 fw-bold">
              <i className="bi bi-clock-history me-2 text-primary"></i>
              Recent Activity
            </h5>

            {recentActivity.length > 0 ? (
              <div>
                {recentActivity.map((activity, idx) => {
                  // Color logic:
                  // - If user gave money (isFromUser) -> GREEN (positive action)
                  // - If user owes money -> RED (negative for user)
                  const isGiving = activity.type === 'settlement' && activity.isFromUser;
                  const itemColor = isGiving ? '#51cf66' : activity.type === 'settlement' ? '#ff6b6b' : '#667eea';

                  return (
                    <div
                      key={idx}
                      className="activity-item"
                      onClick={() => activity.groupId && navigate(`/groups/${activity.groupId}`)}
                      style={{ cursor: activity.groupId ? 'pointer' : 'default' }}
                    >
                      <div
                        className={`activity-icon ${activity.type === 'settlement' ? 'settlement' : 'expense'}`}
                        style={{ backgroundColor: `${itemColor}20`, color: itemColor }}
                      >
                        <i className={`bi ${activity.type === 'settlement'
                            ? (isGiving ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle')
                            : 'bi-receipt'
                          }`}></i>
                      </div>
                      <div className="activity-details">
                        <p className="activity-title">
                          {activity.title}
                          {activity.status && (
                            <span
                              className="badge ms-2"
                              style={{
                                backgroundColor: activity.status === 'COMPLETED' ? '#51cf6620' : '#ffa50020',
                                color: activity.status === 'COMPLETED' ? '#51cf66' : '#ffa500',
                                fontSize: '10px',
                                padding: '4px 8px'
                              }}
                            >
                              {activity.status}
                            </span>
                          )}
                        </p>
                        <p className="activity-meta">
                          <i className="bi bi-calendar3 me-1"></i>
                          {formatDate(activity.date)}
                          {activity.members && (
                            <>
                              <i className="bi bi-people ms-3 me-1"></i>
                              {activity.members} members
                            </>
                          )}
                        </p>
                      </div>
                      <div className="activity-amount" style={{ color: itemColor, fontWeight: '600' }}>
                        {activity.type === 'settlement'
                          ? (isGiving ? '' : '+')
                          : ''}₹{activity.amount?.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-activity">
                <i className="bi bi-inbox"></i>
                <h4>No Activity Yet</h4>
                <p>Start by creating a group and adding expenses</p>
                <button
                  className="btn btn-gradient-primary mt-3"
                  onClick={() => navigate('/groups/create')}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Group
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activity;
