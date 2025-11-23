import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiPlus, FiTrash2, FiCamera, FiX, FiCalendar, FiMapPin, FiUsers, FiAlertCircle, FiCheckCircle, FiEye, FiSearch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import './EventsManagement.css';

const MotionDiv = motion.div;
const MotionButton = motion.button;

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
  const [showAttendees, setShowAttendees] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const html5QrCodeRef = useRef(null);
  const qrReaderElementId = "qr-reader";

  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
  });

  const handleQRCodeScanned = useCallback(async (qrData, eventId) => {
    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.pause();
        } catch (e) {
          // Ignore pause errors
        }
      }

      let memberData;
      try {
        memberData = JSON.parse(qrData);
      } catch (parseError) {
        setScanError('Invalid QR code format. Please scan a valid member QR code.');
        setTimeout(() => {
          if (html5QrCodeRef.current && isScanning) {
            try {
              html5QrCodeRef.current.resume();
            } catch (e) {
              // Ignore resume errors
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
              // Ignore resume errors
            }
          }
        }, 2000);
        return;
      }

      const member = members.find(m => m.email === memberData.email);
      if (!member) {
        setScanError(`Member "${memberData.name}" (${memberData.email}) not found in database`);
        setTimeout(() => {
          if (html5QrCodeRef.current && isScanning) {
            try {
              html5QrCodeRef.current.resume();
            } catch (e) {
              // Ignore resume errors
            }
          }
        }, 2000);
        return;
      }

      const event = events.find(e => e.id === eventId);
      if (!event) {
        setScanError('Event not found');
        setTimeout(() => {
          if (html5QrCodeRef.current && isScanning) {
            try {
              html5QrCodeRef.current.resume();
            } catch (e) {
              // Ignore resume errors
            }
          }
        }, 2000);
        return;
      }

      const isAlreadyCheckedIn = event.attendees?.some(
        attendee => attendee.email === memberData.email || attendee.id === member.id
      );

      if (isAlreadyCheckedIn) {
        setScanError(`✓ ${memberData.name} is already checked in to this event`);
        setTimeout(() => {
          if (html5QrCodeRef.current && isScanning) {
            try {
              html5QrCodeRef.current.resume();
            } catch (e) {
              // Ignore resume errors
            }
          }
          setScanError('');
        }, 2000);
        return;
      }

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

      setScanError('');
      const successMessage = `✓ ${memberData.name} checked in successfully!`;
      
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
      
      setTimeout(() => {
        successDiv.remove();
      }, 2000);
      
      setTimeout(() => {
        if (html5QrCodeRef.current && isScanning) {
          try {
            html5QrCodeRef.current.resume();
          } catch (e) {
            // Ignore resume errors
          }
        }
      }, 1500);
      
    } catch (err) {
      console.error('Error processing QR code:', err);
      setScanError(err.message || 'Failed to process QR code');
      
      setTimeout(() => {
        if (html5QrCodeRef.current && isScanning) {
          try {
            html5QrCodeRef.current.resume();
          } catch (e) {
            // Ignore resume errors
          }
        }
      }, 2000);
    }
  }, [members, events, isScanning]);

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

  useEffect(() => {
    if (!isScanning || !selectedEvent) {
      return;
    }

    let isMounted = true;

    const initializeScanner = async () => {
      try {
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

        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch (e) {
            // Ignore errors when stopping
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

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        const cleanup = async () => {
          try {
            try {
              await html5QrCodeRef.current.resume();
            } catch (e) {
              // Not paused, continue
            }
            
            await html5QrCodeRef.current.stop();
          } catch (e) {
            // Scanner might already be stopped
          }
          
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
  };

  const stopScanning = () => {
    if (html5QrCodeRef.current) {
      const cleanup = async () => {
        try {
          try {
            await html5QrCodeRef.current.resume();
          } catch (e) {
            // Not paused, continue
          }
          
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // Scanner might already be stopped
        }
        
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
    <div className="events-page">
      {/* Header */}
      <header className="events-header">
        <div className="events-header-content">
          <div className="events-header-left">
            <button
              className="events-back-btn"
              onClick={() => navigate('/admin/dashboard')}
              aria-label="Back to Dashboard"
            >
              <FiArrowLeft size={18} />
              <span className="btn-text">Back</span>
            </button>
            <div className="events-header-title-wrapper">
              <img 
                src="/DVscan.png" 
                alt="DVcheck Logo" 
                className="events-header-logo"
              />
              <h1 className="events-header-title">Events Management</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="events-container">
        <div className="events-content">
          {error && (
            <div className="events-alert events-alert-error">
              <FiAlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Add Event Form */}
          <AnimatePresence>
            {showAddEventForm && (
              <MotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="events-card"
              >
                <h2 className="events-card-title">Create New Event</h2>
                <form onSubmit={handleAddEvent}>
                  <div className="events-form-group">
                    <label className="events-form-label">Event Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="events-form-input"
                      value={eventFormData.name}
                      onChange={handleInputChange}
                      placeholder="Enter event name"
                      required
                    />
                  </div>

                  <div className="events-form-group">
                    <label className="events-form-label">Description</label>
                    <textarea
                      name="description"
                      className="events-form-textarea"
                      value={eventFormData.description}
                      onChange={handleInputChange}
                      placeholder="Enter event description (optional)"
                      rows={3}
                    />
                  </div>

                  <div className="events-form-grid">
                    <div className="events-form-group">
                      <label className="events-form-label">Date *</label>
                      <input
                        type="datetime-local"
                        name="date"
                        className="events-form-input"
                        value={eventFormData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="events-form-group">
                      <label className="events-form-label">Location</label>
                      <input
                        type="text"
                        name="location"
                        className="events-form-input"
                        value={eventFormData.location}
                        onChange={handleInputChange}
                        placeholder="Event location (optional)"
                      />
                    </div>
                  </div>

                  <MotionButton
                    type="submit"
                    className="events-form-btn events-form-btn-primary"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                  </MotionButton>
                </form>
              </MotionDiv>
            )}
          </AnimatePresence>

          {/* Events List */}
          <div>
            <div className="events-section-header">
              <div className="events-section-title-wrapper">
                <h2 className="events-section-title">All Events</h2>
                <span className="events-badge">{events.length}</span>
              </div>
              <MotionButton
                className="events-create-btn"
                onClick={() => setShowAddEventForm(!showAddEventForm)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiPlus size={18} />
                <span className="btn-text">{showAddEventForm ? 'Cancel' : 'Create Event'}</span>
              </MotionButton>
            </div>

            {/* Search Bar */}
            {events.length > 0 && (
              <div className="events-search-container">
                <div className="events-search-wrapper">
                  <FiSearch size={18} className="events-search-icon" />
                  <input
                    type="text"
                    className="events-search-input"
                    placeholder="Search events by name, location, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}

            {events.length === 0 ? (
              <div className="events-card">
                <div className="events-empty-state">
                  <FiCalendar size={48} className="events-empty-state-icon" />
                  <p className="events-empty-state-text">No events created yet.</p>
                </div>
              </div>
            ) : (() => {
              const filteredEvents = events.filter(event => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                return (
                  event.name?.toLowerCase().includes(query) ||
                  event.location?.toLowerCase().includes(query) ||
                  event.description?.toLowerCase().includes(query)
                );
              });

              return filteredEvents.length === 0 ? (
                <div className="events-card">
                  <div className="events-empty-state">
                    <FiSearch size={48} className="events-empty-state-icon" />
                    <p className="events-empty-state-text">No events found matching your search.</p>
                  </div>
                </div>
              ) : (
                <div className="events-grid">
                  {filteredEvents.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <h3 className="event-title">{event.name}</h3>
                      <button
                        className="event-delete-btn"
                        onClick={() => deleteEvent(event.id)}
                        aria-label="Delete event"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>

                    {event.description && (
                      <p className="event-description">
                        {event.description}
                      </p>
                    )}

                    <div className="event-details">
                      <div className="event-detail-item">
                        <div className="event-detail-label">
                          <FiCalendar size={16} />
                          <span>Date</span>
                        </div>
                        <span className="event-detail-value">
                          {new Date(event.date).toLocaleString()}
                        </span>
                      </div>
                      {event.location && (
                        <div className="event-detail-item">
                          <div className="event-detail-label">
                            <FiMapPin size={16} />
                            <span>Location</span>
                          </div>
                          <span className="event-detail-value">
                            {event.location}
                          </span>
                        </div>
                      )}
                      <div className="event-detail-item">
                        <div className="event-detail-label">
                          <FiUsers size={16} />
                          <span>Attendees</span>
                        </div>
                        <span className="events-badge">{event.attendees?.length || 0}</span>
                      </div>
                    </div>

                    <div className="event-actions">
                      <MotionButton
                        className="event-scan-btn"
                        onClick={() => startScanning(event.id)}
                        disabled={isScanning}
                        whileHover={{ scale: isScanning ? 1 : 1.02 }}
                        whileTap={{ scale: isScanning ? 1 : 0.98 }}
                      >
                        <FiCamera size={18} />
                        Scan QR Code
                      </MotionButton>

                      {event.attendees && event.attendees.length > 0 && (
                        <MotionButton
                          className="event-view-attendees-btn"
                          onClick={() => setShowAttendees(event.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FiEye size={18} />
                          View Attendees ({event.attendees.length})
                        </MotionButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Scanner Modal */}
      {isScanning && (
        <div className="modal-overlay" onClick={stopScanning}>
          <div className="modal-content events-scanner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="events-modal-header">
              <h2 className="events-modal-title">Scan QR Code</h2>
              <button
                className="events-modal-close-btn"
                onClick={stopScanning}
                aria-label="Close scanner"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="events-modal-body">
              <div id="qr-reader" className="events-qr-reader" />
              {scanError && (
                <div className={`events-alert ${scanError.includes('✓') ? 'events-alert-success' : 'events-alert-error'}`}>
                  {scanError.includes('✓') ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                  {scanError}
                </div>
              )}
              <p className="events-scan-hint">
                Point your camera at the member's QR code
              </p>
              <MotionButton
                className="events-stop-btn"
                onClick={stopScanning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Stop Scanning
              </MotionButton>
            </div>
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {showAttendees && (() => {
        const event = events.find(e => e.id === showAttendees);
        if (!event || !event.attendees || event.attendees.length === 0) return null;
        
        return (
          <div className="modal-overlay" onClick={() => setShowAttendees(null)}>
            <div className="modal-content events-attendees-modal" onClick={(e) => e.stopPropagation()}>
              <div className="events-modal-header">
                <h2 className="events-modal-title">
                  Attendees - {event.name}
                </h2>
                <button
                  className="events-modal-close-btn"
                  onClick={() => setShowAttendees(null)}
                  aria-label="Close attendees"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="events-modal-body">
                <div className="attendees-section">
                  <div className="attendees-list">
                    {event.attendees.map((attendee, idx) => (
                      <div key={idx} className="attendee-item">
                        <div className="attendee-info">
                          <span className="attendee-name">
                            {attendee.name}
                          </span>
                          <span className="attendee-email">
                            {attendee.email}
                          </span>
                          <span className="attendee-time">
                            Checked in: {new Date(attendee.checkedInAt).toLocaleString()}
                          </span>
                        </div>
                        <button
                          className="attendee-remove-btn"
                          onClick={() => {
                            removeAttendee(event.id, attendee.email);
                            if (event.attendees.length === 1) {
                              setShowAttendees(null);
                            }
                          }}
                          aria-label="Remove attendee"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default EventsManagement;
