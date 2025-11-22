import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  orderBy,
  onSnapshot,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import './EventsManagement.css';

const EventsManagement = () => {
  const { user, members } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const qrReaderElementId = "qr-reader";

  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
  });

  // Define handleQRCodeScanned first using useCallback
  const handleQRCodeScanned = useCallback(async (qrData, eventId) => {
    try {
      // Stop scanning temporarily to process
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.pause();
        } catch (e) {
          // Ignore pause errors - scanner might not be running or already paused
        }
      }

      // Parse QR code data
      let memberData;
      try {
        memberData = JSON.parse(qrData);
      } catch (parseError) {
        setScanError('Invalid QR code format. Please scan a valid member QR code.');
        // Resume scanning after 2 seconds
        setTimeout(() => {
          if (html5QrCodeRef.current && isScanning) {
            try {
              html5QrCodeRef.current.resume();
            } catch (e) {
              // Ignore resume errors - scanner might not be paused
            }
          }
        }, 2000);
        return;
      }
      
      if (!memberData.email || !memberData.name) {
        setScanError('QR code missing required information (name or email)');
        setTimeout(() => {
          if (html5QrCodeRef.current && isScanning) {
            try {
              html5QrCodeRef.current.resume();
            } catch (e) {
              // Ignore resume errors - scanner might not be paused
            }
          }
        }, 2000);
        return;
      }

      // Find member by email
      const member = members.find(m => m.email === memberData.email);
      if (!member) {
        setScanError(`Member "${memberData.name}" (${memberData.email}) not found in database`);
        setTimeout(() => {
          if (html5QrCodeRef.current && isScanning) {
            try {
              html5QrCodeRef.current.resume();
            } catch (e) {
              // Ignore resume errors - scanner might not be paused
            }
          }
        }, 2000);
        return;
      }

      // Get event data
      const event = events.find(e => e.id === eventId);
      if (!event) {
        setScanError('Event not found');
        setTimeout(() => {
          if (html5QrCodeRef.current && isScanning) {
            try {
              html5QrCodeRef.current.resume();
            } catch (e) {
              // Ignore resume errors - scanner might not be paused
            }
          }
        }, 2000);
        return;
      }

      // Check if member is already checked in
      const isAlreadyCheckedIn = event.attendees?.some(
        attendee => attendee.email === memberData.email || attendee.id === member.id
      );

      if (isAlreadyCheckedIn) {
        setScanError(`✓ ${memberData.name} is already checked in to this event`);
        setTimeout(() => {
          if (html5QrCodeRef.current && isScanning) {
            html5QrCodeRef.current.resume();
          }
          setScanError('');
        }, 2000);
        return;
      }

      // Add member to event attendees
      const updatedAttendees = [
        ...(event.attendees || []),
        {
          id: member.id,
          name: member.name,
          email: member.email,
          checkedInAt: new Date().toISOString(),
        }
      ];

      await updateDoc(doc(db, 'events', eventId), {
        attendees: updatedAttendees
      });

      // Success - show confirmation
      setScanError('');
      const successMessage = `✓ ${memberData.name} checked in successfully!`;
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(52, 199, 89, 0.95);
        backdrop-filter: blur(10px);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(52, 199, 89, 0.3);
        z-index: 10001;
        font-weight: 600;
        font-size: 16px;
      `;
      successDiv.textContent = successMessage;
      document.body.appendChild(successDiv);
      
      // Remove success message after 2 seconds
      setTimeout(() => {
        successDiv.remove();
      }, 2000);
      
      // Resume scanning after brief pause
      setTimeout(() => {
        if (html5QrCodeRef.current && isScanning) {
          try {
            html5QrCodeRef.current.resume();
          } catch (e) {
            // Ignore resume errors - scanner might not be paused
          }
        }
      }, 1500);
      
    } catch (err) {
      console.error('Error processing QR code:', err);
      setScanError(err.message || 'Failed to process QR code');
      
      // Resume scanning after error
      setTimeout(() => {
        if (html5QrCodeRef.current && isScanning) {
          try {
            html5QrCodeRef.current.resume();
          } catch (e) {
            // Ignore resume errors - scanner might not be paused
          }
        }
      }, 2000);
    }
  }, [members, events, isScanning]);

  // Load events from Firestore
  useEffect(() => {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsList = [];
      snapshot.forEach((doc) => {
        eventsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setEvents(eventsList);
    });

    return () => unsubscribe();
  }, []);

  // Initialize scanner when isScanning becomes true
  useEffect(() => {
    if (!isScanning || !selectedEvent) {
      return;
    }

    let isMounted = true;

    const initializeScanner = async () => {
      try {
        // Wait for DOM to render
        await new Promise(resolve => setTimeout(resolve, 200));

        if (!isMounted) return;

        const element = document.getElementById(qrReaderElementId);
        if (!element) {
          if (isMounted) {
            setScanError('Scanner element not found. Please try again.');
            setIsScanning(false);
          }
          return;
        }

        // Clear any existing scanner
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch (e) {
            // Ignore errors when stopping - scanner might not be running
          }
          try {
            html5QrCodeRef.current.clear();
          } catch (e) {
            // Ignore clear errors
          }
        }

        const html5QrCode = new Html5Qrcode(qrReaderElementId);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText, decodedResult) => {
            if (isMounted) {
              handleQRCodeScanned(decodedText, selectedEvent);
            }
          },
          (errorMessage) => {
            // Ignore scanning errors
          }
        );
      } catch (err) {
        console.error('Error starting scanner:', err);
        if (isMounted) {
          setScanError(err.message || 'Failed to start camera. Please check permissions.');
          setIsScanning(false);
        }
      }
    };

    initializeScanner();

    // Cleanup function
    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        // Handle paused scanner: resume first, then stop
        const cleanup = async () => {
          try {
            // If scanner is paused, resume it first
            try {
              await html5QrCodeRef.current.resume();
            } catch (e) {
              // Not paused, continue
            }
            
            // Now stop the scanner
            await html5QrCodeRef.current.stop();
          } catch (e) {
            // Scanner might already be stopped, that's okay
          }
          
          // Always clear
          try {
            html5QrCodeRef.current.clear();
          } catch (e) {
            // Ignore clear errors
          }
          
          html5QrCodeRef.current = null;
        };
        
        cleanup();
      }
    };
  }, [isScanning, selectedEvent, handleQRCodeScanned]);

  const handleInputChange = (e) => {
    setEventFormData({
      ...eventFormData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!eventFormData.name || !eventFormData.date) {
      setError('Event name and date are required');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        name: eventFormData.name,
        description: eventFormData.description || '',
        date: eventFormData.date,
        location: eventFormData.location || '',
        attendees: [],
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'admin',
      };

      await addDoc(collection(db, 'events'), eventData);
      setEventFormData({ name: '', description: '', date: '', location: '' });
      setShowAddEventForm(false);
    } catch (err) {
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = (eventId) => {
    setSelectedEvent(eventId);
    setIsScanning(true);
    setScanError('');
    // Scanner will be initialized by useEffect when isScanning becomes true
  };

  const stopScanning = () => {
    if (html5QrCodeRef.current) {
      // Handle paused scanner: resume first, then stop
      const cleanup = async () => {
        try {
          // If scanner is paused, resume it first
          try {
            await html5QrCodeRef.current.resume();
          } catch (e) {
            // Not paused, continue
          }
          
          // Now stop the scanner
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // Scanner might already be stopped, that's okay
        }
        
        // Always clear
        try {
          html5QrCodeRef.current.clear();
        } catch (e) {
          // Ignore clear errors
        }
        
        html5QrCodeRef.current = null;
      };
      
      cleanup();
    }
    setIsScanning(false);
    setSelectedEvent(null);
    setScanError('');
  };

  const removeAttendee = async (eventId, attendeeEmail) => {
    if (!window.confirm('Remove this attendee from the event?')) return;

    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const updatedAttendees = event.attendees?.filter(
        attendee => attendee.email !== attendeeEmail
      ) || [];

      await updateDoc(doc(db, 'events', eventId), {
        attendees: updatedAttendees
      });
    } catch (err) {
      setError(err.message || 'Failed to remove attendee');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    }
  };

  return (
    <div className="events-container">
      <div className="events-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="back-button"
          >
            ← Back
          </button>
          <h1>Events Management</h1>
        </div>
        <button
          onClick={() => setShowAddEventForm(!showAddEventForm)}
          className="add-event-button"
        >
          {showAddEventForm ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      <div className="events-content">
        {error && (
          <div className="error-message">{error}</div>
        )}

        {showAddEventForm && (
          <div className="add-event-form">
            <h2>Create New Event</h2>
            <form onSubmit={handleAddEvent}>
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  name="name"
                  value={eventFormData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter event name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={eventFormData.description}
                  onChange={handleInputChange}
                  placeholder="Enter event description (optional)"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={eventFormData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={eventFormData.location}
                    onChange={handleInputChange}
                    placeholder="Event location (optional)"
                  />
                </div>
              </div>
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
        )}

        {isScanning && (
          <div className="scanner-modal">
            <div className="scanner-content">
              <div className="scanner-header">
                <h2>Scan QR Code</h2>
                <button onClick={stopScanning} className="close-scanner">×</button>
              </div>
              <div id="qr-reader" className="qr-reader"></div>
              {scanError && (
                <div className="scan-error">{scanError}</div>
              )}
              <p className="scan-instructions">
                Point your camera at the member's QR code
              </p>
              <button 
                onClick={stopScanning} 
                className="stop-scanning-button"
              >
                Stop Scanning
              </button>
            </div>
          </div>
        )}

        <div className="events-list">
          <h2>All Events ({events.length})</h2>
          {events.length === 0 ? (
            <p className="empty-message">No events created yet.</p>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.name}</h3>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="delete-event-button"
                    >
                      Delete
                    </button>
                  </div>
                  
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}
                  
                  <div className="event-details">
                    <div className="event-detail-item">
                      <span className="detail-label">📅 Date:</span>
                      <span className="detail-value">
                        {new Date(event.date).toLocaleString()}
                      </span>
                    </div>
                    {event.location && (
                      <div className="event-detail-item">
                        <span className="detail-label">📍 Location:</span>
                        <span className="detail-value">{event.location}</span>
                      </div>
                    )}
                    <div className="event-detail-item">
                      <span className="detail-label">👥 Attendees:</span>
                      <span className="detail-value">
                        {event.attendees?.length || 0}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => startScanning(event.id)}
                    className="scan-button"
                    disabled={isScanning}
                  >
                    📷 Scan QR Code
                  </button>

                  {event.attendees && event.attendees.length > 0 && (
                    <div className="attendees-list">
                      <h4>Attendees ({event.attendees.length})</h4>
                      <div className="attendees-items">
                        {event.attendees.map((attendee, idx) => (
                          <div key={idx} className="attendee-item">
                            <div className="attendee-info">
                              <span className="attendee-name">{attendee.name}</span>
                              <span className="attendee-email">{attendee.email}</span>
                              <span className="attendee-time">
                                {new Date(attendee.checkedInAt).toLocaleString()}
                              </span>
                            </div>
                            <button
                              onClick={() => removeAttendee(event.id, attendee.email)}
                              className="remove-attendee-button"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsManagement;

