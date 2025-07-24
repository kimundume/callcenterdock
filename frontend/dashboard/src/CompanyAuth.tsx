import React, { useState } from 'react';
import { DEMO_COMPANY_UUID, DEMO_ADMIN_USERNAME, DEMO_ADMIN_PASSWORD } from './demoCredentials';

const API_URL = 'http://localhost:5000/api/widget';

export default function CompanyAuth({ onAuth }: { onAuth: (token: string, uuid: string) => void }) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [companyName, setCompanyName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [email, setEmail] = useState('');
  const [companyUuid, setCompanyUuid] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeToken, setWelcomeToken] = useState('');
  const [showForgotUuid, setShowForgotUuid] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotUuidMsg, setForgotUuidMsg] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPwUuid, setForgotPwUuid] = useState('');
  const [forgotPwUsername, setForgotPwUsername] = useState('');
  const [forgotPwEmail, setForgotPwEmail] = useState('');
  const [forgotPwMsg, setForgotPwMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/company/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, adminUsername, adminPassword, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setCompanyUuid(data.uuid);
      setWelcomeToken(data.token);
      setShowWelcome(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyUuid, username: adminUsername, password: adminPassword, role: 'admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onAuth(data.token, companyUuid);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotUuid = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending email
    setForgotUuidMsg('If an account exists for this email, the Company UUID has been sent.');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPwMsg('If the information matches our records, a password reset link has been sent to your email.');
  };

  if (showWelcome) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 340, maxWidth: 420, textAlign: 'center' }}>
          <h2>🎉 Welcome to Calldocker!</h2>
          <p style={{ fontSize: 18, margin: '16px 0 8px' }}>Your company has been registered.</p>
          <div style={{ margin: '16px 0', fontWeight: 600 }}>Company UUID:</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <input value={companyUuid} readOnly style={{ width: 220, fontFamily: 'monospace', fontSize: 16, padding: 6, borderRadius: 6, border: '1px solid #eee' }} />
            <button onClick={() => { navigator.clipboard.writeText(companyUuid); }} style={{ background: '#00e6ef', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer' }}>Copy</button>
          </div>
          <div style={{ background: '#f7fafd', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 15, color: '#213547', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Next Steps:</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              <li>Add agents to your company</li>
              <li>Customize your call widget</li>
              <li>Embed the widget on your website</li>
              <li>Share your Company UUID with agents for login</li>
            </ul>
          </div>
          <button style={{ width: '100%', padding: 12, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 17, marginTop: 8 }} onClick={() => onAuth(welcomeToken, companyUuid)}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (showForgotUuid) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 340, maxWidth: 420, textAlign: 'center' }}>
          <h2>Forgot Company UUID?</h2>
          <form onSubmit={handleForgotUuid}>
            <div style={{ marginBottom: 16 }}>
              <label>Email<br />
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
              </label>
            </div>
            {forgotUuidMsg && <div style={{ color: 'green', marginBottom: 12 }}>{forgotUuidMsg}</div>}
            <button type="submit" style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
              Send Company UUID
            </button>
          </form>
          <div style={{ marginTop: 16 }}>
            <button style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowForgotUuid(false)}>Back to Login</button>
          </div>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 340, maxWidth: 420, textAlign: 'center' }}>
          <h2>Forgot Password?</h2>
          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: 12 }}>
              <label>Company UUID<br />
                <input value={forgotPwUuid} onChange={e => setForgotPwUuid(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Admin Username<br />
                <input value={forgotPwUsername} onChange={e => setForgotPwUsername(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Email<br />
                <input type="email" value={forgotPwEmail} onChange={e => setForgotPwEmail(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
              </label>
            </div>
            {forgotPwMsg && <div style={{ color: 'green', marginBottom: 12 }}>{forgotPwMsg}</div>}
            <button type="submit" style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
              Send Reset Link
            </button>
          </form>
          <div style={{ marginTop: 16 }}>
            <button style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowForgotPassword(false)}>Back to Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 340 }}>
        <h2>{mode === 'register' ? 'Company Registration' : 'Admin Login'}</h2>
        <form onSubmit={mode === 'register' ? handleRegister : handleLogin}>
          {mode === 'register' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label>Company Name<br />
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Email<br />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
                </label>
              </div>
            </>
          )}
          {mode === 'login' && (
            <div style={{ marginBottom: 12 }}>
              <label>Company UUID<br />
                <input value={companyUuid} onChange={e => setCompanyUuid(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
              </label>
              <div style={{ marginTop: 8, textAlign: 'right', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }} onClick={() => setShowForgotUuid(true)}>
                  Forgot Company UUID?
                </button>
                <button type="button" style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }} onClick={() => setShowForgotPassword(true)}>
                  Forgot Password?
                </button>
              </div>
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label>Admin Username<br />
              <input value={adminUsername} onChange={e => setAdminUsername(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Password<br />
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
            </label>
          </div>
          {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
          <button type="submit" style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }} disabled={loading}>
            {loading ? 'Please wait...' : (mode === 'register' ? 'Register Company' : 'Login as Admin')}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button type="button" onClick={() => {
            if (mode === 'register') {
              setCompanyName('Demo Company');
              setEmail('demo@company.com');
              setAdminUsername(DEMO_ADMIN_USERNAME);
              setAdminPassword(DEMO_ADMIN_PASSWORD);
            } else {
              setCompanyUuid(DEMO_COMPANY_UUID);
              setAdminUsername(DEMO_ADMIN_USERNAME);
              setAdminPassword(DEMO_ADMIN_PASSWORD);
            }
          }} style={{ marginBottom: 12, background: '#ffc107', color: '#333', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>
            Auto-fill Demo
          </button>
          {mode === 'register' ? (
            <span>Already have an account? <button style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setMode('login')}>Login</button></span>
          ) : (
            <span>Need to register? <button style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setMode('register')}>Register</button></span>
          )}
        </div>
      </div>
    </div>
  );
} 