import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useGetGroupByIdQuery } from '../../redux/api/groupApi';
import { useUpdateExpenseMutation, useDeleteExpenseMutation } from '../../redux/api/expenseApi';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import '../../css/expenses.css';

const EditExpense = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const expense = location.state?.expense;
  const { user } = useSelector((state) => state.auth);

  const { data: group, isLoading: groupLoading, error: groupError } = useGetGroupByIdQuery(groupId);
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const [formData, setFormData] = useState({
    title: expense?.title || '',
    description: expense?.description || '',
    amount: expense?.amount || '',
    category: expense?.category || 'Food',
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [splitType, setSplitType] = useState('equal');
  const [customSplits, setCustomSplits] = useState({});
  const [paidBy, setPaidBy] = useState(expense?.paidBy?._id || expense?.paidBy || user._id);
  const [error, setError] = useState('');

  const categories = [
    { value: 'Food', icon: 'bi-cart', color: '#ff6b6b' },
    { value: 'Travel', icon: 'bi-airplane', color: '#4ecdc4' },
    { value: 'Rent', icon: 'bi-house', color: '#45b7d1' },
    { value: 'Utility', icon: 'bi-lightning', color: '#f9ca24' },
    { value: 'Entertainment', icon: 'bi-film', color: '#a29bfe' },
    { value: 'Other', icon: 'bi-three-dots', color: '#95afc0' }
  ];

  // Initialize from existing expense
  useEffect(() => {
    if (expense?.splits && group?.members) {
      // Initialize selected members
      const memberIds = expense.splits.map(s => s.user._id || s.user);
      setSelectedMembers(memberIds);

      // Detect split type
      const totalAmount = parseFloat(expense.amount);
      const firstSplit = expense.splits[0];
      const splitAmount = parseFloat(firstSplit.amount);

      // Check if all splits are equal
      const allEqual = expense.splits.every(s => Math.abs(parseFloat(s.amount) - splitAmount) < 0.01);

      if (allEqual) {
        setSplitType('equal');
      } else {
        // Set to exact amounts
        setSplitType('exact');
        const customSplitValues = {};
        expense.splits.forEach(split => {
          customSplitValues[split.user._id || split.user] = parseFloat(split.amount);
        });
        setCustomSplits(customSplitValues);
      }
    }
  }, [expense, group]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) => {
      const newMembers = prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId];

      // Initialize custom split if needed
      if (!prev.includes(memberId) && splitType !== 'equal') {
        setCustomSplits(splits => ({
          ...splits,
          [memberId]: 0
        }));
      } else if (prev.includes(memberId)) {
        // Remove from custom splits
        setCustomSplits(splits => {
          const newSplits = { ...splits };
          delete newSplits[memberId];
          return newSplits;
        });
      }

      return newMembers;
    });
  };

  const updateCustomSplit = (memberId, value) => {
    setCustomSplits(prev => ({
      ...prev,
      [memberId]: parseFloat(value) || 0
    }));
  };

  const selectAllMembers = () => {
    if (selectedMembers.length === group?.members?.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(group?.members?.map(m => m.user._id) || []);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedMembers.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }

    try {
      const amount = parseFloat(formData.amount);
      let splits = [];

      // Calculate splits based on split type
      if (splitType === 'equal') {
        const splitAmount = amount / selectedMembers.length;
        splits = selectedMembers.map(memberId => ({
          user: memberId,
          amount: splitAmount
        }));
      } else if (splitType === 'exact') {
        // Validate exact amounts
        const totalCustom = Object.values(customSplits).reduce((sum, val) => sum + val, 0);
        if (Math.abs(totalCustom - amount) > 0.01) {
          setError(`Split amounts (₹${totalCustom.toFixed(2)}) must equal total amount (₹${amount.toFixed(2)})`);
          return;
        }
        splits = selectedMembers.map(memberId => ({
          user: memberId,
          amount: customSplits[memberId] || 0
        }));
      } else if (splitType === 'percentage') {
        // Validate percentages
        const totalPercentage = Object.values(customSplits).reduce((sum, val) => sum + val, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          setError(`Percentages (${totalPercentage.toFixed(1)}%) must equal 100%`);
          return;
        }
        splits = selectedMembers.map(memberId => ({
          user: memberId,
          amount: (amount * (customSplits[memberId] || 0)) / 100
        }));
      }

      const updates = {
        title: formData.title,
        description: formData.description,
        amount: amount,
        category: formData.category,
        paidBy: paidBy,
        splits: splits
      };

      await updateExpense({ expenseId: expense._id, updates }).unwrap();
      navigate(`/groups/${groupId}`);
    } catch (err) {
      setError(err?.data?.message || 'Failed to update expense');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      try {
        await deleteExpense(expense._id).unwrap();
        navigate(`/groups/${groupId}`);
      } catch (err) {
        setError(err?.data?.message || 'Failed to delete expense');
      }
    }
  };

  if (!expense) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="container py-5 text-center">
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Expense data not found. Please go back and try again.
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/groups/${groupId}`)}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to Group
          </button>
        </div>
      </div>
    );
  }

  if (groupLoading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary"></div>
          <p className="mt-3">Loading group data...</p>
        </div>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="container py-5 text-center">
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Failed to load group data. Please try again.
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/groups/${groupId}`)}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Main Content */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Header Card */}
            <div className="header-card mb-4">
              <div className="header-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <i className="bi bi-pencil-square"></i>
              </div>
              <div>
                <h2 className="mb-2">Edit Expense</h2>
                <p className="text-muted mb-0">
                  <i className="bi bi-people me-2"></i>
                  {group?.name} • {group?.members?.length} members
                </p>
              </div>
            </div>

            {/* Form Card */}
            <div className="card form-card border-0 shadow-lg">
              <div className="card-body p-5">
                <form onSubmit={handleUpdate}>
                  {/* Expense Title */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-bookmark me-2 text-primary"></i>
                      Expense Title
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-tag text-primary"></i>
                      </span>
                      <input
                        type="text"
                        name="title"
                        className="form-control border-start-0 ps-0"
                        placeholder="e.g., Dinner at restaurant"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-currency-rupee me-2 text-success"></i>
                      Amount
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-cash text-success"></i>
                      </span>
                      <input
                        type="number"
                        name="amount"
                        className="form-control border-start-0 ps-0"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-3">
                      <i className="bi bi-grid me-2 text-warning"></i>
                      Category
                    </label>
                    <div className="row g-3">
                      {categories.map((cat) => (
                        <div key={cat.value} className="col-4 col-md-2">
                          <div
                            className={`category-card ${formData.category === cat.value ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, category: cat.value })}
                            style={{ '--category-color': cat.color }}
                          >
                            <i className={`bi ${cat.icon}`}></i>
                            <span>{cat.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-card-text me-2 text-info"></i>
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="3"
                      placeholder="Add notes or details..."
                      value={formData.description}
                      onChange={handleChange}
                      style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
                    />
                  </div>

                  {/* Paid By */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-wallet2 me-2 text-success"></i>
                      Paid By
                    </label>
                    <div className="row g-2">
                      {group?.members?.map((member) => (
                        <div key={member.user._id} className="col-md-6">
                          <div
                            className={`paid-by-card ${paidBy === member.user._id ? 'active' : ''}`}
                            onClick={() => setPaidBy(member.user._id)}
                          >
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="paidBy"
                                checked={paidBy === member.user._id}
                                onChange={() => setPaidBy(member.user._id)}
                              />
                              <label className="form-check-label fw-semibold">
                                {member.user.name}
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Split Type */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-distribute-vertical me-2 text-primary"></i>
                      Split Type
                    </label>
                    <div className="row g-2">
                      <div className="col-4">
                        <div
                          className={`split-type-card ${splitType === 'equal' ? 'active' : ''}`}
                          onClick={() => {
                            setSplitType('equal');
                            setCustomSplits({});
                          }}
                        >
                          <i className="bi bi-percent"></i>
                          <span>Equal</span>
                          <small>Split equally</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div
                          className={`split-type-card ${splitType === 'exact' ? 'active' : ''}`}
                          onClick={() => {
                            setSplitType('exact');
                            const newSplits = {};
                            selectedMembers.forEach(id => newSplits[id] = 0);
                            setCustomSplits(newSplits);
                          }}
                        >
                          <i className="bi bi-currency-rupee"></i>
                          <span>Exact</span>
                          <small>Specific amounts</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div
                          className={`split-type-card ${splitType === 'percentage' ? 'active' : ''}`}
                          onClick={() => {
                            setSplitType('percentage');
                            const newSplits = {};
                            selectedMembers.forEach(id => newSplits[id] = 0);
                            setCustomSplits(newSplits);
                          }}
                        >
                          <i className="bi bi-pie-chart"></i>
                          <span>Percent</span>
                          <small>By percentage</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Split With Members */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="form-label fw-semibold mb-0">
                        <i className="bi bi-people me-2 text-danger"></i>
                        Split With Members
                      </label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={selectAllMembers}
                      >
                        {selectedMembers.length === group?.members?.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="members-grid">
                      {group?.members?.map((member) => {
                        const isSelected = selectedMembers.includes(member.user._id);
                        return (
                          <div key={member.user._id}>
                            <div
                              className={`member-select-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => toggleMember(member.user._id)}
                            >
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleMember(member.user._id)}
                                />
                                <label className="form-check-label fw-semibold">
                                  {member.user.name}
                                </label>
                              </div>
                              {isSelected && splitType === 'equal' && formData.amount && (
                                <small className="text-muted">
                                  ₹{(parseFloat(formData.amount) / selectedMembers.length).toFixed(2)}
                                </small>
                              )}
                            </div>
                            {isSelected && splitType !== 'equal' && (
                              <div className="mt-2">
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  placeholder={splitType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
                                  value={customSplits[member.user._id] || ''}
                                  onChange={(e) => updateCustomSplit(member.user._id, e.target.value)}
                                  step={splitType === 'percentage' ? '0.1' : '0.01'}
                                  min="0"
                                  max={splitType === 'percentage' ? '100' : undefined}
                                  style={{ borderRadius: '8px' }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Split Summary */}
                  {splitType === 'equal' && formData.amount && selectedMembers.length > 0 && (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Each person pays: <strong>₹{(parseFloat(formData.amount) / selectedMembers.length).toFixed(2)}</strong>
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-danger alert-dismissible show" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                      <button type="button" className="btn-close" onClick={() => setError('')}></button>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="d-flex gap-3 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg"
                      onClick={() => navigate(`/groups/${groupId}`)}
                      style={{ borderRadius: '12px', flex: '1 1 auto' }}
                      disabled={isUpdating || isDeleting}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-lg"
                      onClick={handleDelete}
                      disabled={isUpdating || isDeleting}
                      style={{ borderRadius: '12px', flex: '1 1 auto' }}
                    >
                      {isDeleting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-trash me-2"></i>
                          Delete
                        </>
                      )}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-gradient-expense btn-lg"
                      disabled={isUpdating || isDeleting}
                      style={{ flex: '1 1 auto' }}
                    >
                      {isUpdating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Update Expense
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditExpense;
