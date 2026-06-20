import React, { useEffect, useState } from 'react';
import { 
  Bus, 
  MapPin, 
  Home as HomeIcon, 
  Utensils, 
  ShieldCheck, 
  Phone, 
  Building, 
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';
import { translations } from '../utils/i18n';
import type { Language } from '../utils/i18n';

interface HomeProps {
  user: any;
  setCurrentPage: (page: string) => void;
  lang: Language;
  setSelectedTripId: (tripId: string) => void;
}

export const Home: React.FC<HomeProps> = ({ 
  user, 
  setCurrentPage, 
  lang,
  setSelectedTripId
}) => {
  const t = translations[lang];
  const cities = ["Bhabua", "Chandauli", "Kudra", "Mohania", "Ramgarh", "Parasthua", "Kochas"];

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trips')
      .then(res => res.json())
      .then(data => {
        setTrips(data);
      })
      .catch(err => console.error("Error loading trips:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleBookTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    if (user) {
      if (user.role === 'admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('book');
      }
    } else {
      setCurrentPage('login');
    }
  };

  const handleGenericBookNow = () => {
    // Default to nepal or first trip
    const nepalTrip = trips.find(t => t.id === 'trip-nepal') || trips[0];
    if (nepalTrip) {
      handleBookTrip(nepalTrip.id);
    } else {
      setCurrentPage(user ? 'book' : 'login');
    }
  };

  // Find Nepal trip for the banner highlight
  const nepalTrip = trips.find(t => t.id === 'trip-nepal');

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content container">
          <div className="hero-subtitle">{t.heroGoldSubtitle}</div>
          <h1 className="hero-title">{nepalTrip ? (lang === 'en' ? nepalTrip.title : 'नेपाल टूर स्पेशल पैकेज') : t.heroNepalTitle}</h1>
          <p className="hero-desc">{t.heroDesc}</p>
          
          <div className="hero-badge-container">
            <div className="hero-badge">
              <Calendar size={16} /> {t.startingDate}: <span>{nepalTrip ? nepalTrip.startDate : '25 जून 2026'}</span>
            </div>
            <div className="hero-badge">
              <Sparkles size={16} /> <span>₹{nepalTrip ? nepalTrip.price.toLocaleString('en-IN') : '8,999'}/- {t.priceText}</span>
            </div>
            <div className="hero-badge">
              <HomeIcon size={16} /> <span>{t.homePickupAvailable}</span>
            </div>
          </div>

          <button className="btn-primary" onClick={handleGenericBookNow}>
            {t.bookSeatNowBtn} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <div className="container" style={{ padding: '60px 20px' }}>
        
        {/* Dynamic Tours Section */}
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <h2 className="section-title">{t.activeDestinations}</h2>
          <p className="section-subtitle">{t.activeDestinationsSub}</p>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{lang === 'en' ? 'Loading travel routes...' : 'यात्रा पैकेजेस लोड हो रहे हैं...'}</p>
          </div>
        ) : (
          <div className="tours-grid">
            {trips.filter(trip => trip.status !== 'completed').map((trip) => (
              <div key={trip.id} className="tour-card">
                <div className="tour-card-body">
                  <div className="tour-card-dest" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={12} /> {trip.destination}
                  </div>
                  <h3 className="tour-card-title">{trip.title}</h3>
                  <p className="tour-card-desc">
                    {lang === 'en' ? trip.description : trip.descriptionHi}
                  </p>
                  
                  <div style={{ fontSize: '13px', margin: '10px 0', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Calendar size={14} />
                    <span><strong>{t.startingDate}:</strong> {trip.startDate}</span>
                  </div>

                  <div className="tour-card-meta">
                    <div className="tour-card-price">
                      ₹{trip.price.toLocaleString('en-IN')} <span>/ seat</span>
                    </div>
                    <button 
                      className="btn-action" 
                      style={{ backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => handleBookTrip(trip.id)}
                    >
                      {t.bookFirstTripBtn} <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Features Inclusions Grid */}
        <div style={{ textAlign: 'center', margin: '60px 0 40px' }}>
          <h2 className="section-title">{t.tourFeaturesTitle}</h2>
          <p className="section-subtitle">{t.tourFeaturesSub}</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <HomeIcon size={28} />
            </div>
            <h3>{t.pickupFacility}</h3>
            <p>{t.pickupFacilityDesc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Bus size={28} />
            </div>
            <h3>{t.busTravel}</h3>
            <p>{t.busTravelDesc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <MapPin size={28} />
            </div>
            <h3>{t.sightseeing}</h3>
            <p>{t.sightseeingDesc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Building size={28} />
            </div>
            <h3>{t.hotelStay}</h3>
            <p>{t.hotelStayDesc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Utensils size={28} />
            </div>
            <h3>{t.foodInclusion}</h3>
            <p>{t.foodInclusionDesc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={28} />
            </div>
            <h3>{t.safeJourney}</h3>
            <p>{t.safeJourneyDesc}</p>
          </div>
        </div>

        {/* Pickup Cities Section */}
        <section className="cities-section">
          <h3 className="cities-title">{t.ourPickupCities}</h3>
          <div className="cities-list">
            {cities.map((city, idx) => (
              <span key={idx} className="city-tag">{city}</span>
            ))}
          </div>
        </section>

        {/* Detailed Package Highlight */}
        {nepalTrip && (
          <section className="package-highlight">
            <div className="pack-details">
              <h2>{lang === 'en' ? 'Nepal Special Darshan Package' : 'नेपाल दर्शन स्पेशल पैकेज'}</h2>
              <p style={{ fontSize: '16px', lineHeight: '1.7', opacity: 0.9 }}>
                {lang === 'en' ? nepalTrip.description : nepalTrip.descriptionHi}
              </p>
              <div className="pack-inclusions">
                <div className="pack-inc-item">
                  <ShieldCheck size={18} className="pack-inc-icon" />
                  <span>{t.daysTour}</span>
                </div>
                <div className="pack-inc-item">
                  <ShieldCheck size={18} className="pack-inc-icon" />
                  <span>{t.acSleeperBus}</span>
                </div>
                <div className="pack-inc-item">
                  <ShieldCheck size={18} className="pack-inc-icon" />
                  <span>{t.hotelAccom}</span>
                </div>
                <div className="pack-inc-item">
                  <ShieldCheck size={18} className="pack-inc-icon" />
                  <span>{t.mealsIncluded}</span>
                </div>
              </div>
            </div>

            <div className="pack-pricing-card">
              <div className="pack-badge">Limited seats</div>
              <div className="pack-price-title">{t.earlyBirdOffer}</div>
              <div className="pack-price">
                ₹{nepalTrip.price.toLocaleString('en-IN')}/- <span>{t.priceText}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: '600', marginTop: '5px' }}>
                {t.noHiddenCharges}
              </p>
              <hr />
              <ul className="pack-info-list">
                <li>
                  <ShieldCheck size={16} /> <span>{t.receiveFromHome}</span>
                </li>
                <li>
                  <ShieldCheck size={16} /> <span>{t.cashPaymentAvailable}</span>
                </li>
                <li>
                  <ShieldCheck size={16} /> <span>{t.startingDate}: {nepalTrip.startDate}</span>
                </li>
              </ul>
              <button className="btn-block" style={{ marginTop: '0' }} onClick={() => handleBookTrip(nepalTrip.id)}>
                {t.bookSeatNowBtn}
              </button>
            </div>
          </section>
        )}

        {/* Contact and Office section */}
        <div style={{ 
          background: 'var(--bg-white)', 
          padding: '40px', 
          borderRadius: 'var(--radius-md)', 
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '30px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'rgba(251,192,45,0.1)', color: 'var(--primary)', padding: '15px', borderRadius: '50%' }}>
              <Phone size={30} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', color: 'var(--text-muted)' }}>{t.contactSupport}</h4>
              <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>+91 6200851221</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: 'rgba(11,29,58,0.05)', color: 'var(--primary)', padding: '15px', borderRadius: '50%' }}>
              <Building size={30} style={{ color: 'var(--accent-hover)' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', color: 'var(--text-muted)' }}>{t.officeAddressLabel}</h4>
              <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary)' }}>
                {t.officeAddressVal}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-col">
            <div className="footer-logo">Platform <span>My Trip</span></div>
            <p style={{ marginTop: '10px' }}>
              {t.footerMotto}
            </p>
          </div>
          
          <div className="footer-col">
            <h3>{t.quickLinks}</h3>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>{t.home}</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleGenericBookNow(); }}>{t.bookNow}</a></li>
              <li><a href="tel:6200851221">{lang === 'en' ? 'Call Support' : 'सपोर्ट कॉल करें'}</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>{t.officeAddressLabel}</h3>
            <p>
              वार्ड नं. 11, भभुआ नगर परिषद,<br />
              भभुआ, जिला - कैमूर, बिहार - 821101<br />
              <strong>फ़ोन:</strong> +91 6200851221<br />
              <strong>ईमेल:</strong> contact@platformmytrip.com
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Platform My Trip. {t.allRightsReserved}</p>
        </div>
      </footer>
    </div>
  );
};
