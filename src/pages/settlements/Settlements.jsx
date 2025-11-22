import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetUserSettlementsQuery, useCreateSettlementMutation, useUpdateSettlementMutation } from '../../redux/api/settlement';
import Navbar from '../../components/Navbar';
import '../../css/Settlements.css';
import '../../css/groups.css';
import '../../css/Activity.css';

const Settlements = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: settlements, isLoading, error, isFetching } = useGetUserSettlementsQuery(user?._id, {
    skip: !user?._id,
    pollingInterval: 0, // Disable auto-polling
    refetchOnMountOrArgChange: false, // Prevent refetch on mount
  });
  const [createSettlement] = useCreateSettlementMutation();
  const [updateSettlement] = useUpdateSettlementMutation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Debug: Track settlements changes
  useEffect(() => {
    console.log("🔍 Settlements Updated:");
    console.log("  Data:", settlements);
    console.log("  Is Loading:", isLoading);
    console.log("  Is Fetching:", isFetching);
    console.log("  Error:", error);
    console.log("  User ID:", user?._id);
  }, [settlements, isLoading, isFetching, error, user]);

  const handleMigration = async () => {
    if (window.confirm('This will create settlements from all existing expenses. Continue?')) {
      setIsMigrating(true);
      try {
        const response = await fetch('http://localhost:5000/api/settlement/migrate', {
          method: 'POST',
          credentials: 'include',
        });
        const data = await response.json();

        if (response.ok) {
          alert(`Migration successful!\nSettlements created: ${data.summary.settlementsCreated}\nSettlements updated: ${data.summary.settlementsUpdated}`);
          window.location.reload(); // Refresh to show new data
        } else {
          alert(data.message || 'Migration failed');
        }
      } catch (err) {
        console.error('Migration error:', err);
        alert('Failed to run migration');
      } finally {
        setIsMigrating(false);
      }
    }
  };

  const handleMarkAsPaid = async (settlementId) => {
    if (window.confirm('Mark this settlement as completed?')) {
      try {
        await updateSettlement({
          settlementId,
          updates: { status: 'COMPLETED' }
        }).unwrap();
      } catch (err) {
        console.error('Failed to update settlement:', err);
        alert(err?.data?.message || 'Failed to mark as paid');
      }
    }
  };

  const calculateTotals = () => {
    if (!settlements || !user) return { owe: 0, owed: 0 };

    let totalOwe = 0;
    let totalOwed = 0;

    settlements.forEach(settlement => {
      if (settlement.status?.toUpperCase() !== 'COMPLETED') {
        if (settlement.from?._id === user._id || settlement.from === user._id) {
          totalOwe += settlement.amount;
        } else if (settlement.to?._id === user._id || settlement.to === user._id) {
          totalOwed += settlement.amount;
        }
      }
    });

    return { owe: totalOwe, owed: totalOwed };
  };

  const { owe, owed } = calculateTotals();

  // Calculate person-wise balances
  const personBalances = useMemo(() => {
    if (!settlements || !user) return {};

    const balances = {}; // { personId: { name, email, amount, groups: [] } }

    settlements.forEach(settlement => {
      // Skip completed settlements
      if (settlement.status?.toUpperCase() === 'COMPLETED') return;

      const isFromUser = settlement.from?._id === user._id || settlement.from === user._id;
      const isToUser = settlement.to?._id === user._id || settlement.to === user._id;
      const groupName = settlement.group?.name || 'Unknown Group';

      if (isFromUser) {
        // User owes money to someone
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
    });

    return balances;
  }, [settlements, user]);

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
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: 'bi-phone',
      description: 'Pay using UPI apps',
      class: 'upi'
    },
    {
      id: 'card',
      name: 'Card',
      icon: 'bi-credit-card',
      description: 'Debit or Credit Card',
      class: 'card'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: 'bi-bank',
      description: 'Direct bank transfer',
      class: 'bank'
    },
    {
      id: 'cash',
      name: 'Cash',
      icon: 'bi-cash-coin',
      description: 'Pay with cash',
      class: 'cash'
    }
  ];

  if (isLoading) {
    return (
      <div className="page-wrapper d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="mt-3 text-muted">Loading settlements...</p>
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
          <div className="header-icon" style={{ background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)' }}>
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="flex-grow-1">
            <h2 className="mb-2">Settlements</h2>
            <p className="text-muted mb-0">Manage payments and track settlements</p>
          </div>
          {(!settlements || settlements.length === 0) && !isLoading && (
            <button
              className="btn btn-outline-primary"
              onClick={handleMigration}
              disabled={isMigrating}
            >
              {isMigrating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating Settlements...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-repeat me-2"></i>
                  Create Settlements
                </>
              )}
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="row mb-5">
          <div className="col-md-6 mb-4">
            <div className="settlement-summary-card owe animate-fadeInUp">
              <div className="summary-icon-large">
                <i className="bi bi-arrow-up-circle"></i>
              </div>
              <div className="summary-label">Total You Owe</div>
              <div className="summary-amount-large owe">₹{owe.toFixed(2)}</div>
              {owe > 0 && (
                <button className="btn btn-settle mt-3">
                  <i className="bi bi-credit-card me-2"></i>
                  Settle Up Now
                </button>
              )}
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="settlement-summary-card owed animate-fadeInUp">
              <div className="summary-icon-large">
                <i className="bi bi-arrow-down-circle"></i>
              </div>
              <div className="summary-label">Total You Are Owed</div>
              <div className="summary-amount-large owed">₹{owed.toFixed(2)}</div>
              {owed > 0 && (
                <button
                  className="btn btn-settle mt-3"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <i className="bi bi-bell me-2"></i>
                  Send Reminder
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Person-wise Balance Breakdown */}
        {(peopleYouOwe.length > 0 || peopleWhoOweYou.length > 0) && (
          <div className="row mb-4">
            {/* People You Owe */}
            {peopleYouOwe.length > 0 && (
              <div className="col-lg-6 mb-4">
                <div className="card border-0 shadow-sm animate-slideInLeft" style={{ borderRadius: '20px' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-4 fw-bold">
                      <i className="bi bi-arrow-up-circle me-2" style={{ color: '#ff6b6b' }}></i>
                      You Owe
                    </h5>

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
                            <p className="person-status" style={{ color: '#ff6b6b', fontWeight: '600', fontSize: '14px' }}>
                              <i className="bi bi-arrow-right me-1"></i>
                              You owe: ₹{Math.abs(person.amount).toFixed(2)}
                            </p>
                            {person.groups && person.groups.length > 0 && (
                              <p className="person-status" style={{ fontSize: '11px', marginTop: '4px', color: '#6c757d' }}>
                                <i className="bi bi-people-fill me-1"></i>
                                {person.groups.join(', ')}
                              </p>
                            )}
                            {person.email && (
                              <p className="person-status" style={{ fontSize: '11px', marginTop: '2px', color: '#6c757d' }}>{person.email}</p>
                            )}
                          </div>
                          <div>
                            <button
                              className="btn btn-sm btn-settle"
                              style={{ fontSize: '12px', padding: '6px 16px' }}
                            >
                              <i className="bi bi-credit-card me-1"></i>
                              Pay Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* People Who Owe You */}
            {peopleWhoOweYou.length > 0 && (
              <div className="col-lg-6 mb-4">
                <div className="card border-0 shadow-sm animate-slideInRight" style={{ borderRadius: '20px' }}>
                  <div className="card-body p-4">
                    <h5 className="mb-4 fw-bold">
                      <i className="bi bi-arrow-down-circle me-2" style={{ color: '#51cf66' }}></i>
                      You Are Owed
                    </h5>

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
                            <p className="person-status" style={{ color: '#51cf66', fontWeight: '600', fontSize: '14px' }}>
                              <i className="bi bi-arrow-left me-1"></i>
                              Owes you: ₹{person.amount.toFixed(2)}
                            </p>
                            {person.groups && person.groups.length > 0 && (
                              <p className="person-status" style={{ fontSize: '11px', marginTop: '4px', color: '#6c757d' }}>
                                <i className="bi bi-people-fill me-1"></i>
                                {person.groups.join(', ')}
                              </p>
                            )}
                            {person.email && (
                              <p className="person-status" style={{ fontSize: '11px', marginTop: '2px', color: '#6c757d' }}>{person.email}</p>
                            )}
                          </div>
                          <div>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              style={{ fontSize: '12px', padding: '6px 16px' }}
                            >
                              <i className="bi bi-bell me-1"></i>
                              Remind
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="row">
          {/* Settlements List */}
          <div className="col-lg-8 mb-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4 fw-bold">
                  <i className="bi bi-list-ul me-2 text-primary"></i>
                  Recent Settlements ({settlements?.length || 0})
                </h5>

                {settlements && settlements.length > 0 ? (
                  <div>
                    {settlements.map((settlement, index) => {
                      console.log(`Settlement ${index}:`, settlement);
                      console.log(`  - from:`, settlement.from);
                      console.log(`  - to:`, settlement.to);
                      console.log(`  - amount:`, settlement.amount);
                      console.log(`  - status:`, settlement.status);

                      const isFromUser = settlement.from?._id === user._id || settlement.from === user._id;
                      const statusClass = settlement.status?.toLowerCase() || 'pending';

                      return (
                        <div
                          key={settlement._id}
                          className={`settlement-card ${statusClass}`}
                          style={{ marginBottom: '12px' }}
                        >
                          {/* Header with Status */}
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <div className="settlement-icon" style={{ width: '28px', height: '28px', fontSize: '14px' }}>
                                <i className={`bi ${settlement.status?.toUpperCase() === 'COMPLETED' ? 'bi-check-circle' : 'bi-clock-history'}`}></i>
                              </div>
                              <div>
                                <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                                  <i className="bi bi-calendar3 me-1"></i>
                                  {formatDate(settlement.date || settlement.createdAt)}
                                </small>
                                <small className="text-muted" style={{ fontSize: '10px' }}>
                                  <i className={`bi ${
                                    settlement.paymentMethod === 'UPI' ? 'bi-phone' :
                                    settlement.paymentMethod === 'Card' ? 'bi-credit-card' :
                                    settlement.paymentMethod === 'Bank' ? 'bi-bank' :
                                    'bi-cash-coin'
                                  } me-1`}></i>
                                  {settlement.paymentMethod || 'UPI'}
                                </small>
                              </div>
                            </div>
                            <span className={`status-badge ${statusClass}`} style={{ fontSize: '10px', padding: '3px 8px' }}>
                              {settlement.status || 'Pending'}
                            </span>
                          </div>

                          {/* Main Settlement Amount */}
                          <div className="text-center mb-2 pb-2 border-bottom">
                            <small className="text-muted d-block mb-1" style={{ fontSize: '10px' }}>Settlement Amount</small>
                            <div className="settlement-amount" style={{ fontSize: '22px', fontWeight: '700', color: '#667eea' }}>
                              ₹{settlement.amount?.toFixed(2)}
                            </div>
                          </div>

                          {/* Two Members Display */}
                          <div className="row g-2">
                            {/* From (Who Owes) */}
                            <div className="col-6">
                              <div
                                style={{
                                  background: isFromUser
                                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                  border: isFromUser ? '2px solid #ee5a6f' : '2px solid #dee2e6',
                                  borderRadius: '10px',
                                  padding: '10px',
                                  textAlign: 'center',
                                  position: 'relative'
                                }}
                              >
                                {isFromUser && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '3px',
                                      right: '6px',
                                      fontSize: '8px',
                                      background: 'rgba(255,255,255,0.3)',
                                      color: 'white',
                                      padding: '2px 5px',
                                      borderRadius: '6px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    YOU
                                  </div>
                                )}
                                <div
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: isFromUser ? 'rgba(255,255,255,0.3)' : '#ff6b6b',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    fontSize: '16px',
                                    margin: '0 auto 8px'
                                  }}
                                >
                                  {(settlement.from?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div
                                  style={{
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    color: isFromUser ? 'white' : '#2c3e50',
                                    marginBottom: '3px'
                                  }}
                                >
                                  {settlement.from?.name || 'Unknown'}
                                </div>
                                <div
                                  style={{
                                    fontSize: '9px',
                                    color: isFromUser ? 'rgba(255,255,255,0.9)' : '#6c757d',
                                    marginBottom: '6px'
                                  }}
                                >
                                  Owes
                                </div>
                                <div
                                  style={{
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    color: isFromUser ? 'white' : '#ff6b6b'
                                  }}
                                >
                                  - ₹{settlement.amount?.toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* To (Who Receives) */}
                            <div className="col-6">
                              <div
                                style={{
                                  background: !isFromUser
                                    ? 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)'
                                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                  border: !isFromUser ? '2px solid #37b24d' : '2px solid #dee2e6',
                                  borderRadius: '10px',
                                  padding: '10px',
                                  textAlign: 'center',
                                  position: 'relative'
                                }}
                              >
                                {!isFromUser && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '3px',
                                      right: '6px',
                                      fontSize: '8px',
                                      background: 'rgba(255,255,255,0.3)',
                                      color: 'white',
                                      padding: '2px 5px',
                                      borderRadius: '6px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    YOU
                                  </div>
                                )}
                                <div
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: !isFromUser ? 'rgba(255,255,255,0.3)' : '#51cf66',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    fontSize: '16px',
                                    margin: '0 auto 8px'
                                  }}
                                >
                                  {(settlement.to?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div
                                  style={{
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    color: !isFromUser ? 'white' : '#2c3e50',
                                    marginBottom: '3px'
                                  }}
                                >
                                  {settlement.to?.name || 'Unknown'}
                                </div>
                                <div
                                  style={{
                                    fontSize: '9px',
                                    color: !isFromUser ? 'rgba(255,255,255,0.9)' : '#6c757d',
                                    marginBottom: '6px'
                                  }}
                                >
                                  Receives
                                </div>
                                <div
                                  style={{
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    color: !isFromUser ? 'white' : '#51cf66'
                                  }}
                                >
                                  + ₹{settlement.amount?.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          {settlement.status?.toUpperCase() === 'PENDING' && (
                            <div className="text-center mt-2">
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleMarkAsPaid(settlement._id)}
                                style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '8px' }}
                              >
                                <i className="bi bi-check-circle me-1"></i>
                                Mark as Paid
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-settlement">
                    <i className="bi bi-inbox"></i>
                    <h4>No Settlements Yet</h4>
                    <p className="mb-4">Start adding expenses to see settlements here</p>
                    <button
                      className="btn btn-gradient-primary"
                      onClick={() => navigate('/dashboard')}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4 fw-bold">
                  <i className="bi bi-wallet2 me-2 text-success"></i>
                  Payment Methods
                </h5>

                <div className="row g-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="col-6">
                      <div
                        className={`payment-method-card ${method.class} ${selectedPaymentMethod === method.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="payment-method-icon">
                          <i className={`bi ${method.icon}`}></i>
                        </div>
                        <div className="payment-method-name">{method.name}</div>
                        <div className="payment-method-desc">{method.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="my-4" />

                <div className="alert alert-info mb-0" style={{ borderRadius: '12px' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  <small>
                    <strong>Tip:</strong> Always verify payment details before settling up!
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settlements;
