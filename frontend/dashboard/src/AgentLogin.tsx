import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logoLight from '/logo-light.png';

const API_URL = 'http://localhost:5000/api/widget';

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
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7fafd' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <img src={logoLight} alt="Calldock Logo" style={{ height: 64, width: 'auto', borderRadius: 16, boxShadow: '0 2px 12px #2E73FF22' }} />
      </div>
      <form className="auth-form" onSubmit={handleLogin} style={{ width: 360, background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px #2E73FF11', padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h2>Agent Login</h2>
        <div style={{ marginBottom: 12 }}>
          <label>Company UUID<br />
            <input value={companyUuid} onChange={e => setCompanyUuid(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Agent Username<br />
            <input value={agentUsername} onChange={e => setAgentUsername(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password<br />
            <input type="password" value={agentPassword} onChange={e => setAgentPassword(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required />
          </label>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }} disabled={loading}>
          {loading ? 'Please wait...' : 'Login as Agent'}
        </button>
      </form>
    </div>
  );
} 