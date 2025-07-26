import React, { useState, useRef } from 'react';
import { Input, Button, Card, Form, Select, Switch, Typography, Divider, Upload, message, Tooltip, Space } from 'antd';
import { UploadOutlined, InfoCircleOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import IVRChatWidget from './IVRChatWidget';
import { DEMO_COMPANY_UUID, DEMO_AGENT_USERNAME, DEMO_AGENT_PASSWORD, DEMO_ADMIN_USERNAME, DEMO_ADMIN_PASSWORD } from './demoCredentials';
import logoLight from '/logo-light.png';

const { Title, Paragraph, Text } = Typography;

const ANIMATIONS = [
  { label: 'None', value: 'none' },
  { label: 'Bounce', value: 'bounce' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Wobble', value: 'wobble' },
];

export default function DemoPage() {
  const [form] = Form.useForm();
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [config, setConfig] = useState({
    companyUuid: DEMO_COMPANY_UUID,
    buttonText: 'Call Us',
    color: '#00e6ef',
    shape: 'round',
    position: 'right',
    darkMode: false,
    animation: 'none',
    image: null,
    imageUrl: '',
  });
  const [agentUrl, setAgentUrl] = useState(`/agent-login?demo=1&companyUuid=${DEMO_COMPANY_UUID}&username=${DEMO_AGENT_USERNAME}&password=${DEMO_AGENT_PASSWORD}`);
  const [widgetKey, setWidgetKey] = useState(0);
  const [ivrEditorKey, setIvrEditorKey] = useState(0);
  const agentIframeRef = useRef(null);

  const handleFormChange = (_, allValues) => {
    setConfig({ ...config, ...allValues });
  };

  const handleImageUpload = info => {
    if (info.file.status === 'done' || info.file.status === 'uploading') {
      const file = info.file.originFileObj;
      const reader = new FileReader();
      reader.onload = e => {
        setConfig(prev => ({ ...prev, image: file, imageUrl: e.target.result as string }));
        message.success('Image uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Widget button style
  const widgetBtnStyle = {
    width: 80,
    height: 80,
    borderRadius: config.shape === 'round' ? 40 : 12,
    background: config.color,
    color: config.darkMode ? '#fff' : '#222',
    fontWeight: 900,
    fontSize: 32,
    border: '4px solid #fff',
    boxShadow: '0 4px 24px #00e6ef33',
    position: 'absolute',
    right: config.position === 'right' ? 0 : undefined,
    left: config.position === 'left' ? 0 : undefined,
    top: 0,
    transition: 'all 0.2s',
    animation: config.animation !== 'none' ? `${config.animation} 1.5s infinite` : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 0,
  };

  // Open agent dashboard in new tab with demo credentials
  const openAgentDashboardInNewTab = () => {
    const url = `/agent-login?demo=1&companyUuid=${config.companyUuid}&username=${DEMO_AGENT_USERNAME}&password=${DEMO_AGENT_PASSWORD}`;
    window.open(url, '_blank', 'noopener');
  };

  // Save & reload widget (simulate reloading with new config)
  const handleReloadWidget = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/widget/demo/settings/${config.companyUuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: config.buttonText,
          color: config.color,
          shape: config.shape,
          img: config.imageUrl,
          position: config.position,
          animation: config.animation,
          dark: config.darkMode
        })
      });
      if (!res.ok) throw new Error('Failed to save widget config');
      // Fetch latest config
      const getRes = await fetch(`http://localhost:5000/api/widget/settings/${config.companyUuid}`);
      const saved = await getRes.json();
      setConfig(prev => ({ ...prev, ...saved, imageUrl: saved.img, img: saved.img }));
      setWidgetKey(prev => prev + 1);
      message.success('Widget reloaded with new settings!');
    } catch (err) {
      message.error('Failed to save/reload widget: ' + err.message);
    }
  };

  const reloadWidgetAndIVR = () => {
    setWidgetKey(prev => prev + 1);
    setIvrEditorKey(prev => prev + 1);
    message.success('Widget and IVR config reloaded!');
  };

  const createDemoAgent = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/widget/demo/create-demo-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyUuid: config.companyUuid, username: DEMO_AGENT_USERNAME, password: DEMO_AGENT_PASSWORD })
      });
      const data = await res.json();
      if (!res.ok && !data.error?.includes('already exists')) throw new Error(data.error || 'Failed to create demo agent');
      message.success('Demo agent created or already exists!');
    } catch (err) {
      message.error('Failed to create demo agent: ' + err.message);
    }
  };

  const openAdminIVRTab = () => {
    window.open(`/dashboard?tab=routing`, '_blank');
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <img src={logoLight} alt="Calldock Logo" style={{ height: 64, width: 'auto' }} />
      </div>
      <Paragraph style={{ textAlign: 'center', fontSize: 16, marginBottom: 32 }}>
        Test the full Calldocker MVP experience: configure the widget, start a call/chat, and see it received by an agent — all in one page!
      </Paragraph>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: Widget Config & Preview */}
        <div style={{ flex: 1, minWidth: 340 }}>
          <Card title="Widget Configuration" style={{ marginBottom: 24 }}>
            <Form
              form={form}
              layout="vertical"
              initialValues={config}
              onValuesChange={handleFormChange}
            >
              <Form.Item label="Company UUID" name="companyUuid" rules={[{ required: true, message: 'Enter your company UUID' }]}> 
                <Input placeholder="Paste your company UUID here" />
              </Form.Item>
              <Form.Item label="Button Text" name="buttonText">
                <Input />
              </Form.Item>
              <Form.Item label="Button Color" name="color">
                <Input type="color" style={{ width: 60, height: 32, padding: 0, border: 'none', background: 'none' }} />
              </Form.Item>
              <Form.Item label="Button Shape" name="shape">
                <Select>
                  <Select.Option value="round">Round</Select.Option>
                  <Select.Option value="square">Square</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Position" name="position">
                <Select>
                  <Select.Option value="right">Right</Select.Option>
                  <Select.Option value="left">Left</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Dark Mode" name="darkMode" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label={<span>Animation <Tooltip title="Add subtle animation to the widget button."><InfoCircleOutlined /></Tooltip></span>} name="animation">
                <Select>
                  {ANIMATIONS.map(a => <Select.Option key={a.value} value={a.value}>{a.label}</Select.Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="Button Image (optional)" name="image">
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleImageUpload}
                >
                  <Button icon={<UploadOutlined />}>Upload Image</Button>
                </Upload>
                {config.imageUrl && <img src={config.imageUrl} alt="Widget" style={{ width: 32, height: 32, borderRadius: 8, marginTop: 8 }} />}
              </Form.Item>
            </Form>
            <Space style={{ marginTop: 16 }}>
              <Button icon={<ReloadOutlined />} onClick={handleReloadWidget}>Save & Reload Widget</Button>
              <Button onClick={createDemoAgent}>Create Demo Agent</Button>
              <Button onClick={openAdminIVRTab}>Open IVR Editor</Button>
            </Space>
          </Card>
          <Divider />
          <Title level={4}>Live Widget Preview</Title>
          <div style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: config.position === 'right' ? 'flex-end' : 'flex-start', marginBottom: 32, position: 'relative', height: 120 }}>
            <Button
              style={widgetBtnStyle}
              onClick={() => setWidgetOpen(true)}
            >
              {(config.imageUrl || config.img) ? <img src={config.imageUrl || config.img} alt="icon" style={{ width: 32, height: 32, borderRadius: 8 }} /> : '🤖'}
              <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 18 }}>{config.buttonText}</span>
            </Button>
            {/* Key forces remount for config reload */}
            <IVRChatWidget open={widgetOpen} onClose={() => setWidgetOpen(false)} companyUuid={config.companyUuid} logoSrc={logoLight} />
          </div>
        </div>
        {/* Right: Agent Dashboard Iframe */}
        <div style={{ flex: 1.2, minWidth: 420 }}>
          <Card title={<span>Agent Dashboard <Tooltip title="This is a live view of the agent dashboard. Log in as an agent to receive calls from the widget."><InfoCircleOutlined /></Tooltip></span>}>
            <div style={{ height: 600, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#f7fafd', position: 'relative' }}>
              <iframe
                ref={agentIframeRef}
                src={agentUrl}
                title="Agent Dashboard"
                style={{ width: '100%', height: '100%', border: 'none', background: '#f7fafd' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
              <Button
                icon={<ExportOutlined />}
                style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
                onClick={openAgentDashboardInNewTab}
              >Open in New Tab</Button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Input value={agentUrl} onChange={e => setAgentUrl(e.target.value)} style={{ width: 320 }} />
              <Button onClick={() => setAgentUrl(`/agent-login?demo=1&companyUuid=${config.companyUuid}&username=${DEMO_AGENT_USERNAME}&password=${DEMO_AGENT_PASSWORD}`)}>Reset</Button>
              <Tooltip title="You can change the URL to test different agent dashboards or tabs."><InfoCircleOutlined /></Tooltip>
            </div>
            <Divider />
            <Title level={5}>Demo Agent Credentials</Title>
            <div style={{ fontSize: 15, marginBottom: 8 }}>
              <Text strong>Company UUID:</Text> <Text code>{config.companyUuid}</Text><br />
              <Text strong>Agent Username:</Text> <Text code>{DEMO_AGENT_USERNAME}</Text><br />
              <Text strong>Password:</Text> <Text code>{DEMO_AGENT_PASSWORD}</Text>
            </div>
          </Card>
        </div>
      </div>
      <Divider />
      <Title level={4}>IVR Editor (Live)</Title>
      <div style={{ height: 480, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        <iframe
          key={ivrEditorKey}
          src={`/ivr-editor?companyUuid=${config.companyUuid}`}
          title="IVR Editor"
          style={{ width: '100%', height: '100%', border: 'none', background: '#f7fafd' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
      <Button onClick={reloadWidgetAndIVR}>Reload Widget & IVR Config</Button>
      <Divider />
      <Title level={4}>How to Test Locally</Title>
      <ol style={{ fontSize: 16, marginBottom: 24 }}>
        <li>In the <b>Agent Dashboard</b> (right), log in as an agent for your company (demo credentials are pre-filled).</li>
        <li>Enter your <b>Company UUID</b> above (register as admin if you don’t have one).</li>
        <li>Click the widget button above to open the chat/call widget and start a call/chat.</li>
        <li>The agent dashboard should receive the call in real time.</li>
        <li>Try using different browsers or incognito mode to simulate different users/devices.</li>
      </ol>
      <Divider />
      <Title level={4}>Need to test on another device or share your local server?</Title>
      <Paragraph>
        Use a tool like <a href="https://ngrok.com/" target="_blank" rel="noopener noreferrer">ngrok</a> to expose your local server to the internet. <br />
        Example: <code>ngrok http 5173</code> (for frontend) and <code>ngrok http 5000</code> (for backend).<br />
        Update the widget config to use the ngrok URL for real-world testing.
      </Paragraph>
      <Divider />
      <Title level={4}>MVP Features Showcased Here</Title>
      <ul style={{ fontSize: 16, marginBottom: 24 }}>
        <li>Widget customization (text, color, shape, image, animation, position, dark mode)</li>
        <li>Live widget preview and call/chat initiation</li>
        <li>Real-time call/chat reception in agent dashboard</li>
        <li>Call states: ringing, in-call, ended, queue</li>
        <li>Agent dashboard: call logs, analytics, notifications</li>
        <li>Multi-agent support (test with multiple agent dashboards in different tabs)</li>
      </ul>
      <Paragraph type="secondary">
        For advanced features (IVR builder, integrations, audit log, etc.), use the Admin Dashboard.
      </Paragraph>
    </div>
  );
} 