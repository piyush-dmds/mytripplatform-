import React, { useState, useEffect } from 'react';
import { CreditCard, Utensils } from 'lucide-react';
import { translations } from '../utils/i18n';
import type { Language } from '../utils/i18n';

interface BookTripProps {
  user: any;
  token: string;
  setCurrentPage: (page: string) => void;
  lang: Language;
  selectedTripId: string;
  setSelectedTripId: (tripId: string) => void;
}

export const BookTrip: React.FC<BookTripProps> = ({ 
  user, 
  token, 
  setCurrentPage, 
  lang,
  selectedTripId,
  setSelectedTripId
}) => {
  const t = translations[lang];
  const cities = ["Bhabua", "Chandauli", "Kudra", "Mohania", "Ramgarh", "Parasthua", "Kochas"];

  // API Data
  const [trips, setTrips] = useState<any[]>([]);
  const [occupiedSeatsList, setOccupiedSeatsList] = useState<number[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Form inputs
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [pickupCity, setPickupCity] = useState('Bhabua');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [foodChoice, setFoodChoice] = useState('veg');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all active trips
  useEffect(() => {
    fetch('/api/trips')
      .then(res => res.json())
      .then(data => {
        const active = data.filter((t: any) => t.status !== 'completed');
        setTrips(active);
        
        // If no trip was preselected, pick the first one
        if (!selectedTripId && active.length > 0) {
          setSelectedTripId(active[0].id);
        }
      })
      .catch(err => console.error("Error loading trips:", err))
      .finally(() => setLoadingTrips(false));
  }, [selectedTripId, setSelectedTripId]);

  // Fetch occupied seats whenever the selected trip changes
  useEffect(() => {
    if (!selectedTripId) return;
    setLoadingSeats(true);
    setSelectedSeats([]); // reset selections on trip change
    
    fetch(`/api/trips/${selectedTripId}/occupied`)
      .then(res => res.json())
      .then(data => {
        setOccupiedSeatsList(data);
      })
      .catch(err => console.error("Error loading occupied seats:", err))
      .finally(() => setLoadingSeats(false));
  }, [selectedTripId]);

  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const pricePerSeat = selectedTrip ? selectedTrip.price : 0;
  const totalPrice = selectedSeats.length * pricePerSeat;

  const handleSeatClick = (num: number) => {
    if (selectedSeats.includes(num)) {
      setSelectedSeats(prev => prev.filter(s => s !== num));
    } else {
      setSelectedSeats(prev => [...prev, num].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedSeats.length === 0) {
      setError(lang === 'en' ? 'Please select at least one seat to book.' : 'कृपया बुक करने के लिए कम से कम एक सीट चुनें।');
      return;
    }

    setSubmitting(true);

    const bookingData = {
      name,
      phone,
      pickupAddress,
      pickupCity,
      tripId: selectedTripId,
      seats: selectedSeats,
      paymentMethod
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit booking.');
      }

      setSuccess(lang === 'en' ? 'Seats booked successfully! Redirecting to profile...' : 'सीटें सफलतापूर्वक बुक हो गई हैं! प्रोफाइल पर रीडायरेक्ट किया जा रहा है...');
      
      setTimeout(() => {
        setCurrentPage('profile');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Error processing booking.');
    } finally {
      setSubmitting(false);
    }
  };

  // Grid seat rendering (Standard 65 seats: 15 rows of 4 + 1 back row of 5)
  const renderBusSeatsLayout = () => {
    const rows = [];
    const rowsCount = 15; // 15 rows * 4 = 60 seats

    const renderSeat = (num: number) => {
      const isOccupied = occupiedSeatsList.includes(num);
      const isSelected = selectedSeats.includes(num);
      return (
        <button
          key={num}
          type="button"
          className={`seat-btn ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`}
          disabled={isOccupied}
          onClick={() => handleSeatClick(num)}
          title={`Seat ${num} (${isOccupied ? t.occupiedSeatTip : isSelected ? t.selectedSeatTip : t.availableSeatTip})`}
        >
          {num}
        </button>
      );
    };

    for (let r = 0; r < rowsCount; r++) {
      const s1 = r * 4 + 1;
      const s2 = r * 4 + 2;
      const s3 = r * 4 + 3;
      const s4 = r * 4 + 4;
      rows.push(
        <div className="bus-seat-row" key={r}>
          {renderSeat(s1)}
          {renderSeat(s2)}
          <div className="seat-aisle-space">{t.aisleLabel}</div>
          {renderSeat(s3)}
          {renderSeat(s4)}
        </div>
      );
    }

    // Render back row of 5 seats (61 to 65)
    rows.push(
      <div className="bus-seat-row back-row" key={15}>
        {renderSeat(61)}
        {renderSeat(62)}
        {renderSeat(63)}
        {renderSeat(64)}
        {renderSeat(65)}
      </div>
    );

    return rows;
  };

  if (loadingTrips) {
    return (
      <div className="loading-spinner" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
        <p>{lang === 'en' ? 'Loading form configuration...' : 'बुकिंग फॉर्म कॉन्फ़िगरेशन लोड हो रहा है...'}</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 className="section-title">{t.bookingFormTitle}</h2>
        <p className="section-subtitle">{t.bookingFormSub}</p>
      </div>

      {error && <div className="alert alert-danger" style={{ maxWidth: '1100px', margin: '0 auto 20px' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ maxWidth: '1100px', margin: '0 auto 20px' }}>{success}</div>}

      <div className="booking-grid">
        
        {/* Booking Form Card */}
        <div className="booking-card">
          <h3 className="booking-card-title">{t.passengerDetailsHeader}</h3>
          
          <form onSubmit={handleSubmit}>
            {/* Trip Selector Dropdown */}
            <div className="form-group">
              <label htmlFor="ptrip">{t.activeDestinations}</label>
              <select
                id="ptrip"
                className="form-control"
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                required
              >
                {trips.map(trip => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title} (₹{trip.price.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* Passenger Name & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="pname">{t.passengerNameLabel}</label>
                <input
                  id="pname"
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="pphone">{t.mobileNumberLabel}</label>
                <input
                  id="pphone"
                  type="tel"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>

            {/* Visual Seat Grid Section */}
            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label>{t.seatsLabel}</label>
              
              <div className="seats-legend">
                <div className="legend-item">
                  <div className="legend-box available"></div>
                  <span>{t.availableSeatTip}</span>
                </div>
                <div className="legend-item">
                  <div className="legend-box selected"></div>
                  <span>{t.selectedSeatTip}</span>
                </div>
                <div className="legend-item">
                  <div className="legend-box occupied"></div>
                  <span>{t.occupiedSeatTip}</span>
                </div>
              </div>

              {loadingSeats ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto 10px' }}></div>
                  <p style={{ fontSize: '13px' }}>{lang === 'en' ? 'Fetching seat maps...' : 'सीट लेआउट लोड हो रहा है...'}</p>
                </div>
              ) : (
                <div className="bus-container">
                  <div className="bus-cabin-header">
                    <div className="driver-seat-box">{t.driverSeat}</div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>
                      {selectedTrip ? selectedTrip.busType : 'AC Volvo Luxury'}
                    </span>
                  </div>
                  
                  <div className="bus-seats-grid">
                    {renderBusSeatsLayout()}
                  </div>
                </div>
              )}
            </div>

            {/* Pickup City & Pickup Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1.4fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="pcity">{t.pickupCityLabel}</label>
                <select
                  id="pcity"
                  className="form-control"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  required
                >
                  {cities.map((city, idx) => (
                    <option key={idx} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label htmlFor="paddress">{t.pickupAddressLabel}</label>
                <input
                  id="paddress"
                  type="text"
                  className="form-control"
                  placeholder={lang === 'en' ? "House No, Street name, landmark..." : "मकान नंबर, गली, लैंडमार्क..."}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Food Choice */}
            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Utensils size={16} /> {t.foodChoiceLabel}
              </label>
              <div className="food-options">
                <div 
                  className={`food-option ${foodChoice === 'veg' ? 'selected' : ''}`}
                  onClick={() => setFoodChoice('veg')}
                >
                  {t.vegOption}
                </div>
                <div 
                  className={`food-option ${foodChoice === 'non-veg' ? 'selected' : ''}`}
                  onClick={() => setFoodChoice('non-veg')}
                >
                  {t.nonVegOption}
                </div>
                <div 
                  className={`food-option ${foodChoice === 'both' ? 'selected' : ''}`}
                  onClick={() => setFoodChoice('both')}
                >
                  {t.bothOption}
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>{t.paymentMethodLabel}</label>
              <div className="payment-method-container">
                <div 
                  className={`payment-option-box ${paymentMethod === 'cash' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>₹</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>{t.cashOnPickupTitle}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.cashOnPickupDesc}</span>
                  </div>
                  <span className="payment-badge" style={{ backgroundColor: 'var(--success)' }}>{t.activeBadge}</span>
                </div>

                <div className="payment-option-box disabled">
                  <CreditCard size={18} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>{t.onlinePaymentComing}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.onlinePaymentDesc}</span>
                  </div>
                  <span className="payment-badge">{t.comingSoonBadge}</span>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Pricing Summary Card */}
        <div className="booking-summary-card">
          <h3>{t.bookingSummaryHeader}</h3>
          
          <div className="summary-row">
            <span>{t.packageName}</span>
            <strong style={{ color: 'var(--accent)', maxWidth: '65%', textAlign: 'right' }}>
              {selectedTrip ? selectedTrip.destination : ''}
            </strong>
          </div>
          
          <div className="summary-row">
            <span>{t.seatRate}</span>
            <span>₹{pricePerSeat.toLocaleString('en-IN')}</span>
          </div>

          <div className="summary-row">
            <span>{t.selectedSeatsCount}</span>
            <span>{selectedSeats.length} seat(s)</span>
          </div>

          <div className="summary-row" style={{ display: 'block' }}>
            <span>{t.selectedSeatsList}</span>
            <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '16px', marginTop: '5px', wordBreak: 'break-all' }}>
              {selectedSeats.length > 0 ? selectedSeats.join(', ') : (lang === 'en' ? 'None selected' : 'कोई नहीं')}
            </div>
          </div>

          <div className="summary-row">
            <span>{t.pickupCityLabel}</span>
            <span>{pickupCity}</span>
          </div>

          <div className="summary-row">
            <span>{t.foodChoiceLabel}</span>
            <span style={{ textTransform: 'capitalize' }}>{foodChoice}</span>
          </div>

          <div className="summary-row total">
            <span>{t.totalPayable}</span>
            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
          </div>

          <div style={{ margin: '20px 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
            {t.bookingNotes}
          </div>

          <button 
            type="button" 
            className="btn-block" 
            style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)', fontWeight: '700' }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? t.bookingProcessing : t.confirmBookingBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
