import React, { useState } from 'react';

const API_URL = 'http://localhost:5000/api/widget';

export default function AgentLogin({ onAuth }: { onAuth: (token: string, uuid: string, username: string) => void }) {
  const [companyUuid, setCompanyUuid] = useState('');
  const [agentUsername, setAgentUsername] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyUuid, username: agentUsername, password: agentPassword, role: 'agent' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onAuth(data.token, companyUuid, agentUsername);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 340 }}>
        <h2>Agent Login</h2>
        <form onSubmit={handleLogin}>
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
    </div>
  );
} 