import React, { useState } from 'react';
import { User, Lock, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
import type { Language } from '../utils/i18n';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isConfigured } from '../utils/firebase';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  setCurrentPage: (page: string) => void;
  lang: Language;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, setCurrentPage, lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let idToken = 'mock-google-token';

      if (isConfigured && auth) {
        const result = await signInWithPopup(auth, googleProvider);
        idToken = await result.user.getIdToken();
      } else {
        console.warn("Firebase Client SDK not configured. Triggering mock login.");
        setSuccess(lang === 'en' 
          ? 'Firebase config not found. Logging in with mock account...' 
          : 'फ़ायरबेस कॉन्फ़िग नहीं मिला। मॉक अकाउंट से लॉगिन हो रहा है...');
      }

      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google Sign-in failed.');
      }

      setSuccess(lang === 'en' ? 'Google Sign-in successful!' : 'गूगल लॉगिन सफल!');
      onLoginSuccess(data.token, data.user);

      setTimeout(() => {
        if (data.user.role === 'admin') {
          setCurrentPage('admin');
        } else {
          setCurrentPage('book');
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { username, password } 
      : { username, password, name, phone, address };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setSuccess(isLogin 
        ? (lang === 'en' ? 'Login successful!' : 'लॉगिन सफल!') 
        : (lang === 'en' ? 'Registration successful!' : 'पंजीकरण सफल!'));
      
      onLoginSuccess(data.token, data.user);
      
      setTimeout(() => {
        if (data.user.role === 'admin') {
          setCurrentPage('admin');
        } else {
          setCurrentPage('book');
        }
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || (lang === 'en' ? 'Server error.' : 'सर्वर एरर।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px' }}>
      <div className="auth-wrapper">
        <div className="auth-header">
          <h2>{isLogin ? (lang === 'en' ? 'Login' : 'लॉगिन करें') : (lang === 'en' ? 'Create Account' : 'अकाउंट बनाएं')}</h2>
          <p>
            {isLogin 
              ? (lang === 'en' ? 'Enter credentials to book tour seats.' : 'सीट बुक करने के लिए लॉगिन करें।') 
              : (lang === 'en' ? 'Fill details to register with us.' : 'पंजीकरण करने के लिए विवरण भरें।')}
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">{lang === 'en' ? 'Username' : 'यूजरनेम (Username)'}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                className="form-control"
                placeholder={lang === 'en' ? "E.g. rohit" : "जैसे: rohit"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
              <User size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">{lang === 'en' ? 'Password' : 'पासवर्ड'}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder={lang === 'en' ? "Enter password" : "पासवर्ड दर्ज करें"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '15px', color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Registration Fields */}
          {!isLogin && (
            <>
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="fullname">{lang === 'en' ? 'Full Name' : 'पूरा नाम'}</label>
                <input
                  id="fullname"
                  type="text"
                  className="form-control"
                  placeholder={lang === 'en' ? "Enter full name" : "अपना पूरा नाम लिखें"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="phone">{lang === 'en' ? 'Phone Number' : 'मोबाइल नंबर'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="phone"
                    type="tel"
                    className="form-control"
                    placeholder="Enter 10 digit phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    style={{ paddingLeft: '40px' }}
                  />
                  <Phone size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label htmlFor="address">{lang === 'en' ? 'Address / City' : 'घर का पता / शहर'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="address"
                    type="text"
                    className="form-control"
                    placeholder={lang === 'en' ? "E.g. Ward No. 11, Bhabua" : "जैसे: वार्ड नं 11, भभुआ"}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                  <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn-block" 
            disabled={loading}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          >
            {loading ? (lang === 'en' ? 'Processing...' : 'प्रक्रिया चालू है...') : (isLogin ? (lang === 'en' ? 'Login' : 'लॉगिन') : (lang === 'en' ? 'Sign Up' : 'रजिस्टर करें'))}
          </button>


          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-muted)' }}>
            <hr style={{ flex: 1, border: '0', borderTop: '1px solid var(--border)' }} />
            <span style={{ padding: '0 10px', fontSize: '13px' }}>{lang === 'en' ? 'OR' : 'या'}</span>
            <hr style={{ flex: 1, border: '0', borderTop: '1px solid var(--border)' }} />
          </div>

          <button 
            type="button" 
            className="btn-block" 
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{ 
              backgroundColor: '#ea4335', 
              color: 'white', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '10px',
              marginTop: '0'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09zM12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23zM5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63zM12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            {isLogin 
              ? (lang === 'en' ? 'Sign in with Google' : 'गूगल के साथ लॉगिन करें') 
              : (lang === 'en' ? 'Sign up with Google' : 'गूगल के साथ रजिस्टर करें')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>
              {lang === 'en' ? "Don't have an account?" : "खाता नहीं है?"} <span onClick={handleToggle}>{lang === 'en' ? 'Register Here' : 'यहाँ रजिस्टर करें'}</span>
            </>
          ) : (
            <>
              {lang === 'en' ? "Already have an account?" : "पहले से खाता है?"} <span onClick={handleToggle}>{lang === 'en' ? 'Login Here' : 'यहाँ लॉगिन करें'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
