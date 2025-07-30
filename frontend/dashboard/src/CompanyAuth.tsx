import React, { useState } from 'react';
import { getBackendUrl } from './config';
import { DEMO_COMPANY_UUID, DEMO_ADMIN_USERNAME, DEMO_ADMIN_PASSWORD } from './demoCredentials';
import logoLight from '/logo-light.png';
import logoDark from '/logo-dark.png';

const API_URL = `${getBackendUrl()}/api/widget`;

export default function CompanyAuth({ onAuth }: { onAuth: (token: string, uuid: string) => void }) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
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
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/company/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyName, 
          displayName: displayName || companyName, // Use companyName as default
          adminUsername, 
          adminPassword, 
          email 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      setRegisteredEmail(email);
      setRegistrationSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !adminUsername || !adminPassword) {
      setError('All fields required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: adminUsername, password: adminPassword, role: 'admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      // Fetch companyUuid by email for onAuth
      let uuid = companyUuid;
      if (!uuid && email) {
        uuid = data.companyUuid || '';
      }
      onAuth(data.token, uuid);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotUuid = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-uuid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send UUID reminder');
      setForgotUuidMsg(data.message);
    } catch (err: any) {
      setForgotUuidMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotPwEmail, 
          companyUuid: forgotPwUuid, 
          username: forgotPwUsername 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send password reset');
      setForgotPwMsg(data.message);
    } catch (err: any) {
      setForgotPwMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 340, maxWidth: 420, textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <img src={logoLight} alt="CallDocker Logo" style={{ height: 48, width: 'auto', borderRadius: 12 }} />
          </div>
          
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ color: '#2E73FF', marginBottom: 16 }}>Check Your Email!</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            We've sent a verification email to <strong>{registeredEmail}</strong>.
          </p>
          
          <div style={{ background: '#f0f8ff', borderRadius: 8, padding: 16, marginBottom: 24, textAlign: 'left' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#2E73FF' }}>Next Steps:</p>
            <ol style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 14 }}>
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Complete your account setup</li>
              <li>Start using CallDocker!</li>
            </ol>
          </div>
          
          <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>
            Didn't receive the email? Check your spam folder or contact support.
          </p>
          
          <button 
            onClick={() => {
              setRegistrationSuccess(false);
              setRegisteredEmail('');
              setMode('login');
            }}
            style={{ 
              background: '#f0f0f0', 
              color: '#666', 
              border: 'none', 
              borderRadius: 8, 
              padding: '12px 24px', 
              fontWeight: 600, 
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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
          <button onClick={() => onAuth(welcomeToken, companyUuid)} style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
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
            {forgotUuidMsg && <div style={{ color: forgotUuidMsg.includes('error') ? 'red' : 'green', marginBottom: 12 }}>{forgotUuidMsg}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
              {loading ? 'Sending...' : 'Send Company UUID'}
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
            <div style={{ marginBottom: 16 }}>
              <label>Email<br />
                <input type="email" value={forgotPwEmail} onChange={e => setForgotPwEmail(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Company UUID (optional)<br />
                <input value={forgotPwUuid} onChange={e => setForgotPwUuid(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} />
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Username (optional)<br />
                <input value={forgotPwUsername} onChange={e => setForgotPwUsername(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} />
              </label>
            </div>
            {forgotPwMsg && <div style={{ color: forgotPwMsg.includes('error') ? 'red' : 'green', marginBottom: 12 }}>{forgotPwMsg}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
              {loading ? 'Sending...' : 'Send Password Reset'}
            </button>
          </form>
          <div style={{ marginTop: 16 }}>
            <button style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowForgotPassword(false)}>Back to Login</button>
          </div>
        </div>
      </div>
    );
  }

  const isDark = document.body.classList.contains('dark');
  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #2E73FF 0%, #00e6ef 100%)' }}>
      <div style={{ width: 420, maxWidth: '97vw', background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px #2E73FF22, 0 2px 8px #F6C23E22', border: '2.5px solid #F6C23E', padding: '40px 32px 32px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
          <img src={logoLight} alt="Calldock Logo" style={{ height: 64, width: 64, borderRadius: '50%', border: '3px solid #F6C23E', background: '#fff', boxShadow: '0 2px 12px #F6C23E22' }} />
        </div>
        <h2 style={{ fontWeight: 900, color: '#2E73FF', margin: 0, fontSize: 28, letterSpacing: 1 }}>Calldocker</h2>
        <div style={{ width: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #2E73FF11', padding: 28, marginTop: 8 }}>
          <h2>{mode === 'register' ? 'Company Registration' : 'Admin Login'}</h2>
          <form onSubmit={mode === 'register' ? handleRegister : handleLogin}>
            {mode === 'register' && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label>Company Name *<br />
                    <input value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Display Name (optional)<br />
                    <input 
                      value={displayName} 
                      onChange={e => setDisplayName(e.target.value)} 
                      placeholder="e.g., MindFirm, Acme Corp"
                      style={{ width: '100%', padding: 8, marginTop: 4 }} 
                    />
                    <small style={{ color: '#666', fontSize: 12 }}>This will appear in chats and widgets</small>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Email *<br />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
                  </label>
                </div>
              </>
            )}
            {mode === 'login' && (
              <div style={{ marginBottom: 12 }}>
                <label>Email *<br />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
                </label>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label>Admin Username *<br />
                <input value={adminUsername} onChange={e => setAdminUsername(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Password *<br />
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
                setDisplayName('MindFirm');
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
          {mode === 'login' && (
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
              <button style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }} onClick={() => setShowForgotUuid(true)}>
                Forgot UUID?
              </button>
              <button style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowForgotPassword(true)}>
                Forgot Password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
