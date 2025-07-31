import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Alert, Spin } from 'antd';
import config from './config';

const API_URL = `${config.backendUrl}/api/widget`;

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    // If token and email are in URL, auto-verify
    if (token && email) {
      handleVerification();
    }
  }, [token, email]);

  const handleVerification = async () => {
    if (!token || !email) {
      setError('Missing verification token or email');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/company/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess(true);
      setCompanyInfo(data);
      
      // Store auth info
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('companyUuid', data.uuid);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    // This would require a resend endpoint
    setError('Please contact support to resend verification email');
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 340, maxWidth: 420, textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <img src={logoLight} alt="CallDocker Logo" style={{ height: 48, width: 'auto', borderRadius: 12 }} />
          </div>
          
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#2E73FF', marginBottom: 16 }}>Email Verified!</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Your account for <strong>{companyInfo?.companyName}</strong> has been successfully verified.
          </p>
          
          <div style={{ background: '#f0f8ff', borderRadius: 8, padding: 16, marginBottom: 24, textAlign: 'left' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#2E73FF' }}>Account Details:</p>
            <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
              <strong>Company:</strong> {companyInfo?.companyName}
            </p>
            <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
              <strong>Display Name:</strong> {companyInfo?.displayName}
            </p>
            <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
              <strong>Email:</strong> {email}
            </p>
          </div>
          
          <p style={{ color: '#888', fontSize: 14 }}>
            Redirecting to dashboard in 3 seconds...
          </p>
          
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              padding: '12px 24px', 
              fontWeight: 600, 
              cursor: 'pointer',
              marginTop: 16
            }}
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 340, maxWidth: 420, textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <img src={logoLight} alt="CallDocker Logo" style={{ height: 48, width: 'auto', borderRadius: 12 }} />
        </div>
        
        <h2 style={{ color: '#2E73FF', marginBottom: 16 }}>Verify Your Email</h2>
        
        {token && email ? (
          <>
            <p style={{ color: '#666', marginBottom: 24 }}>
              We found a verification link for <strong>{email}</strong>. 
              Click the button below to verify your account.
            </p>
            
            {error && (
              <div style={{ background: '#fee', color: '#c33', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                {error}
              </div>
            )}
            
            <button 
              onClick={handleVerification}
              disabled={verifying}
              style={{ 
                background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '12px 24px', 
                fontWeight: 600, 
                cursor: verifying ? 'not-allowed' : 'pointer',
                opacity: verifying ? 0.7 : 1,
                width: '100%'
              }}
            >
              {verifying ? 'Verifying...' : 'Verify Email Address'}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Please check your email for a verification link. 
              If you haven't received it, you can request a new one.
            </p>
            
            <button 
              onClick={handleResendEmail}
              style={{ 
                background: '#f0f0f0', 
                color: '#666', 
                border: 'none', 
                borderRadius: 8, 
                padding: '12px 24px', 
                fontWeight: 600, 
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Resend Verification Email
            </button>
          </>
        )}
        
        <div style={{ marginTop: 24 }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              color: '#2E73FF', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
} 
