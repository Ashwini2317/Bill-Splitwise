import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGroupMutation } from '../../redux/api/groupApi';
import Navbar from '../../components/Navbar';
import '../../css/groups.css';

const CreateGroup = () => {
  const navigate = useNavigate();
  const [createGroup, { isLoading }] = useCreateGroupMutation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState('');

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
      const result = await createGroup(formData).unwrap();
      navigate(`/groups/${result.group._id}`);
    } catch (err) {
      setError(err?.data?.message || 'Failed to create group');
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Main Content */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Header Card */}
            <div className="header-card mb-4 animate-fadeInUp">
              <div className="header-icon">
                <i className="bi bi-people-fill"></i>
              </div>
              <div>
                <h2 className="mb-2">Create New Group</h2>
                <p className="text-muted mb-0">Set up a group to track expenses with friends</p>
              </div>
            </div>

            {/* Form Card */}
            <div className="card form-card border-0 shadow-lg animate-fadeInUp animation-delay-1">
              <div className="card-body p-5">
                <form onSubmit={handleSubmit}>
                  {/* Group Name */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-bookmark me-2 text-primary"></i>
                      Group Name
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-people text-primary"></i>
                      </span>
                      <input
                        type="text"
                        name="name"
                        className="form-control border-start-0 ps-0"
                        placeholder="e.g., Trip to Goa, Flatmates, Office Lunch"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <small className="text-muted">Choose a memorable name for your group</small>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-card-text me-2 text-primary"></i>
                      Description
                    </label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="4"
                      placeholder="What's this group for?"
                      value={formData.description}
                      onChange={handleChange}
                      style={{ borderRadius: '12px', border: '2px solid #e9ecef' }}
                    />
                    <small className="text-muted">Add details about the purpose of this group</small>
                  </div>

                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show animate-shake" role="alert">
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
                      onClick={() => navigate('/dashboard')}
                      style={{ borderRadius: '12px' }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-gradient-primary btn-lg flex-fill"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Create Group
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Info Cards */}
                <div className="row mt-5 pt-4 border-top g-3">
                  <div className="col-md-4">
                    <div className="info-card">
                      <i className="bi bi-shield-check text-success"></i>
                      <p>Secure & Private</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="info-card">
                      <i className="bi bi-people text-primary"></i>
                      <p>Add Members Anytime</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="info-card">
                      <i className="bi bi-graph-up text-warning"></i>
                      <p>Track Expenses</p>
                    </div>
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

export default CreateGroup;
