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
      onAuth(data.token, data.uuid);
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