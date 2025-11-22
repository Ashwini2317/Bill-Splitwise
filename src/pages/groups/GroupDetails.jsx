import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetGroupByIdQuery, useAddMemberMutation, useRemoveMemberMutation } from '../../redux/api/groupApi';
import { useGetGroupExpensesQuery, useGetGroupBalancesQuery } from '../../redux/api/expenseApi';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import '../../css/groups.css';
import '../../css/expenses.css';

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: group, isLoading: groupLoading } = useGetGroupByIdQuery(groupId);
  const { data: expenses, isLoading: expensesLoading } = useGetGroupExpensesQuery(groupId);
  const { data: balances } = useGetGroupBalancesQuery(groupId);
  const [addMember] = useAddMemberMutation();
  const [removeMember] = useRemoveMemberMutation();

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState('');

  const categories = {
    Food: { icon: 'bi-cart', color: '#ff6b6b' },
    Travel: { icon: 'bi-airplane', color: '#4ecdc4' },
    Rent: { icon: 'bi-house', color: '#45b7d1' },
    Utility: { icon: 'bi-lightning', color: '#f9ca24' },
    Entertainment: { icon: 'bi-film', color: '#a29bfe' },
    Other: { icon: 'bi-three-dots', color: '#95afc0' }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await addMember({ groupId, userId: newMemberEmail, role: 'MEMBER' }).unwrap();
      setNewMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      setError(err?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember({ groupId, userId }).unwrap();
      } catch (err) {
        alert(err?.data?.message || 'Failed to remove member');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const calculateTotalExpenses = () => {
    return expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  };

  const calculateYourShare = () => {
    let total = 0;
    expenses?.forEach(expense => {
      const yourSplit = expense.splits?.find(s => s.user._id === user._id || s.user === user._id);
      if (yourSplit) total += yourSplit.amount;
    });
    return total;
  };

  if (groupLoading) {
    return (
      <div className="page-wrapper d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="mt-3 text-muted">Loading group details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Main Content */}
      <div className="container py-4">
        {/* Group Header */}
        <div className="group-header-large animate-fadeInUp">
          <div className="row align-items-center">
            <div className="col-auto">
              <div className="group-icon-large">
                <i className="bi bi-people-fill"></i>
              </div>
            </div>
            <div className="col">
              <h2 className="mb-1 fw-bold">{group?.name}</h2>
              <p className="text-muted mb-0">
                <i className="bi bi-card-text me-2"></i>
                {group?.description || 'No description'}
              </p>
            </div>
            <div className="col-auto">
              <button
                className="btn btn-gradient-expense btn-lg"
                onClick={() => navigate(`/groups/${groupId}/add-expense`)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Expense
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-box-value">₹{calculateTotalExpenses().toFixed(2)}</div>
              <div className="stat-box-label">Total Expenses</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">{group?.members?.length || 0}</div>
              <div className="stat-box-label">Members</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">{expenses?.length || 0}</div>
              <div className="stat-box-label">Transactions</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">₹{calculateYourShare().toFixed(2)}</div>
              <div className="stat-box-label">Your Share</div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          {/* Members Sidebar */}
          <div className="col-lg-4 mb-4">
            <div className="card border-0 shadow-sm animate-fadeInUp animation-delay-1" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-people me-2 text-primary"></i>
                    Members
                  </h5>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowAddMember(!showAddMember)}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Add
                  </button>
                </div>

                {showAddMember && (
                  <div className="mb-3 p-3" style={{ background: '#f8f9fa', borderRadius: '12px' }}>
                    <form onSubmit={handleAddMember}>
                      <label className="form-label fw-semibold small">User ID or Email</label>
                      <input
                        type="text"
                        className="form-control mb-2"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Enter user ID"
                        required
                        style={{ borderRadius: '8px' }}
                      />
                      {error && (
                        <div className="alert alert-danger alert-sm py-2 mb-2" style={{ fontSize: '12px' }}>
                          {error}
                        </div>
                      )}
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary btn-sm flex-fill">
                          Add
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm flex-fill"
                          onClick={() => {
                            setShowAddMember(false);
                            setError('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="member-list">
                  {group?.members?.map((member) => (
                    <div key={member.user._id} className="member-item">
                      <div className="member-avatar">
                        {member.user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-0 fw-semibold">{member.user.name}</p>
                        <small className="text-muted">{member.role}</small>
                      </div>
                      {member.user._id !== group.createdBy._id && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveMember(member.user._id)}
                          style={{ fontSize: '12px', padding: '4px 12px' }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Balances Section */}
                {balances && balances.length > 0 && (
                  <>
                    <hr className="my-4" />
                    <h6 className="mb-3 fw-bold">
                      <i className="bi bi-wallet2 me-2 text-success"></i>
                      Balances
                    </h6>
                    <div className="space-y-2">
                      {balances.map((balance, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-3"
                          style={{
                            background: balance.balance >= 0 ? '#d4edda' : '#f8d7da',
                            border: `1px solid ${balance.balance >= 0 ? '#c3e6cb' : '#f5c6cb'}`
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold" style={{ fontSize: '14px' }}>
                              {balance.userName}
                            </span>
                            <span className="fw-bold" style={{
                              color: balance.balance >= 0 ? '#155724' : '#721c24',
                              fontSize: '15px'
                            }}>
                              {balance.balance >= 0 ? '+' : ''}₹{balance.balance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm animate-fadeInUp animation-delay-2" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4">
                <h5 className="mb-4 fw-bold">
                  <i className="bi bi-receipt me-2 text-danger"></i>
                  Expenses
                </h5>

                {expensesLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-3 text-muted">Loading expenses...</p>
                  </div>
                ) : expenses && expenses.length > 0 ? (
                  <div>
                    {expenses.map((expense) => {
                      const categoryInfo = categories[expense.category] || categories.Other;
                      return (
                        <div
                          key={expense._id}
                          className="expense-card"
                          style={{ '--category-color': categoryInfo.color }}
                        >
                          <div className="expense-header">
                            <div>
                              <h5 className="expense-title">{expense.title}</h5>
                              <span
                                className="expense-category-badge"
                                style={{ background: categoryInfo.color }}
                              >
                                <i className={`bi ${categoryInfo.icon}`}></i>
                                {expense.category}
                              </span>
                            </div>
                            <div className="text-end">
                              <div className="expense-amount">₹{expense.amount?.toFixed(2)}</div>
                              <button
                                className="btn btn-sm btn-outline-primary mt-2"
                                onClick={() => navigate(`/groups/${groupId}/edit-expense`, { state: { expense } })}
                                style={{ borderRadius: '8px', fontSize: '12px' }}
                              >
                                <i className="bi bi-pencil me-1"></i>
                                Edit
                              </button>
                            </div>
                          </div>

                          {expense.description && (
                            <p className="text-muted mb-2" style={{ fontSize: '14px' }}>
                              {expense.description}
                            </p>
                          )}

                          <div className="expense-meta">
                            <div className="expense-meta-item">
                              <i className="bi bi-person-circle"></i>
                              <span>Paid by <strong>{expense.paidBy?.name}</strong></span>
                            </div>
                            <div className="expense-meta-item">
                              <i className="bi bi-calendar3"></i>
                              <span>{formatDate(expense.createdAt)}</span>
                            </div>
                            <div className="expense-meta-item">
                              <i className="bi bi-people"></i>
                              <span>{expense.splits?.length || 0} members</span>
                            </div>
                          </div>

                          {/* Split Info - Enhanced Display */}
                          {expense.splits && expense.splits.length > 0 && (
                            <div className="mt-3 pt-3 border-top">
                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <small className="text-muted fw-bold">
                                  <i className="bi bi-scissors me-1"></i>
                                  Per Person Share
                                </small>
                                <small className="text-muted">
                                  <i className="bi bi-people-fill me-1"></i>
                                  {expense.splits.length} members
                                </small>
                              </div>
                              <div className="row g-2">
                                {expense.splits.map((split, idx) => {
                                  const isPayer = split.user?._id === expense.paidBy?._id || split.user === expense.paidBy?._id;
                                  return (
                                    <div key={idx} className="col-md-6">
                                      <div
                                        className="split-card"
                                        style={{
                                          background: isPayer ? 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                          border: isPayer ? '2px solid #37b24d' : '2px solid #dee2e6',
                                          borderRadius: '12px',
                                          padding: '12px 16px',
                                          position: 'relative',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {isPayer && (
                                          <div
                                            style={{
                                              position: 'absolute',
                                              top: '4px',
                                              right: '8px',
                                              fontSize: '10px',
                                              background: 'rgba(255,255,255,0.3)',
                                              color: 'white',
                                              padding: '2px 8px',
                                              borderRadius: '10px',
                                              fontWeight: '600'
                                            }}
                                          >
                                            <i className="bi bi-check-circle-fill me-1"></i>
                                            PAID
                                          </div>
                                        )}
                                        <div className="d-flex align-items-center justify-content-between">
                                          <div className="d-flex align-items-center gap-2">
                                            <div
                                              style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: isPayer ? 'rgba(255,255,255,0.3)' : '#667eea',
                                                color: isPayer ? 'white' : 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '700',
                                                fontSize: '16px'
                                              }}
                                            >
                                              {(split.user?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                              <div
                                                style={{
                                                  fontWeight: '600',
                                                  fontSize: '14px',
                                                  color: isPayer ? 'white' : '#2c3e50'
                                                }}
                                              >
                                                {split.user?.name || 'Unknown'}
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: '11px',
                                                  color: isPayer ? 'rgba(255,255,255,0.9)' : '#6c757d',
                                                  marginTop: '2px'
                                                }}
                                              >
                                                {isPayer ? 'Paid' : 'To Pay'}
                                              </div>
                                            </div>
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: '700',
                                              fontSize: '18px',
                                              color: isPayer ? 'white' : '#2c3e50'
                                            }}
                                          >
                                            ₹{split.amount?.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state-small">
                    <i className="bi bi-inbox"></i>
                    <h5 className="mt-3 mb-2">No Expenses Yet</h5>
                    <p className="text-muted mb-4">Start tracking expenses by adding your first one</p>
                    <button
                      className="btn btn-gradient-expense"
                      onClick={() => navigate(`/groups/${groupId}/add-expense`)}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Add First Expense
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
