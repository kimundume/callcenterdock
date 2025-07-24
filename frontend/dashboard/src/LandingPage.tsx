import React from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'antd';
import IVRChatWidget from './IVRChatWidget';

// Placeholder icons and images
const FeatureIcon = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    width: 48, height: 48, borderRadius: 16, background: 'rgba(0,230,239,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#00e6ef', boxShadow: '0 2px 8px rgba(0,230,239,0.08)'
  }}>{children}</div>
);

const features = [
  { icon: '👥', title: 'Multi-Agent Support' },
  { icon: '💬', title: 'WhatsApp Integration' },
  { icon: '📈', title: 'Real-Time Logs' },
  { icon: '🌐', title: 'Embedded Anywhere' },
  { icon: '🔗', title: 'Webhook-Ready' },
  { icon: '📊', title: 'Analytics Dashboard' },
];

const useCases = [
  'Hotels', 'Clinics', 'Travel Sites', 'Law Firms', 'eCommerce'
];

const testimonials = [
  { name: 'Jane Doe', avatar: '🧑‍💼', text: 'Calldocker made our support seamless and fast!' },
  { name: 'John Smith', avatar: '👨‍💻', text: 'The widget is beautiful and easy to use.' },
  { name: 'Priya Patel', avatar: '👩‍⚕️', text: 'Our clinic never misses a call now.' },
];

const plans = [
  { name: 'Free Trial', price: '0', features: ['1 Agent', 'Basic Widget', 'Email Support'] },
  { name: 'Starter', price: '29', features: ['5 Agents', 'Custom Branding', 'Webhooks', 'Analytics'] },
  { name: 'Business', price: '99', features: ['Unlimited Agents', 'Priority Support', 'Advanced Analytics', 'Integrations'] },
];

export default function LandingPage() {
  const [useCase, setUseCase] = React.useState(0);
  const [billing, setBilling] = React.useState<'monthly' | 'yearly'>('monthly');
  const [widgetOpen, setWidgetOpen] = React.useState(false);
  const navigate = useNavigate();
  const demoRef = React.useRef<HTMLDivElement>(null);

  const scrollToDemo = () => {
    if (demoRef.current) {
      demoRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-root" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(120deg, #f7fafd 0%, #e8f1ff 100%)', color: '#0a2239', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section className="hero" style={{ minHeight: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '64px 16px 32px' }}>
        <div className="hero-bg-anim" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          {/* Animated bubbles or flowing lines (placeholder) */}
          <svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
            <circle cx="20%" cy="30%" r="60" fill="#00e6ef22">
              <animate attributeName="cy" values="30%;70%;30%" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="80%" cy="60%" r="80" fill="#2E73FF22">
              <animate attributeName="cy" values="60%;20%;60%" dur="10s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, color: '#0a2239', marginBottom: 16, zIndex: 1 }}>Turn Every Click Into a Call</h1>
        <p style={{ fontSize: 22, color: '#213547', marginBottom: 32, zIndex: 1, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
          Calldocker turns your visitors into conversations — instantly. Host multi-agent voice and chat widgets with ease.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', zIndex: 1 }}>
          <Button type="primary" size="large" style={{ marginRight: 16 }} onClick={() => navigate('/dashboard')}>Admin Login / Register</Button>
          <Button type="default" size="large" style={{ background: '#fff', color: '#2E73FF', border: '2px solid #2E73FF' }} onClick={() => navigate('/agent-login')}>Agent Login</Button>
          <button className="cta-btn" style={{ background: 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 32, padding: '16px 40px', boxShadow: '0 4px 24px #00e6ef33', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/dashboard')}>Try It Now</button>
          <button className="cta-btn" style={{ background: '#fff', color: '#2E73FF', fontWeight: 700, fontSize: 18, border: '2px solid #2E73FF', borderRadius: 32, padding: '16px 40px', boxShadow: '0 2px 8px #2E73FF11', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={scrollToDemo}>See Demo</button>
        </div>
        {/* Animated AI agent blob/waveform */}
        <div style={{ marginTop: 48, zIndex: 1 }}>
          <svg width="120" height="48" viewBox="0 0 120 48">
            <ellipse cx="60" cy="24" rx="50" ry="18" fill="#00e6ef33">
              <animate attributeName="rx" values="50;60;50" dur="2s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="60" cy="24" rx="30" ry="10" fill="#2E73FF33">
              <animate attributeName="rx" values="30;40;30" dur="2.5s" repeatCount="indefinite" />
            </ellipse>
          </svg>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>How It Works</h2>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Embed Widget', 'Connect Webhooks', 'Receive Live Calls'].map((step, i) => (
            <div key={step} style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 16px #2E73FF11', padding: 32, minWidth: 220, maxWidth: 260, textAlign: 'center', transition: 'transform 0.3s', fontWeight: 600, fontSize: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{i === 0 ? '🔌' : i === 1 ? '🔗' : '📞'}</div>
              {step}
            </div>
          ))}
        </div>
      </section>

      {/* Live Demo Strip */}
      <section className="live-demo" ref={demoRef} style={{ background: 'rgba(0,230,239,0.06)', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>See Calldocker in Action</h2>
        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px #00e6ef22', padding: 24, minWidth: 320, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'bounce 2s infinite alternate' }}>
          {/* Placeholder for widget iframe preview */}
          <div style={{ width: 220, height: 60, background: 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20, boxShadow: '0 2px 8px #2E73FF22' }}>
            <span style={{ marginRight: 12 }}>🤖</span> Call Us
          </div>
        </div>
        <div style={{ marginTop: 16, color: '#888', fontSize: 15 }}>Interactive widget preview coming soon</div>
      </section>

      {/* Features Grid */}
      <section className="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 16px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
          {features.map(f => (
            <div key={f.title} className="feature-card" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px #2E73FF11', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s', fontWeight: 600, fontSize: 18 }}>
              <FeatureIcon>{f.icon}</FeatureIcon>
              <div style={{ marginTop: 16 }}>{f.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases / Target Markets */}
      <section className="use-cases" style={{ background: 'rgba(46,115,255,0.04)', padding: '64px 0' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>Who is Calldocker for?</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
          {useCases.map((uc, i) => (
            <button key={uc} onClick={() => setUseCase(i)} style={{ padding: '12px 28px', borderRadius: 24, border: 'none', background: i === useCase ? 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)' : '#fff', color: i === useCase ? '#fff' : '#2E73FF', fontWeight: 700, fontSize: 18, boxShadow: i === useCase ? '0 2px 8px #00e6ef33' : '0 1px 4px #2E73FF11', cursor: 'pointer', marginBottom: 8, transition: 'background 0.2s, color 0.2s' }}>{uc}</button>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 20, color: '#213547', fontWeight: 500 }}>
          See how Calldocker transforms your <span style={{ color: '#00e6ef', fontWeight: 700 }}>{useCases[useCase]}</span>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="testimonials" style={{ maxWidth: 900, margin: '0 auto', padding: '64px 16px', position: 'relative' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>What Our Users Say</h2>
        <div style={{ display: 'flex', gap: 32, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 16 }}>
          {testimonials.map((t, i) => (
            <div key={t.name} style={{ minWidth: 280, background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px #2E73FF11', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', scrollSnapAlign: 'center', fontWeight: 500, fontSize: 18, marginRight: 8 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{t.avatar}</div>
              <div style={{ marginBottom: 12, color: '#213547' }}>{t.text}</div>
              <div style={{ color: '#00e6ef', fontWeight: 700 }}>{t.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing" style={{ background: 'rgba(0,230,239,0.06)', padding: '64px 0' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>Pricing</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
          <button onClick={() => setBilling('monthly')} style={{ padding: '10px 32px', borderRadius: 24, border: 'none', background: billing === 'monthly' ? 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)' : '#fff', color: billing === 'monthly' ? '#fff' : '#2E73FF', fontWeight: 700, fontSize: 16, boxShadow: billing === 'monthly' ? '0 2px 8px #00e6ef33' : '0 1px 4px #2E73FF11', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}>Monthly</button>
          <button onClick={() => setBilling('yearly')} style={{ padding: '10px 32px', borderRadius: 24, border: 'none', background: billing === 'yearly' ? 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)' : '#fff', color: billing === 'yearly' ? '#fff' : '#2E73FF', fontWeight: 700, fontSize: 16, boxShadow: billing === 'yearly' ? '0 2px 8px #00e6ef33' : '0 1px 4px #2E73FF11', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}>Yearly</button>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {plans.map((plan, i) => (
            <div key={plan.name} style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px #2E73FF11', padding: 40, minWidth: 260, maxWidth: 320, textAlign: 'center', fontWeight: 600, fontSize: 20, position: 'relative', border: i === 1 ? '2px solid #00e6ef' : 'none', zIndex: i === 1 ? 2 : 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#00e6ef', marginBottom: 16 }}>
                ${billing === 'monthly' ? plan.price : (parseInt(plan.price) * 10).toString()}
                <span style={{ fontSize: 16, color: '#888', fontWeight: 500 }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', color: '#213547', fontSize: 16 }}>
                {plan.features.map(f => <li key={f} style={{ marginBottom: 8 }}>✔ {f}</li>)}
              </ul>
              {i === 1 && <div style={{ position: 'absolute', top: 16, right: 16, background: '#00e6ef', color: '#fff', fontWeight: 700, borderRadius: 12, padding: '2px 12px', fontSize: 14 }}>Most Popular</div>}
              <button style={{ marginTop: 16, padding: '12px 32px', borderRadius: 24, border: 'none', background: 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)', color: '#fff', fontWeight: 700, fontSize: 18, boxShadow: '0 2px 8px #00e6ef33', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => navigate('/dashboard')}>Get Started</button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button style={{ background: 'none', border: '2px solid #2E73FF', color: '#2E73FF', fontWeight: 700, fontSize: 18, borderRadius: 24, padding: '12px 32px', cursor: 'pointer' }} onClick={() => window.open('mailto:sales@calldocker.com?subject=Custom%20Quote%20Request')}>Custom Quote for Enterprise</button>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="cta-footer" style={{ background: 'linear-gradient(90deg, #2E73FF 0%, #00e6ef 100%)', color: '#fff', textAlign: 'center', padding: '48px 16px', fontWeight: 700, fontSize: 28, position: 'relative' }}>
        <div style={{ marginBottom: 24 }}>Your business should never miss a call again.</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button style={{ background: '#fff', color: '#2E73FF', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 32, padding: '16px 40px', boxShadow: '0 2px 8px #fff8', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/dashboard')}>Get Started Free</button>
          <button style={{ background: 'none', color: '#fff', fontWeight: 700, fontSize: 18, border: '2px solid #fff', borderRadius: 32, padding: '16px 40px', boxShadow: '0 2px 8px #fff4', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => window.open('mailto:sales@calldocker.com?subject=Schedule%20a%20Demo')}>Schedule a Demo</button>
        </div>
      </footer>

      {/* Sticky Widget Preview */}
      <div className="sticky-widget" style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 100, animation: 'fadein 1.2s 1.2s both' }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', boxShadow: '0 4px 24px #00e6ef33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 32, cursor: 'pointer', border: '4px solid #fff', transition: 'transform 0.2s' }} onClick={() => setWidgetOpen(true)}>
          🤖
        </div>
        <IVRChatWidget open={widgetOpen} onClose={() => setWidgetOpen(false)} />
      </div>
    </div>
  );
} 