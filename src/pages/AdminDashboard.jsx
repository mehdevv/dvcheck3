import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiUpload, FiEdit2, FiTrash2, FiLogOut, FiCalendar, FiUser, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import ExcelUploadModal from '../components/ExcelUploadModal';
import './AdminDashboard.css';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const AdminDashboard = () => {
  const { user, members, addMember, updateMember, deleteMember, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.name && formData.email && formData.password) {
      setLoading(true);
      try {
        await addMember(formData);
        setFormData({ name: '', email: '', password: '', phone: '' });
        setShowAddForm(false);
      } catch (err) {
        setError(err.message || 'Failed to add member. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      password: '',
      phone: member.phone || '',
    });
    setShowAddForm(false);
    setError('');
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!editingMember) return;
    
    if (formData.name && formData.email) {
      setLoading(true);
      try {
        await updateMember(editingMember.id, formData);
        setFormData({ name: '', email: '', password: '', phone: '' });
        setEditingMember(null);
      } catch (err) {
        setError(err.message || 'Failed to update member. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setFormData({ name: '', email: '', password: '', phone: '' });
    setError('');
  };

  const handleDelete = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      setLoading(true);
      setError('');
      try {
        await deleteMember(memberId);
      } catch (err) {
        setError(err.message || 'Failed to delete member. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <header className="admin-dashboard-header">
        <div className="admin-header-content">
          <h1 className="admin-dashboard-title">DVcheck</h1>
          <div className="admin-header-actions">
            <button
              className="admin-header-btn"
              onClick={() => navigate('/admin/events')}
              aria-label="Events"
            >
              <FiCalendar size={18} />
              <span className="btn-text">Events</span>
            </button>
            <span className="admin-user-email">{user?.email}</span>
            <button
              className="admin-logout-btn"
              onClick={logout}
              aria-label="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="admin-dashboard-container">
        <div className="admin-dashboard-content">
          {/* Section Header */}
          <div className="admin-section-header">
            <h2 className="admin-section-title">Members Management</h2>
            <div className="admin-section-actions">
              <MotionButton
                className="admin-section-btn admin-section-btn-ghost"
                onClick={() => setIsExcelOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiUpload size={18} />
                <span className="btn-text">Upload Excel</span>
              </MotionButton>
              <MotionButton
                className="admin-section-btn admin-section-btn-primary"
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditingMember(null);
                  setFormData({ name: '', email: '', password: '', phone: '' });
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiPlus size={18} />
                <span className="btn-text">{showAddForm ? 'Cancel' : 'Add Member'}</span>
              </MotionButton>
            </div>
          </div>

          <ExcelUploadModal isOpen={isExcelOpen} onClose={() => setIsExcelOpen(false)} />

          {error && (
            <div className="admin-alert admin-alert-error">
              <FiAlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Add/Edit Form */}
          <AnimatePresence>
            {(showAddForm || editingMember) && (
              <MotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="admin-card"
              >
                <h3 className="admin-card-title">
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </h3>
                <form onSubmit={editingMember ? handleUpdateMember : handleAddMember}>
                  <div className="admin-form-grid">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Name *</label>
                      <input
                        type="text"
                        name="name"
                        className="admin-form-input"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Member name"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Email *</label>
                      <input
                        type="email"
                        name="email"
                        className="admin-form-input"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Member email"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Password {editingMember ? '(optional)' : '*'}
                      </label>
                      <input
                        type="password"
                        name="password"
                        className="admin-form-input"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={editingMember ? "New password (optional)" : "Member password"}
                        required={!editingMember}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        className="admin-form-input"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Phone number (optional)"
                      />
                    </div>
                  </div>
                  <div className="admin-form-actions">
                    <MotionButton
                      type="submit"
                      className="admin-section-btn admin-section-btn-primary"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading
                        ? (editingMember ? 'Updating...' : 'Adding...')
                        : (editingMember ? 'Update Member' : 'Add Member')
                      }
                    </MotionButton>
                    {editingMember && (
                      <button
                        type="button"
                        className="admin-section-btn admin-section-btn-ghost"
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </MotionDiv>
            )}
          </AnimatePresence>

          {/* Members List */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">All Members</h3>
              <span className="admin-badge">{members.length}</span>
            </div>

            {members.length === 0 ? (
              <div className="admin-empty-state">
                <FiUser size={48} className="admin-empty-state-icon" />
                <p className="admin-empty-state-text">No members added yet.</p>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Password</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td style={{ fontWeight: 500 }}>{member.name}</td>
                        <td style={{ color: '#6b7280' }}>{member.email}</td>
                        <td style={{ color: '#6b7280' }}>{member.phone || 'N/A'}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', color: '#9ca3af' }}>
                            {member.password ? '••••••••' : 'N/A'}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: 'var(--font-size-sm)' }}>
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="admin-action-buttons">
                            <button
                              className="admin-icon-btn"
                              onClick={() => handleEdit(member)}
                              aria-label="Edit member"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              className="admin-icon-btn admin-icon-btn-danger"
                              onClick={() => handleDelete(member.id)}
                              aria-label="Delete member"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
