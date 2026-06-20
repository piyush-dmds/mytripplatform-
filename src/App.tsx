import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { BookTrip } from './pages/BookTrip';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import type { Language } from './utils/i18n';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [verifying, setVerifying] = useState<boolean>(true);

  // Bilingual and Theme configurations
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('pmt_lang');
    return (saved as Language) || 'hi'; // Default to Hindi as per target customers
  });
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('pmt_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  // Pre-selected trip ID for bookings
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  // Handle Theme switching in document body
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('pmt_theme', theme);
  }, [theme]);

  // Handle Language changes in local storage
  useEffect(() => {
    localStorage.setItem('pmt_lang', lang);
  }, [lang]);

  // Load auth state from localStorage on init
  useEffect(() => {
    const savedToken = localStorage.getItem('pmt_token');
    const savedUser = localStorage.getItem('pmt_user');

    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(parsedUser);

      // Verify token freshness with server
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error('Session expired');
        }
      })
      .then(freshUser => {
        setUser(freshUser);
        localStorage.setItem('pmt_user', JSON.stringify(freshUser));
        
        // If logged in as admin, redirect to admin dashboard, else check hash
        if (freshUser.role === 'admin') {
          setCurrentPage('admin');
        }
      })
      .catch(() => {
        // Token expired/invalid, clear session
        localStorage.removeItem('pmt_token');
        localStorage.removeItem('pmt_user');
        setToken('');
        setUser(null);
      })
      .finally(() => {
        setVerifying(false);
      });
    } else {
      setVerifying(false);
    }
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('pmt_token', newToken);
    localStorage.setItem('pmt_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('pmt_token');
    localStorage.removeItem('pmt_user');
    setToken('');
    setUser(null);
    setSelectedTripId('');
    setCurrentPage('home');
  };

  // Simple Router Switch
  const renderPage = () => {
    if (verifying) {
      return (
        <div className="loading-spinner" style={{ minHeight: '60vh' }}>
          <div className="spinner"></div>
          <p>{lang === 'en' ? 'Verifying session...' : 'सत्र सत्यापित किया जा रहा है...'}</p>
        </div>
      );
    }

    switch (currentPage) {
      case 'home':
        return (
          <Home 
            user={user} 
            setCurrentPage={setCurrentPage} 
            lang={lang} 
            setSelectedTripId={setSelectedTripId} 
          />
        );
      case 'login':
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
            setCurrentPage={setCurrentPage} 
            lang={lang} 
          />
        );
      case 'book':
        return user ? (
          <BookTrip 
            user={user} 
            token={token} 
            setCurrentPage={setCurrentPage} 
            lang={lang} 
            selectedTripId={selectedTripId}
            setSelectedTripId={setSelectedTripId}
          />
        ) : (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
            setCurrentPage={setCurrentPage} 
            lang={lang} 
          />
        );
      case 'profile':
        return user ? (
          <Profile 
            user={user} 
            token={token} 
            setCurrentPage={setCurrentPage} 
            lang={lang} 
          />
        ) : (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
            setCurrentPage={setCurrentPage} 
            lang={lang} 
          />
        );
      case 'admin':
        return user && user.role === 'admin' ? (
          <AdminDashboard token={token} lang={lang} />
        ) : (
          <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h2>Unauthorized</h2>
            <p>Access denied. Administrator privileges are required to view this panel.</p>
            <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setCurrentPage('home')}>
              Return to Home
            </button>
          </div>
        );
      default:
        return (
          <Home 
            user={user} 
            setCurrentPage={setCurrentPage} 
            lang={lang} 
            setSelectedTripId={setSelectedTripId} 
          />
        );
    }
  };

  return (
    <>
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
      />
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>
    </>
  );
}

export default App;
