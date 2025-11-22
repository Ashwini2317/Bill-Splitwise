import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetGroupByIdQuery } from '../../redux/api/groupApi';
import { useAddExpenseMutation } from '../../redux/api/expenseApi';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import '../../css/expenses.css';

const AddExpense = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: group } = useGetGroupByIdQuery(groupId);
  const [addExpense, { isLoading }] = useAddExpenseMutation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'Food',
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [splitType, setSplitType] = useState('equal');
  const [customSplits, setCustomSplits] = useState({}); // For exact amounts or percentages
  const [error, setError] = useState('');

  const categories = [
    { value: 'Food', icon: 'bi-cart', color: '#ff6b6b' },
    { value: 'Travel', icon: 'bi-airplane', color: '#4ecdc4' },
    { value: 'Rent', icon: 'bi-house', color: '#45b7d1' },
    { value: 'Utility', icon: 'bi-lightning', color: '#f9ca24' },
    { value: 'Entertainment', icon: 'bi-film', color: '#a29bfe' },
    { value: 'Other', icon: 'bi-three-dots', color: '#95afc0' }
  ];

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
          [memberId]: splitType === 'percentage' ? 0 : 0
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

  const handleSubmit = async (e) => {
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

      const expenseData = {
        title: formData.title,
        description: formData.description,
        amount: amount,
        category: formData.category,
        group: groupId,
        paidBy: user._id,
        splits: splits
      };

      await addExpense(expenseData).unwrap();
      navigate(`/groups/${groupId}`);
    } catch (err) {
      setError(err?.data?.message || 'Failed to add expense');
    }
  };

  const selectedCategory = categories.find(c => c.value === formData.category);

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Main Content */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Header Card */}
            <div className="header-card mb-4">
              <div className="header-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <i className="bi bi-receipt"></i>
              </div>
              <div>
                <h2 className="mb-2">Add Expense</h2>
                <p className="text-muted mb-0">
                  <i className="bi bi-people me-2"></i>
                  {group?.name || 'Loading...'}
                </p>
              </div>
            </div>

            {/* Form Card */}
            <div className="card form-card border-0 shadow-lg">
              <div className="card-body p-5">
                <form onSubmit={handleSubmit}>
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
                        placeholder="e.g., Dinner at restaurant, Uber ride"
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
                            style={{
                              '--category-color': cat.color
                            }}
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
                            // Initialize custom splits for selected members
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
                            // Initialize custom splits for selected members
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

                  {/* Split With */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="form-label fw-semibold mb-0">
                        <i className="bi bi-people me-2 text-danger"></i>
                        Split With
                      </label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={selectAllMembers}
                        disabled={!group?.members}
                      >
                        {!group?.members ? 'Loading...' : selectedMembers.length === group?.members?.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="members-grid">
                      {!group?.members ? (
                        <div className="text-center text-muted py-4">
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Loading members...
                        </div>
                      ) : (
                        group?.members?.map((member) => (
                          <div key={member.user._id}>
                            <div
                              className={`member-select-card ${selectedMembers.includes(member.user._id) ? 'selected' : ''}`}
                              onClick={() => toggleMember(member.user._id)}
                            >
                              <div className="member-avatar-small">
                                {member.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="member-info-small">
                                <p className="mb-0 fw-semibold">{member.user.name}</p>
                                <small className="text-muted">{member.role}</small>
                              </div>
                              <div className="member-check">
                                {selectedMembers.includes(member.user._id) && (
                                  <i className="bi bi-check-circle-fill text-success"></i>
                                )}
                              </div>
                            </div>
                            {/* Custom split input for exact/percentage */}
                            {selectedMembers.includes(member.user._id) && splitType !== 'equal' && (
                              <div className="mt-2 px-2">
                                <div className="input-group input-group-sm">
                                  <span className="input-group-text">
                                    {splitType === 'percentage' ? '%' : '₹'}
                                  </span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder={splitType === 'percentage' ? '0' : '0.00'}
                                    value={customSplits[member.user._id] || ''}
                                    onChange={(e) => updateCustomSplit(member.user._id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    step={splitType === 'percentage' ? '1' : '0.01'}
                                    min="0"
                                  />
                                  {splitType === 'exact' && (
                                    <span className="input-group-text text-muted" style={{ fontSize: '11px' }}>
                                      {formData.amount && customSplits[member.user._id]
                                        ? `(${((customSplits[member.user._id] / parseFloat(formData.amount)) * 100).toFixed(1)}%)`
                                        : '(0%)'}
                                    </span>
                                  )}
                                  {splitType === 'percentage' && (
                                    <span className="input-group-text text-muted" style={{ fontSize: '11px' }}>
                                      {formData.amount && customSplits[member.user._id]
                                        ? `₹${((parseFloat(formData.amount) * customSplits[member.user._id]) / 100).toFixed(2)}`
                                        : '₹0.00'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {selectedMembers.length > 0 && splitType === 'equal' && (
                      <div className="alert alert-info mt-3 mb-0">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Split:</strong> ₹{formData.amount ? (parseFloat(formData.amount) / selectedMembers.length).toFixed(2) : '0.00'} per person
                      </div>
                    )}
                    {selectedMembers.length > 0 && splitType === 'exact' && (
                      <div className={`alert mt-3 mb-0 ${
                        Math.abs(Object.values(customSplits).reduce((sum, val) => sum + val, 0) - (parseFloat(formData.amount) || 0)) < 0.01
                          ? 'alert-success'
                          : 'alert-warning'
                      }`}>
                        <i className="bi bi-calculator me-2"></i>
                        <strong>Total:</strong> ₹{Object.values(customSplits).reduce((sum, val) => sum + val, 0).toFixed(2)} / ₹{formData.amount || '0.00'}
                      </div>
                    )}
                    {selectedMembers.length > 0 && splitType === 'percentage' && (
                      <div className={`alert mt-3 mb-0 ${
                        Math.abs(Object.values(customSplits).reduce((sum, val) => sum + val, 0) - 100) < 0.01
                          ? 'alert-success'
                          : 'alert-warning'
                      }`}>
                        <i className="bi bi-pie-chart me-2"></i>
                        <strong>Total:</strong> {Object.values(customSplits).reduce((sum, val) => sum + val, 0).toFixed(1)}% / 100%
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="alert alert-danger alert-dismissible show" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                      <button type="button" className="btn-close" onClick={() => setError('')}></button>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="d-flex gap-3 mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg flex-fill"
                      onClick={() => navigate(`/groups/${groupId}`)}
                      style={{ borderRadius: '12px' }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-gradient-expense btn-lg flex-fill"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Adding...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Add Expense
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

export default AddExpense;
