import React from 'react';
import { User, LogOut, LayoutDashboard, Sun, Moon, Languages } from 'lucide-react';
import { translations } from '../utils/i18n';
import type { Language } from '../utils/i18n';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onLogout, 
  currentPage, 
  setCurrentPage,
  lang,
  setLang,
  theme,
  setTheme
}) => {
  const t = translations[lang];

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => setCurrentPage('home')}>
          <div className="nav-brand-logo">P</div>
          <div className="nav-brand-text">Platform <span>My Trip</span></div>
        </div>

        <ul className="nav-links">
          <li>
            <a 
              href="#home" 
              className={currentPage === 'home' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}
            >
              {t.home}
            </a>
          </li>
          
          {user && user.role !== 'admin' && (
            <>
              <li>
                <a 
                  href="#book" 
                  className={currentPage === 'book' ? 'active' : ''} 
                  onClick={(e) => { e.preventDefault(); setCurrentPage('book'); }}
                >
                  {t.bookNow}
                </a>
              </li>
              <li>
                <a 
                  href="#profile" 
                  className={currentPage === 'profile' ? 'active' : ''} 
                  onClick={(e) => { e.preventDefault(); setCurrentPage('profile'); }}
                >
                  {t.myBookings}
                </a>
              </li>
            </>
          )}

          {user && user.role === 'admin' && (
            <li>
              <a 
                href="#admin" 
                className={currentPage === 'admin' ? 'active' : ''} 
                onClick={(e) => { e.preventDefault(); setCurrentPage('admin'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <LayoutDashboard size={16} /> {t.adminPanel}
              </a>
            </li>
          )}
        </ul>

        <div className="nav-controls">
          <div className="nav-toggles">
            <button className="toggle-btn" onClick={toggleLanguage} title="Change Language">
              <Languages size={15} />
              <span>{lang === 'en' ? 'HI' : 'EN'}</span>
            </button>
            
            <button className="toggle-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>

          <div className="nav-user">
            {user ? (
              <>
                <span className="nav-user-name" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <User size={16} /> {user.name}
                </span>
                <button className="btn-nav-logout" onClick={onLogout}>
                  <LogOut size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                  {t.logout}
                </button>
              </>
            ) : (
              <a 
                href="#login" 
                className="btn-nav-login" 
                onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }}
              >
                {t.loginRegister}
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
