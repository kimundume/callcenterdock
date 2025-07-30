import React from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Input, message } from 'antd';
import IVRChatWidget from './IVRChatWidget';
import { FaWhatsapp, FaUsers, FaChartLine, FaGlobe, FaLink, FaChartPie, FaPlug, FaPhoneAlt, FaUserCircle, FaUserTie, FaUserNurse, FaStar, FaCogs } from 'react-icons/fa';
import logoLight from '/logo-light.png';
import logoDark from '/logo-dark.png';
import Navbar from './Navbar';

// Placeholder icons and images
const FeatureIcon = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    width: 48, height: 48, borderRadius: 16, background: 'rgba(0,230,239,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#00e6ef', boxShadow: '0 2px 8px rgba(0,230,239,0.08)'
  }}>{children}</div>
);

const features = [
  { icon: <FaUsers />, title: 'Multi-Agent Support' },
  { icon: <FaWhatsapp color="#25D366" />, title: 'WhatsApp Integration' },
  { icon: <FaChartLine color="#2E73FF" />, title: 'Real-Time Logs' },
  { icon: <FaGlobe color="#00e6ef" />, title: 'Embedded Anywhere' },
  { icon: <FaLink color="#2E73FF" />, title: 'Webhook-Ready' },
  { icon: <FaChartPie color="#2E73FF" />, title: 'Analytics Dashboard' },
];

const useCases = [
  'Hotels', 'Clinics', 'Travel Sites', 'Law Firms', 'eCommerce'
];

const testimonials = [
  { name: 'Jane Doe', avatar: <FaUserTie color="#2E73FF" />, text: 'Calldocker made our support seamless and fast!', company: 'Acme Corp', rating: 5 },
  { name: 'John Smith', avatar: <FaUserCircle color="#00e6ef" />, text: 'The widget is beautiful and easy to use.', company: 'Smith Digital', rating: 5 },
  { name: 'Priya Patel', avatar: <FaUserNurse color="#1CC88A" />, text: 'Our clinic never misses a call now.', company: 'Patel Clinic', rating: 4 },
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
  const [isOnline, setIsOnline] = React.useState(true);
  const navigate = useNavigate();
  const demoRef = React.useRef<HTMLDivElement>(null);

  const scrollToDemo = () => {
    if (demoRef.current) {
      demoRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const checkAvailabilityAndOpenWidget = async () => {
    console.log('[LandingPage] Call Us button clicked');
    try {
      // Check availability for public landing page widget (no companyUuid)
      const res = await fetch('http://localhost:5001/api/widget/availability');
      const data = await res.json();
      
      console.log('[LandingPage] Availability response:', data);
      
      if (data.online) {
        setIsOnline(true);
        setWidgetOpen(true);
        console.log('[LandingPage] Widget should open (online) - Routing type:', data.routingType, 'Available agents:', data.availableAgents);
      } else {
        setIsOnline(false);
        setWidgetOpen(true);
        console.log('[LandingPage] Widget should open (offline) - Routing type:', data.routingType);
      }
    } catch (e) {
      console.error('[LandingPage] Error checking availability:', e);
      setIsOnline(false);
      setWidgetOpen(true);
      console.log('[LandingPage] Widget should open (error/offline)');
    }
  };

  return (
    <>
      <Navbar />
      {/* Hero Section */}
      <section className="hero" style={{ minHeight: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '64px 16px 32px' }}>
        <img src={logoLight} alt="Calldock Logo" className="animated-icon-bounce" style={{ width: 80, height: 80, marginBottom: 16, borderRadius: '50%', border: '3px solid #F6C23E', background: '#fff', boxShadow: '0 2px 12px #F6C23E22' }} />
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
      <section id="features" className="how-it-works" style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>How It Works</h2>
        <div style={{ maxWidth: 700, marginBottom: 32, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'linear-gradient(120deg, #f7fafd 60%, #e8f1ff 100%)', borderRadius: 20, boxShadow: '0 2px 16px #2E73FF11', padding: 32, color: '#213547', fontSize: 18, textAlign: 'center', fontWeight: 500, minWidth: 320, maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 48, marginBottom: 8, color: '#00e6ef' }}><FaPlug /></span>
            Calldocker is a cloud-based platform that lets you add a voice and chat widget to your website in minutes. Visitors can instantly connect with your team via browser calls or chat, and you can manage all conversations from a unified dashboard. No phone numbers or downloads required.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: <FaPlug color="#00e6ef" />, label: 'Embed Widget' },
            { icon: <FaLink color="#2E73FF" />, label: 'Connect Webhooks' },
            { icon: <FaPhoneAlt color="#1CC88A" />, label: 'Receive Live Calls' },
          ].map((step, i) => (
            <div key={step.label} style={{ background: 'linear-gradient(120deg, #f7fafd 60%, #e8f1ff 100%)', borderRadius: 24, boxShadow: '0 2px 16px #2E73FF11', padding: 32, minWidth: 220, maxWidth: 260, textAlign: 'center', transition: 'transform 0.3s', fontWeight: 600, fontSize: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{step.icon}</div>
              {step.label}
            </div>
          ))}
        </div>
      </section>

      {/* Live Demo Strip */}
      <section className="live-demo" ref={demoRef} style={{ background: 'rgba(0,230,239,0.06)', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>See Calldocker in Action</h2>
        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px #00e6ef22', padding: 24, minWidth: 320, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'bounce 2s infinite alternate' }}>
          {/* Widget preview with only logo and 'Call Us' text, no extra icon */}
          <div style={{ width: 220, height: 60, background: 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20, boxShadow: '0 2px 8px #2E73FF22' }}>
            <div style={{ width: 38, height: 38, borderRadius: 19, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, border: '2px solid #F6C23E' }}>
              <img src={logoLight} alt="Calldock Widget Logo" style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', border: '2px solid #F6C23E', padding: 2, boxShadow: '0 2px 8px #F6C23E22' }} />
            </div>
            Call Us
          </div>
        </div>
        <div style={{ marginTop: 16, color: '#888', fontSize: 15 }}>Interactive widget preview coming soon</div>
      </section>

      {/* Features Grid */}
      <section id="features-grid" className="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 16px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Features</h2>
        <div style={{ maxWidth: 700, marginBottom: 32, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'linear-gradient(120deg, #f7fafd 60%, #e8f1ff 100%)', borderRadius: 20, boxShadow: '0 2px 16px #2E73FF11', padding: 32, color: '#213547', fontSize: 18, textAlign: 'center', fontWeight: 500, minWidth: 320, maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 48, marginBottom: 8, color: '#2E73FF' }}><FaCogs /></span>
            Calldocker offers multi-agent support, WhatsApp integration, real-time logs, analytics, and more. Our widget is fully embeddable and can be customized to match your brand. All calls and chats are browser-based and secure.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
          {features.map(f => (
            <div key={f.title} className="feature-card" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px #F6C23E22, 0 2px 8px #00e6ef22', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s', fontWeight: 600, fontSize: 18, border: '2px solid #F6C23E33' }}>
              <FeatureIcon>{f.icon}</FeatureIcon>
              <div style={{ marginTop: 16 }}>{f.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations / Use Cases */}
      <section id="integrations" className="use-cases" style={{ background: 'rgba(46,115,255,0.04)', padding: '64px 0' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, textAlign: 'center' }}>Integrations & Use Cases</h2>
        <div style={{ maxWidth: 700, margin: '0 auto', marginBottom: 32, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'linear-gradient(120deg, #f7fafd 60%, #e8f1ff 100%)', borderRadius: 20, boxShadow: '0 2px 16px #2E73FF11', padding: 32, color: '#213547', fontSize: 18, textAlign: 'center', fontWeight: 500, minWidth: 320, maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 48, marginBottom: 8, color: '#25D366' }}><FaGlobe /></span>
            Calldocker integrates with your website, CRM, and communication tools. Use webhooks to connect with your favorite apps, or embed the widget anywhere. Perfect for hotels, clinics, travel sites, law firms, eCommerce, and more.
          </div>
        </div>
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
      <section id="docs" className="testimonials" style={{ maxWidth: 900, margin: '0 auto', padding: '64px 16px', position: 'relative' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>What Our Users Say</h2>
        <div style={{ display: 'flex', gap: 32, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 16 }}>
          {testimonials.map((t, i) => (
            <div key={t.name} style={{ minWidth: 320, background: 'linear-gradient(120deg, #f7fafd 60%, #e8f1ff 100%)', borderRadius: 20, boxShadow: '0 2px 16px #2E73FF11', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', scrollSnapAlign: 'center', fontWeight: 500, fontSize: 18, marginRight: 8, position: 'relative' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{t.avatar}</div>
              <div style={{ marginBottom: 12, color: '#213547', fontStyle: 'italic', fontSize: 18, lineHeight: 1.5 }}>
                <FaStar color="#F6C23E" style={{ marginRight: 2, verticalAlign: 'middle' }} />
                {Array.from({ length: t.rating - 1 }).map((_, idx) => <FaStar key={idx} color="#F6C23E" style={{ marginRight: 2, verticalAlign: 'middle' }} />)}
                <span style={{ marginLeft: 8 }}>{t.text}</span>
              </div>
              <div style={{ color: '#00e6ef', fontWeight: 700 }}>{t.name}</div>
              <div style={{ color: '#888', fontSize: 15, marginTop: 2 }}>{t.company}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing" style={{ background: 'rgba(0,230,239,0.06)', padding: '64px 0' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>Pricing</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
          <button onClick={() => setBilling('monthly')} style={{ padding: '10px 32px', borderRadius: 24, border: 'none', background: billing === 'monthly' ? 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)' : '#fff', color: billing === 'monthly' ? '#fff' : '#2E73FF', fontWeight: 700, fontSize: 16, boxShadow: billing === 'monthly' ? '0 2px 8px #00e6ef33' : '0 1px 4px #2E73FF11', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}>Monthly</button>
          <button onClick={() => setBilling('yearly')} style={{ padding: '10px 32px', borderRadius: 24, border: 'none', background: billing === 'yearly' ? 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)' : '#fff', color: billing === 'yearly' ? '#fff' : '#2E73FF', fontWeight: 700, fontSize: 16, boxShadow: billing === 'yearly' ? '0 2px 8px #00e6ef33' : '0 1px 4px #2E73FF11', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}>Yearly</button>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {plans.map((plan, i) => (
            <div key={plan.name} style={{
              background: 'linear-gradient(120deg, #fff 60%, #e8f1ff 100%)',
              borderRadius: 24,
              boxShadow: i === 1 ? '0 8px 32px #00e6ef33' : '0 2px 16px #2E73FF11',
              padding: 48,
              minWidth: 280,
              maxWidth: 340,
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 20,
              position: 'relative',
              border: i === 1 ? '2px solid #00e6ef' : 'none',
              zIndex: i === 1 ? 2 : 1,
              transform: i === 1 ? 'scale(1.06)' : 'scale(1)',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, color: i === 1 ? '#2E73FF' : '#00e6ef', letterSpacing: -1 }}>{plan.name}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: i === 1 ? '#2E73FF' : '#00e6ef', marginBottom: 16, lineHeight: 1 }}>
                ${billing === 'monthly' ? plan.price : (parseInt(plan.price) * 10).toString()}
                <span style={{ fontSize: 18, color: '#888', fontWeight: 500 }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', color: '#213547', fontSize: 16, textAlign: 'left', maxWidth: 220, marginLeft: 'auto', marginRight: 'auto' }}>
                {plan.features.map(f => <li key={f} style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}><FaStar color="#1CC88A" style={{ marginRight: 8, fontSize: 16 }} /> {f}</li>)}
              </ul>
              {i === 1 && <div style={{ position: 'absolute', top: 16, right: 16, background: 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)', color: '#fff', fontWeight: 700, borderRadius: 12, padding: '2px 16px', fontSize: 15, boxShadow: '0 2px 8px #00e6ef33' }}>Most Popular</div>}
              <button style={{ marginTop: 18, padding: '14px 36px', borderRadius: 24, border: 'none', background: 'linear-gradient(90deg, #00e6ef 0%, #2E73FF 100%)', color: '#fff', fontWeight: 800, fontSize: 20, boxShadow: '0 2px 8px #00e6ef33', cursor: 'pointer', transition: 'background 0.2s, transform 0.2s', letterSpacing: 1 }} onClick={() => navigate('/dashboard')}>Get Started</button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button style={{ background: 'none', border: '2px solid #2E73FF', color: '#2E73FF', fontWeight: 700, fontSize: 18, borderRadius: 24, padding: '12px 32px', cursor: 'pointer' }} onClick={() => window.open('mailto:sales@calldocker.com?subject=Custom%20Quote%20Request')}>Custom Quote for Enterprise</button>
        </div>
      </section>

      {/* CTA Footer */}
      <footer id="contact" className="cta-footer" style={{ background: 'linear-gradient(90deg, #2E73FF 0%, #00e6ef 100%)', color: '#fff', textAlign: 'center', padding: '48px 16px', fontWeight: 700, fontSize: 28, position: 'relative' }}>
        <div style={{ marginBottom: 24 }}>Your business should never miss a call again.</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button style={{ background: '#fff', color: '#2E73FF', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 32, padding: '16px 40px', boxShadow: '0 2px 8px #fff8', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/dashboard')}>Get Started Free</button>
          <button style={{ background: 'none', color: '#fff', fontWeight: 700, fontSize: 18, border: '2px solid #fff', borderRadius: 32, padding: '16px 40px', boxShadow: '0 2px 8px #fff4', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => window.open('mailto:sales@calldocker.com?subject=Schedule%20a%20Demo')}>Schedule a Demo</button>
        </div>
      </footer>

      {/* Sticky Widget Preview */}
      <div className="sticky-widget" style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 100, animation: 'fadein 1.2s 1.2s both', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'linear-gradient(90deg, #fff 60%, #F6C23E 100%)', borderRadius: 40, boxShadow: '0 4px 24px #00e6ef33', border: '3px solid #F6C23E', padding: '8px 20px 8px 8px', transition: 'box-shadow 0.2s, transform 0.2s', minWidth: 0 }} onClick={checkAvailabilityAndOpenWidget}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: 'linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #F6C23E', boxShadow: '0 2px 8px #2E73FF33', marginRight: 12 }}>
            <img src={logoLight} alt="Calldock Widget Logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 19, background: '#fff' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#2E73FF', letterSpacing: 1, textShadow: '0 2px 8px #F6C23E33' }}>Call Us</span>
        </div>
        <IVRChatWidget 
          open={widgetOpen} 
          // Debug log for widget open state
          key={widgetOpen ? 'open' : 'closed'}
          onClose={() => setWidgetOpen(false)} 
          companyUuid={null}
          logoSrc={logoLight}
        />
      </div>
    </>
  );
} 
