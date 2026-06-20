import React, { useEffect, useState } from 'react';
import { 
  IndianRupee, 
  Users, 
  Calendar, 
  Search, 
  Check, 
  X, 
  BadgeAlert,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { translations } from '../utils/i18n';
import type { Language } from '../utils/i18n';

interface AdminDashboardProps {
  token: string;
  lang: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, lang }) => {
  const t = translations[lang];

  // Active Admin View states
  const [activeTab, setActiveTab] = useState<'bookings' | 'users' | 'trips'>('bookings');
  
  // Data lists
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Modals for Trips
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTripId, setEditingTripId] = useState('');

  // Trip Form inputs
  const [tripTitle, setTripTitle] = useState('');
  const [tripDest, setTripDest] = useState('');
  const [tripPrice, setTripPrice] = useState(8999);
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [tripBusType, setTripBusType] = useState('AC Volvo Luxury Bus');
  const [tripTotalSeats, setTripTotalSeats] = useState(65);
  const [tripDescEn, setTripDescEn] = useState('');
  const [tripDescHi, setTripDescHi] = useState('');
  const [tripStatus, setTripStatus] = useState('upcoming');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Bookings
      const bkgRes = await fetch('/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bkgData = await bkgRes.json();
      if (!bkgRes.ok) throw new Error(bkgData.error || 'Failed to fetch bookings.');
      setBookings(bkgData);

      // Users
      const usrRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usrData = await usrRes.json();
      if (!usrRes.ok) throw new Error(usrData.error || 'Failed to fetch users.');
      setUsers(usrData);

      // Trips
      const trpRes = await fetch('/api/trips');
      const trpData = await trpRes.json();
      if (!trpRes.ok) throw new Error(trpData.error || 'Failed to fetch trips.');
      setTrips(trpData);

    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Booking updates
  const handleUpdateStatus = async (bookingId: string, updates: { status?: string; paymentStatus?: string }) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update booking.');

      setSuccess(`Booking updated successfully.`);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updates } : b));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating booking.');
    }
  };

  // Add Trip
  const handleAddTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: tripTitle,
          destination: tripDest,
          price: Number(tripPrice),
          startDate: tripStartDate,
          endDate: tripEndDate,
          busType: tripBusType,
          totalSeats: Number(tripTotalSeats),
          description: tripDescEn,
          descriptionHi: tripDescHi
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add trip.');

      setSuccess('Trip route added successfully!');
      setShowAddModal(false);
      
      // Reset inputs
      setTripTitle('');
      setTripDest('');
      setTripPrice(8999);
      setTripStartDate('');
      setTripEndDate('');
      setTripDescEn('');
      setTripDescHi('');
      
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Edit Trip Fill
  const openEditTripModal = (trip: any) => {
    setEditingTripId(trip.id);
    setTripTitle(trip.title);
    setTripDest(trip.destination);
    setTripPrice(trip.price);
    setTripStartDate(trip.startDate);
    setTripEndDate(trip.endDate);
    setTripBusType(trip.busType);
    setTripTotalSeats(trip.totalSeats);
    setTripDescEn(trip.description);
    setTripDescHi(trip.descriptionHi);
    setTripStatus(trip.status);
    setShowEditModal(true);
  };

  // Edit Trip Submit
  const handleEditTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/trips/${editingTripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: tripTitle,
          destination: tripDest,
          price: Number(tripPrice),
          startDate: tripStartDate,
          endDate: tripEndDate,
          busType: tripBusType,
          totalSeats: Number(tripTotalSeats),
          description: tripDescEn,
          descriptionHi: tripDescHi,
          status: tripStatus
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update trip.');

      setSuccess('Trip route updated successfully!');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm(t.btnDeleteTripConfirm)) return;
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/trips/${tripId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete trip.');
      }

      setSuccess('Trip route deleted.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Stats
  const stats = {
    totalBookings: bookings.length,
    totalPassengers: bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + b.passengers : sum, 0),
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    totalRevenue: bookings.reduce((sum, b) => (b.status !== 'cancelled' && b.paymentStatus === 'paid') ? sum + b.totalPrice : sum, 0),
    projectedRevenue: bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + b.totalPrice : sum, 0),
  };

  // Partition Bookings
  const upcomingBookings = bookings.filter(b => b.trip && b.trip.status !== 'completed');
  const completedBookings = bookings.filter(b => b.trip && b.trip.status === 'completed');

  // Filters application
  const filterList = (list: any[]) => {
    return list.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            b.phone.includes(searchQuery) ||
                            b.id.includes(searchQuery) ||
                            (b.customerUsername && b.customerUsername.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || b.paymentStatus === paymentFilter;
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  };

  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.phone.includes(searchQuery) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'badge-pending';
      case 'confirmed': return 'badge-confirmed';
      case 'cancelled': return 'badge-cancelled';
      case 'completed': return 'badge-completed';
      default: return '';
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '5px' }}>{t.adminDashboardTitle}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{t.adminDashboardSub}</p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }} onClick={fetchData}>
          {t.refreshBtn}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={20} /></div>
          <div className="stat-info">
            <h3>{t.totalBookingsCount}</h3>
            <div className="stat-number">{stats.totalBookings}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(56,142,60,0.1)', color: 'var(--success)' }}>
            <Users size={20} />
          </div>
          <div className="stat-info">
            <h3>{t.totalSeatsBooked}</h3>
            <div className="stat-number">{stats.totalPassengers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(211,47,47,0.1)', color: 'var(--danger)' }}>
            <BadgeAlert size={20} />
          </div>
          <div className="stat-info">
            <h3>{t.pendingConfirmation}</h3>
            <div className="stat-number">{stats.pendingBookings}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(251,192,45,0.15)', color: '#f57f17' }}>
            <IndianRupee size={20} />
          </div>
          <div className="stat-info">
            <h3>{t.collectedCash}</h3>
            <div className="stat-number">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="admin-tabs">
        <div 
          className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => { setActiveTab('bookings'); setSearchQuery(''); }}
        >
          {t.tabBookings} ({bookings.length})
        </div>
        <div 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
        >
          {t.tabCustomers} ({users.filter(u => u.role !== 'admin').length})
        </div>
        <div 
          className={`admin-tab ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => { setActiveTab('trips'); setSearchQuery(''); }}
        >
          {t.tabManageTrips} ({trips.length})
        </div>
      </div>

      {/* FILTERS BAR */}
      {activeTab !== 'trips' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder={activeTab === 'bookings' ? t.searchPlaceholderBookings : t.searchPlaceholderCustomers}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
          </div>

          {activeTab === 'bookings' && (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '160px', padding: '8px 12px' }}>
                <option value="all">{t.filterAllStatus}</option>
                <option value="pending">{t.statusPending}</option>
                <option value="confirmed">{t.statusConfirmed}</option>
                <option value="cancelled">{t.statusCancelled}</option>
                <option value="completed">{t.statusCompleted}</option>
              </select>

              <select className="form-control" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={{ width: '160px', padding: '8px 12px' }}>
                <option value="all">{t.filterAllPayment}</option>
                <option value="paid">{lang === 'en' ? 'Paid' : 'भुगतान सफल'}</option>
                <option value="unpaid">{lang === 'en' ? 'Unpaid' : 'कैश पेंडिंग'}</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{lang === 'en' ? 'Loading panel...' : 'विवरण लोड हो रहा है...'}</p>
        </div>
      ) : activeTab === 'bookings' ? (
        
        // BOOKINGS TAB (Upcoming & Completed partitions)
        <div>
          {/* 1. UPCOMING TOURS BOOKINGS */}
          <h3 className="booking-history-title" style={{ marginTop: '20px' }}>
            {lang === 'en' ? 'Upcoming Tours Bookings' : 'आगामी यात्रा बुकिंग्स'}
          </h3>
          {filterList(upcomingBookings).length === 0 ? (
            <p style={{ padding: '15px', color: 'var(--text-muted)' }}>{t.emptyBookings}</p>
          ) : (
            <div className="table-responsive" style={{ marginBottom: '40px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t.tableBookingId}</th>
                    <th>{t.tableCustomer}</th>
                    <th>{t.tableTripDate}</th>
                    <th>{t.tablePickup}</th>
                    <th>{t.tableSeats}</th>
                    <th>{t.tableFood}</th>
                    <th>{t.tableTotalCost}</th>
                    <th>{t.tableStatus}</th>
                    <th>{t.tablePayment}</th>
                    <th>{t.tableActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(upcomingBookings).map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{b.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{b.customerUsername} | {b.phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{b.trip ? b.trip.destination : ''}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.trip ? b.trip.startDate : ''}</div>
                      </td>
                      <td>
                        <div>{b.pickupCity}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.pickupAddress}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-hover)' }}>
                        {b.seats ? b.seats.join(', ') : b.passengers}
                      </td>
                      <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{b.foodChoice}</td>
                      <td style={{ fontWeight: 700 }}>₹{b.totalPrice.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                          {b.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {b.status === 'pending' && (
                            <>
                              <button className="btn-action btn-action-confirm" onClick={() => handleUpdateStatus(b.id, { status: 'confirmed' })}>
                                <Check size={12} /> Confirm
                              </button>
                              <button className="btn-action btn-action-cancel" onClick={() => handleUpdateStatus(b.id, { status: 'cancelled' })}>
                                <X size={12} /> Cancel
                              </button>
                            </>
                          )}
                          {b.paymentStatus === 'unpaid' && b.status !== 'cancelled' && (
                            <button className="btn-action btn-action-paid" onClick={() => handleUpdateStatus(b.id, { paymentStatus: 'paid' })}>
                              Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. COMPLETED TOURS BOOKINGS */}
          <h3 className="booking-history-title">
            {lang === 'en' ? 'Completed Tours History bookings' : 'पूर्ण यात्रा बुकिंग्स इतिहास'}
          </h3>
          {filterList(completedBookings).length === 0 ? (
            <p style={{ padding: '15px', color: 'var(--text-muted)' }}>{t.emptyBookings}</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t.tableBookingId}</th>
                    <th>{t.tableCustomer}</th>
                    <th>{t.tableTripDate}</th>
                    <th>{t.tablePickup}</th>
                    <th>{t.tableSeats}</th>
                    <th>{t.tableFood}</th>
                    <th>{t.tableTotalCost}</th>
                    <th>{t.tableStatus}</th>
                    <th>{t.tablePayment}</th>
                  </tr>
                </thead>
                <tbody>
                  {filterList(completedBookings).map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'monospace' }}>{b.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{b.customerUsername} | {b.phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{b.trip ? b.trip.destination : ''}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.trip ? b.trip.startDate : ''}</div>
                      </td>
                      <td>
                        <div>{b.pickupCity}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.pickupAddress}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {b.seats ? b.seats.join(', ') : b.passengers}
                      </td>
                      <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{b.foodChoice}</td>
                      <td style={{ fontWeight: 700 }}>₹{b.totalPrice.toLocaleString('en-IN')}</td>
                      <td>
                        <span className="badge badge-completed">Completed</span>
                      </td>
                      <td>
                        <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                          {b.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      ) : activeTab === 'users' ? (
        
        // CUSTOMERS LIST TAB
        filteredUsers.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>{t.emptyCustomers}</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Mobile Number</th>
                  <th>Default Pickup Address</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.filter(u => u.role !== 'admin').map(u => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>@{u.username}</td>
                    <td>{u.phone}</td>
                    <td>{u.address}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      ) : (
        
        // MANAGE TOURS (TRIPS) TAB
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--primary)' }}>{t.manageTripsHeader}</h3>
            <button 
              className="btn-primary" 
              style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => {
                // reset form
                setTripTitle('');
                setTripDest('');
                setTripPrice(8999);
                setTripStartDate('');
                setTripEndDate('');
                setTripBusType('AC Volvo Luxury Bus');
                setTripTotalSeats(65);
                setTripDescEn('');
                setTripDescHi('');
                setShowAddModal(true);
              }}
            >
              <Plus size={14} /> {t.addTripBtn}
            </button>
          </div>

          {trips.length === 0 ? (
            <p style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>{t.emptyTrips}</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Trip ID</th>
                    <th>Tour Destination</th>
                    <th>Tour Title</th>
                    <th>Departure Date</th>
                    <th>Bus Details</th>
                    <th>Rate per Seat</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map(trip => (
                    <tr key={trip.id}>
                      <td style={{ fontFamily: 'monospace' }}>{trip.id}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-hover)' }}>{trip.destination}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{trip.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lang === 'en' ? trip.description : trip.descriptionHi}
                        </div>
                      </td>
                      <td>{trip.startDate}</td>
                      <td style={{ fontSize: '12px' }}>
                        <div>{trip.busType}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Cap: {trip.totalSeats} seats</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{trip.price.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${trip.status === 'upcoming' ? 'badge-pending' : 'badge-completed'}`}>
                          {trip.status === 'upcoming' ? t.upcomingStatus : t.completedStatus}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions" style={{ justifyContent: 'center' }}>
                          <button className="btn-action" style={{ backgroundColor: 'rgba(251,192,45,0.15)', color: 'var(--primary)' }} onClick={() => openEditTripModal(trip)}>
                            <Edit size={12} /> {t.editTripBtn}
                          </button>
                          <button className="btn-action btn-action-cancel" onClick={() => handleDeleteTrip(trip.id)} title="Delete Trip Route">
                            <Trash2 size={12} /> {t.deleteTripBtn}
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
      )}

      {/* ================= ADD TRIP MODAL ================= */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t.modalAddTitle}</h3>
              <span className="modal-close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></span>
            </div>
            
            <form onSubmit={handleAddTripSubmit}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label>{t.formTripTitle}</label>
                  <input type="text" className="form-control" placeholder="E.g. Bhabua to Nepal Tour Special" value={tripTitle} onChange={(e) => setTripTitle(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t.formTripDest}</label>
                    <input type="text" className="form-control" placeholder="E.g. Nepal" value={tripDest} onChange={(e) => setTripDest(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>{t.formPriceSeat}</label>
                    <input type="number" className="form-control" min={1} value={tripPrice} onChange={(e) => setTripPrice(Number(e.target.value))} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t.formStartDate}</label>
                    <input type="date" className="form-control" value={tripStartDate} onChange={(e) => setTripStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>{t.formEndDate}</label>
                    <input type="date" className="form-control" value={tripEndDate} onChange={(e) => setTripEndDate(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t.formBusType}</label>
                    <input type="text" className="form-control" value={tripBusType} onChange={(e) => setTripBusType(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>{t.formTotalSeats}</label>
                    <input type="number" className="form-control" min={1} value={tripTotalSeats} onChange={(e) => setTripTotalSeats(Number(e.target.value))} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t.formDescEn}</label>
                  <textarea className="form-control" rows={3} placeholder="English details..." value={tripDescEn} onChange={(e) => setTripDescEn(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>{t.formDescHi}</label>
                  <textarea className="form-control" rows={3} placeholder="हिंदी में यात्रा विवरण..." value={tripDescHi} onChange={(e) => setTripDescHi(e.target.value)} required />
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>{lang === 'en' ? 'Cancel' : 'रद्द करें'}</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)' }}>{t.btnSubmitTrip}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT TRIP MODAL ================= */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t.modalEditTitle}</h3>
              <span className="modal-close-btn" onClick={() => setShowEditModal(false)}><X size={20} /></span>
            </div>
            
            <form onSubmit={handleEditTripSubmit}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label>{t.formTripTitle}</label>
                  <input type="text" className="form-control" value={tripTitle} onChange={(e) => setTripTitle(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t.formTripDest}</label>
                    <input type="text" className="form-control" value={tripDest} onChange={(e) => setTripDest(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>{t.formPriceSeat}</label>
                    <input type="number" className="form-control" min={1} value={tripPrice} onChange={(e) => setTripPrice(Number(e.target.value))} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t.formStartDate}</label>
                    <input type="date" className="form-control" value={tripStartDate} onChange={(e) => setTripStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>{t.formEndDate}</label>
                    <input type="date" className="form-control" value={tripEndDate} onChange={(e) => setTripEndDate(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>{t.formBusType}</label>
                    <input type="text" className="form-control" value={tripBusType} onChange={(e) => setTripBusType(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>{t.formTotalSeats}</label>
                    <input type="number" className="form-control" min={1} value={tripTotalSeats} onChange={(e) => setTripTotalSeats(Number(e.target.value))} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t.formDescEn}</label>
                  <textarea className="form-control" rows={3} value={tripDescEn} onChange={(e) => setTripDescEn(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>{t.formDescHi}</label>
                  <textarea className="form-control" rows={3} value={tripDescHi} onChange={(e) => setTripDescHi(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>{t.formTripStatus}</label>
                  <select className="form-control" value={tripStatus} onChange={(e) => setTripStatus(e.target.value)} required>
                    <option value="upcoming">{t.upcomingStatus}</option>
                    <option value="completed">{t.completedStatus}</option>
                  </select>
                </div>

              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>{lang === 'en' ? 'Cancel' : 'रद्द करें'}</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)' }}>{t.btnSubmitTrip}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
