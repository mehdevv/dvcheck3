import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import './ExcelUploadModal.css';

const ExcelUploadModal = ({ isOpen, onClose }) => {
  const { addMember } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      ['Name', 'Email', 'Password', 'Phone'],
      ['John Doe', 'john@example.com', 'password123', '123-456-7890'],
      ['Jane Smith', 'jane@example.com', 'securepass', '987-654-3210'],
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Name
      { wch: 30 }, // Email
      { wch: 20 }, // Password
      { wch: 15 }, // Phone
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    
    // Download file
    XLSX.writeFile(wb, 'members_template.xlsx');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
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
      // Read the file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: ''
      });

      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      // Parse headers (first row)
      const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
      
      // Find column indices
      const nameIndex = findColumnIndex(headers, ['name', 'full name', 'member name']);
      const emailIndex = findColumnIndex(headers, ['email', 'e-mail', 'email address']);
      const passwordIndex = findColumnIndex(headers, ['password', 'pwd', 'pass']);
      const phoneIndex = findColumnIndex(headers, ['phone', 'phone number', 'mobile', 'tel']);

      if (nameIndex === -1 || emailIndex === -1 || passwordIndex === -1) {
        throw new Error('Excel file must contain columns: Name, Email, and Password');
      }

      // Process data rows
      const dataRows = jsonData.slice(1);
      const totalRows = dataRows.length;
      setProgress({ current: 0, total: totalRows });

      const successList = [];
      const errorList = [];

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        try {
          const name = String(row[nameIndex] || '').trim();
          const email = String(row[emailIndex] || '').trim();
          const password = String(row[passwordIndex] || '').trim();
          const phone = phoneIndex !== -1 ? String(row[phoneIndex] || '').trim() : '';

          // Validate required fields
          if (!name || !email || !password) {
            errorList.push({
              row: i + 2,
              error: 'Missing required fields (Name, Email, or Password)',
              data: { name, email, phone }
            });
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            errorList.push({
              row: i + 2,
              error: 'Invalid email format',
              data: { name, email, phone }
            });
            continue;
          }

          // Add member
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
          <h2>Upload Members from Excel</h2>
          <button className="modal-close" onClick={handleClose} disabled={isUploading}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {!results ? (
            <>
              <div className="modal-actions">
                <button
                  onClick={downloadTemplate}
                  className="template-button"
                  disabled={isUploading}
                >
                  📥 Download Template
                </button>
                <div className="upload-button-wrapper">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="file-input"
                    id="excel-upload-input"
                  />
                  <label htmlFor="excel-upload-input" className="upload-button">
                    {isUploading ? 'Processing...' : '📁 Upload Excel File'}
                  </label>
                </div>
              </div>

              {error && (
                <div className="upload-error">
                  ⚠️ {error}
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
                  <p>Processing {progress.current} of {progress.total} members...</p>
                </div>
              )}

              <div className="upload-instructions">
                <p><strong>Instructions:</strong></p>
                <ul>
                  <li>Download the template to see the required format</li>
                  <li>Required columns: <strong>Name</strong>, <strong>Email</strong>, <strong>Password</strong></li>
                  <li>Optional column: <strong>Phone</strong></li>
                  <li>Column names are case-insensitive</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="upload-results">
              <div className="results-header">
                <h3>Upload Complete!</h3>
              </div>
              <div className="results-stats">
                <div className="stat-item success">
                  <span className="stat-number">{results.success}</span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat-item error">
                  <span className="stat-number">{results.errors}</span>
                  <span className="stat-label">Errors</span>
                </div>
                <div className="stat-item total">
                  <span className="stat-number">{results.total}</span>
                  <span className="stat-label">Total</span>
                </div>
              </div>

              {results.errorList.length > 0 && (
                <div className="error-details">
                  <h4>Errors ({results.errorList.length}):</h4>
                  <div className="error-list">
                    {results.errorList.slice(0, 5).map((error, idx) => (
                      <div key={idx} className="error-item">
                        <strong>Row {error.row}:</strong> {error.error}
                      </div>
                    ))}
                    {results.errorList.length > 5 && (
                      <p className="more-errors">... and {results.errorList.length - 5} more errors</p>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-footer-actions">
                <button onClick={handleReset} className="upload-again-button">
                  Upload Another File
                </button>
                <button onClick={handleClose} className="close-button">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadModal;

