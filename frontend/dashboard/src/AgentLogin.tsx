import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logoLight from '/logo-light.png';

const API_URL = 'http://localhost:5001/api/widget';

export default function AgentLogin({ onAuth }: { onAuth: (token: string, uuid: string, username: string) => void }) {
  const [companyUuid, setCompanyUuid] = useState('');
  const [agentUsername, setAgentUsername] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Autofill from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const uuid = params.get('companyUuid') || '';
    const username = params.get('username') || '';
    const password = params.get('password') || '';
    const demo = params.get('demo');
    if (uuid) setCompanyUuid(uuid);
    if (username) setAgentUsername(username);
    if (password) setAgentPassword(password);
    // Auto-login if all present
    if (uuid && username && password && demo === '1') {
      handleLogin(undefined, uuid, username, password);
    }
  }, [location.search]);

  const handleLogin = async (e: React.FormEvent | undefined, overrideUuid: string | undefined, overrideUsername: string | undefined, overridePassword: string | undefined) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    const uuid = overrideUuid !== undefined ? overrideUuid : companyUuid;
    const username = overrideUsername !== undefined ? overrideUsername : agentUsername;
    const password = overridePassword !== undefined ? overridePassword : agentPassword;
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyUuid: uuid, username, password, role: 'agent' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onAuth(data.token, uuid, username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #2E73FF 0%, #00e6ef 100%)' }}>
      <div style={{ width: 400, maxWidth: '95vw', background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px #2E73FF22, 0 2px 8px #F6C23E22', border: '2.5px solid #F6C23E', padding: '40px 32px 32px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <img src={logoLight} alt="Calldock Logo" style={{ height: 64, width: 64, borderRadius: '50%', border: '3px solid #F6C23E', background: '#fff', boxShadow: '0 2px 12px #F6C23E22' }} />
        </div>
        <h2 style={{ fontWeight: 900, color: '#2E73FF', margin: 0, fontSize: 28, letterSpacing: 1 }}>Agent Login</h2>
        <form className="auth-form" onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 600, color: '#213547' }}>Company UUID<br />
              <input value={companyUuid} onChange={e => setCompanyUuid(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 10, border: '1.5px solid #E0E7FF', outline: 'none', fontSize: 16, transition: 'border 0.2s', boxShadow: '0 1px 4px #2E73FF11' }} required onFocus={e => e.currentTarget.style.border = '2px solid #F6C23E'} onBlur={e => e.currentTarget.style.border = '1.5px solid #E0E7FF'} />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 600, color: '#213547' }}>Agent Username<br />
              <input value={agentUsername} onChange={e => setAgentUsername(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 10, border: '1.5px solid #E0E7FF', outline: 'none', fontSize: 16, transition: 'border 0.2s', boxShadow: '0 1px 4px #2E73FF11' }} required onFocus={e => e.currentTarget.style.border = '2px solid #F6C23E'} onBlur={e => e.currentTarget.style.border = '1.5px solid #E0E7FF'} />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontWeight: 600, color: '#213547' }}>Password<br />
              <input type="password" value={agentPassword} onChange={e => setAgentPassword(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 4, borderRadius: 10, border: '1.5px solid #E0E7FF', outline: 'none', fontSize: 16, transition: 'border 0.2s', boxShadow: '0 1px 4px #2E73FF11' }} required onFocus={e => e.currentTarget.style.border = '2px solid #F6C23E'} onBlur={e => e.currentTarget.style.border = '1.5px solid #E0E7FF'} />
            </label>
          </div>
          {error && <div style={{ background: '#ffeaea', color: '#d32f2f', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontWeight: 600, fontSize: 15, boxShadow: '0 1px 4px #F6C23E22' }}>{error}</div>}
          <button type="submit" className="cta-button" style={{ width: '100%', padding: 12, fontSize: 17, fontWeight: 700, borderRadius: 10, marginTop: 8 }} disabled={loading}>
            {loading ? 'Please wait...' : 'Login as Agent'}
          </button>
        </form>
      </div>
    </div>
  );
} 
