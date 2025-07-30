import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '/logo-light.png';

const navLinks = [
  { label: 'How It Works', href: '#features' },
  { label: 'Features', href: '#features-grid' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav style={{
      width: '100%',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'linear-gradient(90deg, #1A237E 0%, #2E73FF 80%, #00e6ef 100%)',
      boxShadow: '0 2px 12px #2E73FF11',
      fontFamily: 'Inter, sans-serif',
      transition: 'background 0.2s',
    }}>
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: 72,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <img src={logo} alt="Calldock Logo" className="animated-icon-bounce" style={{ height: '40px', borderRadius: '50%', border: '2.5px solid #F6C23E', background: '#fff', boxShadow: '0 2px 8px #F6C23E22' }} />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: -1 }}>Calldock</span>
        </Link>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div className="nav-desktop" style={{ display: 'flex', gap: 24 }}>
            {navLinks.map(link => (
              <a key={link.label} href={link.href} style={{ color: '#fff', fontWeight: 600, fontSize: 17, textDecoration: 'none', position: 'relative', padding: '4px 0', transition: 'color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.color = '#F6C23E')}
                onMouseOut={e => (e.currentTarget.style.color = '#fff')}
              >
                {link.label}
              </a>
            ))}
          </div>
          <Link to="/dashboard" style={{
            background: 'linear-gradient(90deg, #F6C23E 0%, #00e6ef 100%)',
            color: '#1A237E',
            fontWeight: 800,
            fontSize: 17,
            borderRadius: 24,
            padding: '10px 28px',
            boxShadow: '0 2px 8px #F6C23E33',
            textDecoration: 'none',
            marginLeft: 16,
            transition: 'background 0.2s, color 0.2s, transform 0.2s',
            border: 'none',
            outline: 'none',
            display: 'inline-block',
          }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #F6C23E 0%, #00e6ef 100%)';
              e.currentTarget.style.color = '#1A237E';
            }}
          >
            Sign In
          </Link>
          <button className="nav-hamburger" style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 32,
            marginLeft: 16,
            cursor: 'pointer',
          }} onClick={() => setOpen(!open)}>
            <span role="img" aria-label="menu">&#9776;</span>
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      {open && (
        <div className="nav-mobile" style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(90deg, #1A237E 0%, #2E73FF 80%, #00e6ef 100%)',
          padding: '16px 32px',
        }}>
          {navLinks.map(link => (
            <a key={link.label} href={link.href} style={{ color: '#fff', fontWeight: 700, fontSize: 20, textDecoration: 'none', margin: '12px 0' }} onClick={() => setOpen(false)}>{link.label}</a>
          ))}
          <Link to="/dashboard" style={{
            background: 'linear-gradient(90deg, #F6C23E 0%, #00e6ef 100%)',
            color: '#1A237E',
            fontWeight: 800,
            fontSize: 20,
            borderRadius: 24,
            padding: '12px 32px',
            boxShadow: '0 2px 8px #F6C23E33',
            textDecoration: 'none',
            margin: '16px 0',
            border: 'none',
            outline: 'none',
            display: 'inline-block',
          }} onClick={() => setOpen(false)}>
            Sign In
          </Link>
        </div>
      )}
      <style>{`
        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: inline-block !important; }
        }
        @media (min-width: 901px) {
          .nav-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
} 