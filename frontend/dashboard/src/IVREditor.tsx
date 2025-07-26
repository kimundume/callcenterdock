import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Form, message, Upload, Space, Typography, Divider, Tooltip } from 'antd';
import { UploadOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

function getCompanyUuidFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('companyUuid') || '';
}

export default function IVREditor() {
  const companyUuid = getCompanyUuidFromQuery();
  const [steps, setSteps] = useState([
    { prompt: 'Welcome to CallDocker! Press 1 for Sales, 2 for Support.', audio: '', routes: { '1': { prompt: 'Connecting you to Sales...' }, '2': { prompt: 'Connecting you to Support...' } }, fallback: { prompt: 'Sorry, I didn\'t get that. Please type 1 for Sales or 2 for Support.' }, holdMusic: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [holdMusicUrl, setHoldMusicUrl] = useState('');

  useEffect(() => {
    if (!companyUuid) return;
    fetch(`http://localhost:5000/api/widget/ivr/${companyUuid}`)
      .then(res => res.json())
      .then(cfg => {
        if (cfg && cfg.steps) {
          setSteps(cfg.steps.map(step => ({ ...step })));
          console.log('IVREditor: Loaded steps from backend:', JSON.stringify(cfg.steps, null, 2));
        }
      });
  }, [companyUuid]);

  const handlePromptChange = (idx, val) => {
    setSteps(s => s.map((step, i) => i === idx ? { ...step, prompt: val } : step));
  };
  const handleFallbackChange = (idx, val) => {
    setSteps(s => s.map((step, i) => i === idx ? { ...step, fallback: { prompt: val } } : step));
  };
  const handleRouteChange = (idx, key, val) => {
    setSteps(s => s.map((step, i) => i === idx ? { ...step, routes: { ...step.routes, [key]: { prompt: val } } } : step));
  };
  const handleAudioUpload = (idx, info) => {
    if (info.file.status === 'done' || info.file.status === 'uploading') {
      const file = info.file.originFileObj;
      const reader = new FileReader();
      reader.onload = e => {
        setSteps(s => s.map((step, i) => i === idx ? { ...step, audio: e.target.result as string } : step));
        setAudioUrl(e.target.result as string);
        message.success('Prompt audio uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };
  const MAX_AUDIO_SIZE = 1 * 1024 * 1024; // 1MB
  const handleHoldMusicUpload = (idx, info) => {
    console.log('IVREditor: handleHoldMusicUpload called', idx, info);
    if (info.file.status === 'done' || info.file.status === 'uploading') {
      const file = info.file.originFileObj;
      if (file.size > MAX_AUDIO_SIZE) {
        message.error('Audio file too large (max 1MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        setSteps(s => {
          const updated = s.map((step, i) => i === idx ? { ...step, holdMusic: e.target.result as string } : step);
          console.log('IVREditor: After hold music upload, step:', JSON.stringify(updated[idx], null, 2));
          return updated;
        });
        setHoldMusicUrl(e.target.result as string);
        message.success('Hold music uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveHoldMusic = (idx) => {
    setSteps(s => s.map((step, i) => i === idx ? { ...step, holdMusic: '' } : step));
    setHoldMusicUrl('');
    message.info('Hold music removed.');
  };
  const handleAddStep = () => {
    setSteps([...steps, { prompt: '', audio: '', routes: {}, fallback: { prompt: '' }, holdMusic: '' }]);
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('IVREditor: Saving steps:', steps);
      const res = await fetch(`http://localhost:5000/api/widget/demo/ivr/${companyUuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save IVR');
      // Reload config after save
      fetch(`http://localhost:5000/api/widget/ivr/${companyUuid}`)
        .then(res => res.json())
        .then(cfg => {
          if (cfg && cfg.steps) {
            setSteps(cfg.steps.map(step => ({ ...step })));
            console.log('IVREditor: Reloaded steps after save:', JSON.stringify(cfg.steps, null, 2));
            if (!cfg.steps.some(step => step.holdMusic)) {
              message.warning('No hold music found after save.');
            }
          }
        });
      message.success('IVR config saved! Reload the widget to test.');
    } catch (err) {
      message.error('Failed to save IVR: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, background: '#f7fafd', minHeight: 480 }}>
      <Title level={4}>IVR Editor (Demo)</Title>
      {steps.map((step, idx) => (
        <Card key={idx} title={`Step ${idx + 1}`} style={{ marginBottom: 16 }}>
          <Form layout="vertical">
            <Form.Item label={<span>Prompt <Tooltip title="This is what callers will hear or see as the first message."><InfoCircleOutlined /></Tooltip></span>}>
              <Input.TextArea aria-label="IVR Prompt" value={step.prompt} onChange={e => handlePromptChange(idx, e.target.value)} rows={2} style={{ resize: 'vertical' }} />
            </Form.Item>
            <Form.Item label={<span>Prompt Audio (optional) <Tooltip title="Upload a custom audio file for the prompt."><InfoCircleOutlined /></Tooltip></span>}>
              <Upload accept="audio/*" showUploadList={false} beforeUpload={() => false} onChange={info => handleAudioUpload(idx, info)}>
                <Button icon={<UploadOutlined />} aria-label="Upload Prompt Audio">Upload Audio</Button>
              </Upload>
              {step.audio ? (
                <audio src={step.audio} controls style={{ marginTop: 8, width: '100%' }} aria-label="Prompt Audio Preview" />
              ) : (
                <div style={{ color: '#888', fontSize: 13 }}>No prompt audio uploaded.</div>
              )}
            </Form.Item>
            <Form.Item label="Routes (keypad or text)">
              <Space direction="vertical">
                {Object.keys(step.routes).map(key => (
                  <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Input value={key} style={{ width: 60 }} disabled />
                    <Input value={step.routes[key].prompt} onChange={e => handleRouteChange(idx, key, e.target.value)} placeholder="Route prompt" style={{ width: 220 }} />
                  </div>
                ))}
                <Button icon={<PlusOutlined />} size="small" onClick={() => handleRouteChange(idx, '', '')}>Add Route</Button>
              </Space>
            </Form.Item>
            <Form.Item label="Fallback Prompt">
              <Input value={step.fallback?.prompt || ''} onChange={e => handleFallbackChange(idx, e.target.value)} />
            </Form.Item>
            <Form.Item label={<span>Hold Music (optional) <Tooltip title="Upload MP3/WAV, max 1MB. This will play for callers on hold."><InfoCircleOutlined /></Tooltip></span>}>
              <Upload.Dragger
                accept="audio/*"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={info => {
                  if (info.file.status === 'done' || info.file.status === 'uploading') {
                    const file = info.file.originFileObj;
                    if (file.size > MAX_AUDIO_SIZE) {
                      message.error('Audio file too large (max 1MB)');
                      return false;
                    }
                    const reader = new FileReader();
                    reader.onload = e => {
                      handleHoldMusicUpload(idx, { file: { status: 'done', originFileObj: file } });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ borderRadius: 8, background: '#f7fafd', marginBottom: 8 }}
              >
                <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                <p className="ant-upload-text">Click or drag audio file to upload (MP3/WAV, max 1MB)</p>
                {step.holdMusic && (
                  <audio src={step.holdMusic} controls style={{ width: '100%', marginTop: 8 }} />
                )}
                {step.holdMusic && (
                  <Button danger size="small" icon={<DeleteOutlined />} style={{ marginTop: 4 }} onClick={() => handleRemoveHoldMusic(idx)}>
                    Remove
                  </Button>
                )}
                {step.holdMusic && info?.file?.name && (
                  <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>File: {info.file.name} ({(info.file.size/1024).toFixed(1)} KB)</div>
                )}
              </Upload.Dragger>
              {!step.holdMusic && (
                <div style={{ color: '#888', fontSize: 13 }}>No hold music uploaded.</div>
              )}
            </Form.Item>
          </Form>
        </Card>
      ))}
      <Button icon={<PlusOutlined />} onClick={handleAddStep} style={{ marginBottom: 16 }}>Add Step</Button>
      <Divider />
      <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>Save IVR Config</Button>
      <style>{`
@media (max-width: 600px) {
  .ant-card { margin: 0 !important; }
  .ant-form-item { margin-bottom: 12px !important; }
  .ant-btn { width: 100% !important; margin-bottom: 8px; }
}
`}</style>
    </div>
  );
} 