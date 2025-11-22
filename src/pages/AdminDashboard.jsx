import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExcelUploadModal from '../components/ExcelUploadModal';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, members, addMember, updateMember, deleteMember, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      password: '', // Don't show existing password
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <button
            onClick={() => navigate('/admin/events')}
            className="events-button"
          >
            📅 Events Management
          </button>
          <span>Welcome, {user?.email}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="section-header">
          <h2>Members Management</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowExcelModal(true)}
              className="excel-upload-button"
            >
              📊 Upload Excel
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="add-button"
            >
              {showAddForm ? 'Cancel' : '+ Add Member'}
            </button>
          </div>
        </div>

        <ExcelUploadModal 
          isOpen={showExcelModal} 
          onClose={() => setShowExcelModal(false)} 
        />

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {(showAddForm || editingMember) && (
          <div className="add-member-form">
            <h3>{editingMember ? 'Edit Member' : 'Add New Member'}</h3>
            <form onSubmit={editingMember ? handleUpdateMember : handleAddMember}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Member name"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Member email"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password {editingMember ? '(leave blank to keep current)' : '*'}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingMember}
                    placeholder={editingMember ? "New password (optional)" : "Member password"}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number (optional)"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading 
                    ? (editingMember ? 'Updating...' : 'Adding...') 
                    : (editingMember ? 'Update Member' : 'Add Member')
                  }
                </button>
                {editingMember && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="cancel-button"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="members-list">
          <h3>All Members ({members.length})</h3>
          {members.length === 0 ? (
            <p className="empty-message">No members added yet.</p>
          ) : (
            <div className="members-table">
              <table>
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
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.phone || 'N/A'}</td>
                      <td>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '12px',
                          color: '#6e6e73'
                        }}>
                          {member.password ? '••••••••' : 'N/A'}
                        </span>
                      </td>
                      <td>
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(member)}
                            className="edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="delete-button"
                          >
                            Delete
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
  );
};

export default AdminDashboard;

