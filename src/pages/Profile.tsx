import React, { useEffect, useState } from 'react';
import { User, Phone, MapPin, IndianRupee, Inbox, Info } from 'lucide-react';
import { translations } from '../utils/i18n';
import type { Language } from '../utils/i18n';

interface ProfileProps {
  user: any;
  token: string;
  setCurrentPage: (page: string) => void;
  lang: Language;
}

export const Profile: React.FC<ProfileProps> = ({ user, token, setCurrentPage, lang }) => {
  const t = translations[lang];

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileTab, setProfileTab] = useState<'upcoming' | 'history'>('upcoming');

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const response = await fetch('/api/bookings/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch bookings.');
        }

        setBookings(data);
      } catch (err: any) {
        setError(err.message || 'Error loading profile history.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [token]);

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'badge-pending';
      case 'confirmed': return 'badge-confirmed';
      case 'cancelled': return 'badge-cancelled';
      case 'completed': return 'badge-completed';
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return t.statusPending;
      case 'confirmed': return t.statusConfirmed;
      case 'completed': return t.statusCompleted;
      case 'cancelled': return t.statusCancelled;
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', options);
  };

  // Partition bookings:
  // Upcoming bookings are bookings that are active (pending/confirmed) and the associated trip is also upcoming.
  const upcomingBookings = bookings.filter(b => 
    (b.status === 'pending' || b.status === 'confirmed') && 
    (b.trip && b.trip.status !== 'completed')
  );

  // History bookings are bookings that are completed/cancelled OR the trip itself is marked completed.
  const historyBookings = bookings.filter(b => 
    b.status === 'cancelled' || 
    b.status === 'completed' || 
    (b.trip && b.trip.status === 'completed')
  );

  const activeList = profileTab === 'upcoming' ? upcomingBookings : historyBookings;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      
      {/* Profile Header Card */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="profile-info">
            <h2>{user?.name}</h2>
            <p style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
              <User size={14} /> @{user?.username}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={14} style={{ color: 'var(--accent)' }} /> <strong>{lang === 'en' ? 'Phone:' : 'फ़ोन:'}</strong> {user?.phone}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={14} style={{ color: 'var(--accent)' }} /> <strong>{lang === 'en' ? 'Address:' : 'पता:'}</strong> {user?.address}
          </div>
        </div>
      </div>

      <div className="profile-body">
        <h3 className="booking-history-title">{t.bookingHistoryTitle}</h3>

        {/* Partition Tabs */}
        <div className="admin-tabs" style={{ marginBottom: '20px' }}>
          <div 
            className={`admin-tab ${profileTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setProfileTab('upcoming')}
          >
            {lang === 'en' ? 'Upcoming Trips' : 'आगामी यात्राएं'} ({upcomingBookings.length})
          </div>
          <div 
            className={`admin-tab ${profileTab === 'history' ? 'active' : ''}`}
            onClick={() => setProfileTab('history')}
          >
            {lang === 'en' ? 'Completed & Cancelled' : 'पूर्ण एवं रद्द यात्राएं'} ({historyBookings.length})
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{lang === 'en' ? 'Loading bookings...' : 'बुकिंग्स लोड हो रही हैं...'}</p>
          </div>
        ) : activeList.length === 0 ? (
          <div className="empty-state">
            <Inbox size={48} />
            <h4 style={{ fontSize: '18px', color: 'var(--primary)', margin: '15px 0 10px' }}>{t.noBookingsFound}</h4>
            <p style={{ fontSize: '14px', marginBottom: '20px' }}>{t.noBookingsDesc}</p>
            {profileTab === 'upcoming' && (
              <button className="btn-primary" onClick={() => setCurrentPage('book')}>
                {lang === 'en' ? 'Book Tour Route' : 'यात्रा बुक करें'}
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ 
              backgroundColor: 'rgba(251,192,45,0.1)', 
              border: '1px solid var(--accent)', 
              padding: '15px', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '14px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--text-dark)'
            }}>
              <Info size={20} style={{ color: 'var(--accent-hover)', flexShrink: 0 }} />
              <div>
                <strong>{t.paymentNoteHeader}</strong> {t.paymentNoteBody}
              </div>
            </div>

            {activeList.map((booking) => (
              <div key={booking.id} className="booking-item-card">
                
                {/* Details column */}
                <div className="bkg-details">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {booking.trip ? booking.trip.title : (lang === 'en' ? 'Special Tour Package' : 'विशेष यात्रा पैकेज')}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>
                      ({t.bookingId}: {booking.id})
                    </span>
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px', fontSize: '13px' }}>
                    <div>
                      <strong>{lang === 'en' ? 'Seats Quantity:' : 'सीटों की संख्या:'}</strong> {booking.passengers}
                    </div>
                    
                    <div>
                      <strong>{t.startingDate}:</strong> {formatDate(booking.trip ? booking.trip.startDate : '')}
                    </div>
                    
                    <div>
                      <strong>{t.pickupCityLabel}:</strong> {booking.pickupCity}
                    </div>
                    
                    <div>
                      <strong>{t.foodChoiceLabel}:</strong> {booking.foodChoice === 'veg' ? t.vegOption : booking.foodChoice === 'non-veg' ? t.nonVegOption : t.bothOption}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-muted)' }}>
                    <strong>{t.selectedSeatsList}:</strong> <span style={{ color: 'var(--accent-hover)', fontWeight: 'bold' }}>{booking.seats ? booking.seats.join(', ') : ''}</span>
                  </div>

                  <div style={{ fontSize: '13px', marginTop: '5px', color: 'var(--text-muted)' }}>
                    <strong>{t.pickupAddressLabel}:</strong> {booking.pickupAddress}
                  </div>
                </div>

                {/* Price and status column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
                    <IndianRupee size={16} /> {booking.totalPrice.toLocaleString('en-IN')}
                  </div>

                  <div className="bkg-status-group">
                    <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    <span className={`badge ${booking.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                      {booking.paymentStatus === 'paid' ? t.paidSuccessful : t.unpaidCashPending}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
