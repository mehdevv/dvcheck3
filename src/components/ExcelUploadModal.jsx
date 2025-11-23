import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { FiDownload, FiUpload, FiAlertCircle, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './ExcelUploadModal.css';

const MotionButton = motion.button;

const ExcelUploadModal = ({ isOpen, onClose }) => {
  const { addMember } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const templateData = [
      ['Name', 'Email', 'Password', 'Phone'],
      ['John Doe', 'john@example.com', 'password123', '123-456-7890'],
      ['Jane Smith', 'jane@example.com', 'securepass', '987-654-3210'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    ws['!cols'] = [
      { wch: 20 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, 'members_template.xlsx');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    setIsUploading(true);
    setError('');
    setResults(null);
    setProgress({ current: 0, total: 0 });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: ''
      });

      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
      
      const nameIndex = findColumnIndex(headers, ['name', 'full name', 'member name']);
      const emailIndex = findColumnIndex(headers, ['email', 'e-mail', 'email address']);
      const passwordIndex = findColumnIndex(headers, ['password', 'pwd', 'pass']);
      const phoneIndex = findColumnIndex(headers, ['phone', 'phone number', 'mobile', 'tel']);

      if (nameIndex === -1 || emailIndex === -1 || passwordIndex === -1) {
        throw new Error('Excel file must contain columns: Name, Email, and Password');
      }

      const dataRows = jsonData.slice(1);
      const totalRows = dataRows.length;
      setProgress({ current: 0, total: totalRows });

      const successList = [];
      const errorList = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        try {
          const name = String(row[nameIndex] || '').trim();
          const email = String(row[emailIndex] || '').trim();
          const password = String(row[passwordIndex] || '').trim();
          const phone = phoneIndex !== -1 ? String(row[phoneIndex] || '').trim() : '';

          if (!name || !email || !password) {
            errorList.push({
              row: i + 2,
              error: 'Missing required fields (Name, Email, or Password)',
              data: { name, email, phone }
            });
            continue;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            errorList.push({
              row: i + 2,
              error: 'Invalid email format',
              data: { name, email, phone }
            });
            continue;
          }

          await addMember({
            name,
            email,
            password,
            phone
          });

          successList.push({ row: i + 2, name, email });
          setProgress({ current: i + 1, total: totalRows });

        } catch (err) {
          errorList.push({
            row: i + 2,
            error: err.message || 'Failed to add member',
            data: {
              name: String(row[nameIndex] || '').trim(),
              email: String(row[emailIndex] || '').trim(),
              phone: phoneIndex !== -1 ? String(row[phoneIndex] || '').trim() : ''
            }
          });
        }
      }

      setResults({
        total: totalRows,
        success: successList.length,
        errors: errorList.length,
        successList,
        errorList
      });

    } catch (err) {
      console.error('Error processing Excel file:', err);
      setError(err.message || 'Failed to process Excel file. Please check the file format.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const findColumnIndex = (headers, possibleNames) => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name));
      if (index !== -1) return index;
    }
    return -1;
  };

  const handleReset = () => {
    setResults(null);
    setError('');
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      handleReset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="heading-3">Upload Members from Excel</h2>
          <button
            className="icon-btn"
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Close modal"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="modal-body">
          {!results ? (
            <div className="upload-form">
              <div className="upload-actions">
                <MotionButton
                  className="btn btn-ghost"
                  onClick={downloadTemplate}
                  disabled={isUploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiDownload size={18} />
                  Download Template
                </MotionButton>
                <div className="upload-button-wrapper">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                    id="excel-upload-input"
                  />
                  <MotionButton
                    as="label"
                    htmlFor="excel-upload-input"
                    className="btn btn-primary"
                    style={{ cursor: 'pointer', width: '100%' }}
                    disabled={isUploading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiUpload size={18} />
                    {isUploading ? 'Processing...' : 'Upload Excel File'}
                  </MotionButton>
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <FiAlertCircle size={18} />
                  {error}
                </div>
              )}

              {isUploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>
                    Processing {progress.current} of {progress.total} members...
                  </p>
                </div>
              )}

              <div className="upload-instructions">
                <p style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                  Instructions:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                  <li>Download the template to see the required format</li>
                  <li>Required columns: <strong>Name</strong>, <strong>Email</strong>, <strong>Password</strong></li>
                  <li>Optional column: <strong>Phone</strong></li>
                  <li>Column names are case-insensitive</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="upload-results">
              <h3 className="heading-3" style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                Upload Complete!
              </h3>

              <div className="results-stats">
                <div className="stat-item stat-success">
                  <span className="stat-number">{results.success}</span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat-item stat-error">
                  <span className="stat-number">{results.errors}</span>
                  <span className="stat-label">Errors</span>
                </div>
                <div className="stat-item stat-total">
                  <span className="stat-number">{results.total}</span>
                  <span className="stat-label">Total</span>
                </div>
              </div>

              {results.errorList.length > 0 && (
                <div className="error-details">
                  <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-error)', marginBottom: 'var(--spacing-sm)' }}>
                    Errors ({results.errorList.length}):
                  </h4>
                  <div className="error-list">
                    {results.errorList.slice(0, 5).map((error, idx) => (
                      <div key={idx} className="error-item">
                        <strong>Row {error.row}:</strong> {error.error}
                      </div>
                    ))}
                    {results.errorList.length > 5 && (
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                        ... and {results.errorList.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-footer-actions">
                <MotionButton
                  className="btn btn-ghost"
                  onClick={handleReset}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Upload Another File
                </MotionButton>
                <MotionButton
                  className="btn btn-primary"
                  onClick={handleClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </MotionButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadModal;
