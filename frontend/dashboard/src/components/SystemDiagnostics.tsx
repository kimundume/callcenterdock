import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Tabs, Table, Badge, Tag, Progress, Statistic, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ExclamationCircleOutlined,
  ReloadOutlined,
  BugOutlined,
  SoundOutlined,
  PhoneOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { getBackendUrl } from '../config';

const { TabPane } = Tabs;

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: any;
  fix?: string;
}

interface SystemStatus {
  backend: DiagnosticResult;
  endpoints: DiagnosticResult[];
  websocket: DiagnosticResult;
  webrtc: DiagnosticResult;
  agents: DiagnosticResult;
  callSync: DiagnosticResult;
}

const SystemDiagnostics: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Critical endpoints to test
  const criticalEndpoints = [
    { path: '/api/agents/calldocker-company-uuid', method: 'GET', name: 'Agents List' },
    { path: '/api/widget/queue/calldocker-company-uuid', method: 'GET', name: 'Queue Status' },
    { path: '/api/widget/agent/status', method: 'GET', name: 'Agent Status API' },
    { path: '/api/widget/agent/end-call', method: 'POST', name: 'End Call API' },
    { path: '/api/widget/agent/auto-reset', method: 'POST', name: 'Auto Reset API' },
    { path: '/api/widget/route-call', method: 'POST', name: 'Route Call API' },
    { path: '/health', method: 'GET', name: 'Health Check' },
    { path: '/socket.io/?transport=polling', method: 'GET', name: 'Socket.IO' }
  ];

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true);
    setLastCheck(new Date());

    try {
      // Test backend connectivity
      const backendResult = await testBackendConnectivity();
      
      // Test all endpoints
      const endpointResults = await testAllEndpoints();
      
      // Test WebSocket
      const websocketResult = await testWebSocket();
      
      // Test WebRTC readiness
      const webrtcResult = await testWebRTCReadiness();
      
      // Test agents
      const agentsResult = await testAgents();
      
      // Test call synchronization service
      const callSyncResult = await testCallSyncService();

      setSystemStatus({
        backend: backendResult,
        endpoints: endpointResults,
        websocket: websocketResult,
        webrtc: webrtcResult,
        agents: agentsResult,
        callSync: callSyncResult
      });

    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testBackendConnectivity = async (): Promise<DiagnosticResult> => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${getBackendUrl()}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          name: 'Backend Connectivity',
          status: 'success',
          message: `Connected (${responseTime}ms)`,
          details: { ...data, responseTime: `${responseTime}ms` }
        };
      } else {
        return {
          name: 'Backend Connectivity',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          fix: 'Check if Render backend service is running'
        };
      }
    } catch (error) {
      return {
        name: 'Backend Connectivity',
        status: 'error',
        message: `Connection failed: ${error.message}`,
        fix: 'Backend service appears to be down. Check Render deployment.'
      };
    }
  };

  const testAllEndpoints = async (): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = [];

    for (const endpoint of criticalEndpoints) {
      try {
        const url = `${getBackendUrl()}${endpoint.path}`;
        const options: RequestInit = { 
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        };

        if (endpoint.method === 'POST') {
          options.body = JSON.stringify({});
        }

        const response = await fetch(url, options);
        
        results.push({
          name: endpoint.name,
          status: response.ok ? 'success' : 'error',
          message: response.ok ? `${response.status} OK` : `${response.status} ${response.statusText}`,
          details: { url, method: endpoint.method, status: response.status },
          fix: !response.ok ? 'This endpoint is missing or not deployed' : undefined
        });
      } catch (error) {
        results.push({
          name: endpoint.name,
          status: 'error',
          message: `Failed: ${error.message}`,
          fix: 'Network error or backend down'
        });
      }
    }

    return results;
  };

  const testWebSocket = async (): Promise<DiagnosticResult> => {
    return new Promise((resolve) => {
      try {
        const socket = new WebSocket(`wss://${getBackendUrl().replace('https://', '')}/socket.io/?EIO=4&transport=websocket`);
        
        const timeout = setTimeout(() => {
          socket.close();
          resolve({
            name: 'WebSocket Connection',
            status: 'error',
            message: 'Connection timeout',
            fix: 'WebSocket server not responding'
          });
        }, 5000);

        socket.onopen = () => {
          clearTimeout(timeout);
          socket.close();
          resolve({
            name: 'WebSocket Connection',
            status: 'success',
            message: 'Connected successfully'
          });
        };

        socket.onerror = () => {
          clearTimeout(timeout);
          resolve({
            name: 'WebSocket Connection',
            status: 'error',
            message: 'Connection failed',
            fix: 'WebSocket endpoint not available'
          });
        };
      } catch (error) {
        resolve({
          name: 'WebSocket Connection',
          status: 'error',
          message: `Error: ${error.message}`,
          fix: 'WebSocket not supported or backend down'
        });
      }
    });
  };

  const testWebRTCReadiness = async (): Promise<DiagnosticResult> => {
    try {
      // Test getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      // Test RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pc.close();

      return {
        name: 'WebRTC Readiness',
        status: 'success',
        message: 'Audio access and peer connection available',
        details: { 
          getUserMedia: 'Available',
          RTCPeerConnection: 'Available',
          STUNServers: 'Configured'
        }
      };
    } catch (error) {
      return {
        name: 'WebRTC Readiness',
        status: 'error',
        message: `WebRTC not available: ${error.message}`,
        fix: 'Enable microphone permissions or use HTTPS'
      };
    }
  };

  const testAgents = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/agents/calldocker-company-uuid`);
      
      if (response.ok) {
        const agents = await response.json();
        const onlineAgents = agents.filter((a: any) => a.status === 'online');
        const availableAgents = agents.filter((a: any) => 
          a.status === 'online' && 
          a.availability === 'online' && 
          a.currentCalls < (a.maxCalls || 5)
        );

        return {
          name: 'Agent Status',
          status: availableAgents.length > 0 ? 'success' : 'warning',
          message: `${agents.length} total, ${onlineAgents.length} online, ${availableAgents.length} available`,
          details: { 
            totalAgents: agents.length,
            onlineAgents: onlineAgents.length,
            availableAgents: availableAgents.length,
            agents: agents.map((a: any) => ({
              username: a.username,
              status: a.status,
              currentCalls: a.currentCalls,
              maxCalls: a.maxCalls
            }))
          }
        };
      } else {
        return {
          name: 'Agent Status',
          status: 'error',
          message: `API failed: ${response.status}`,
          fix: 'Agents API endpoint not available'
        };
      }
    } catch (error) {
      return {
        name: 'Agent Status',
        status: 'error',
        message: `Error: ${error.message}`,
        fix: 'Cannot connect to agents API'
      };
    }
  };

  const testCallSyncService = async (): Promise<DiagnosticResult> => {
    try {
      // Check if the new synchronization endpoints exist
      const testEndpoints = [
        '/api/widget/queue/calldocker-company-uuid',
        '/api/widget/agent/status',
        '/api/widget/agent/end-call'
      ];

      let workingEndpoints = 0;
      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(`${getBackendUrl()}${endpoint}`);
          if (response.status !== 404) {
            workingEndpoints++;
          }
        } catch (e) {
          // Network error, continue
        }
      }

      if (workingEndpoints === testEndpoints.length) {
        return {
          name: 'Call Synchronization Service',
          status: 'success',
          message: 'All sync endpoints available',
          details: { workingEndpoints, totalEndpoints: testEndpoints.length }
        };
      } else if (workingEndpoints > 0) {
        return {
          name: 'Call Synchronization Service',
          status: 'warning',
          message: `${workingEndpoints}/${testEndpoints.length} endpoints available`,
          fix: 'Partial deployment - some sync features missing'
        };
      } else {
        return {
          name: 'Call Synchronization Service',
          status: 'error',
          message: 'Sync service not deployed',
          fix: 'CallSynchronizationService not deployed - this is why audio and sync are broken!'
        };
      }
    } catch (error) {
      return {
        name: 'Call Synchronization Service',
        status: 'error',
        message: `Cannot test: ${error.message}`,
        fix: 'Backend connection required'
      };
    }
  };

  const fixAgent = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/widget/agent/auto-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        message.success('Agent status reset successfully');
        runComprehensiveDiagnostics(); // Re-run diagnostics
      } else {
        message.error('Failed to reset agent status');
      }
    } catch (error) {
      message.error(`Reset failed: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error': return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'warning': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default: return <ReloadOutlined spin />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'processing';
    }
  };

  useEffect(() => {
    runComprehensiveDiagnostics();
  }, []);

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BugOutlined />
          <span>System Diagnostics</span>
          {lastCheck && (
            <Tag color="blue">
              Last check: {lastCheck.toLocaleTimeString()}
            </Tag>
          )}
        </div>
      }
      extra={
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          loading={isRunning}
          onClick={runComprehensiveDiagnostics}
        >
          Run Diagnostics
        </Button>
      }
    >
      {!systemStatus ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <ReloadOutlined spin style={{ fontSize: 24 }} />
          <p>Running comprehensive system diagnostics...</p>
        </div>
      ) : (
        <Tabs defaultActiveKey="overview">
          <TabPane tab="Overview" key="overview">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <Card size="small">
                <Statistic
                  title="Backend"
                  value={systemStatus.backend.status}
                  prefix={getStatusIcon(systemStatus.backend.status)}
                  valueStyle={{ color: systemStatus.backend.status === 'success' ? '#3f8600' : '#cf1322' }}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="Endpoints"
                  value={`${systemStatus.endpoints.filter(e => e.status === 'success').length}/${systemStatus.endpoints.length}`}
                  prefix={<SettingOutlined />}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="WebSocket"
                  value={systemStatus.websocket.status}
                  prefix={getStatusIcon(systemStatus.websocket.status)}
                  valueStyle={{ color: systemStatus.websocket.status === 'success' ? '#3f8600' : '#cf1322' }}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="WebRTC"
                  value={systemStatus.webrtc.status}
                  prefix={<SoundOutlined />}
                  valueStyle={{ color: systemStatus.webrtc.status === 'success' ? '#3f8600' : '#cf1322' }}
                />
              </Card>
            </div>

            {/* Critical Issues Alert */}
            {systemStatus.callSync.status === 'error' && (
              <Alert
                message="🚨 CRITICAL: Call Synchronization Service Not Deployed"
                description={systemStatus.callSync.fix}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                action={
                  <Button size="small" danger>
                    This is why audio doesn't work!
                  </Button>
                }
              />
            )}

            {systemStatus.backend.status === 'error' && (
              <Alert
                message="🚨 Backend Connection Failed"
                description={systemStatus.backend.fix}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </TabPane>

          <TabPane tab="Endpoints" key="endpoints">
            <Table
              dataSource={systemStatus.endpoints}
              columns={[
                {
                  title: 'Endpoint',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => (
                    <Badge 
                      status={getStatusColor(status) as any} 
                      text={status.toUpperCase()} 
                    />
                  ),
                },
                {
                  title: 'Message',
                  dataIndex: 'message',
                  key: 'message',
                },
                {
                  title: 'Fix',
                  dataIndex: 'fix',
                  key: 'fix',
                  render: (fix) => fix ? <Tag color="orange">{fix}</Tag> : '-',
                },
              ]}
              pagination={false}
              size="small"
            />
          </TabPane>

          <TabPane tab="WebRTC" key="webrtc">
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {getStatusIcon(systemStatus.webrtc.status)}
                <strong>{systemStatus.webrtc.message}</strong>
              </div>
              
              {systemStatus.webrtc.details && (
                <div>
                  <p><strong>getUserMedia:</strong> {systemStatus.webrtc.details.getUserMedia}</p>
                  <p><strong>RTCPeerConnection:</strong> {systemStatus.webrtc.details.RTCPeerConnection}</p>
                  <p><strong>STUN Servers:</strong> {systemStatus.webrtc.details.STUNServers}</p>
                </div>
              )}

              {systemStatus.webrtc.fix && (
                <Alert message={systemStatus.webrtc.fix} type="warning" style={{ marginTop: 16 }} />
              )}
            </Card>
          </TabPane>

          <TabPane tab="Agents" key="agents">
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {getStatusIcon(systemStatus.agents.status)}
                <strong>{systemStatus.agents.message}</strong>
                <Button size="small" onClick={fixAgent}>
                  Reset Agent Status
                </Button>
              </div>

              {systemStatus.agents.details?.agents && (
                <Table
                  dataSource={systemStatus.agents.details.agents}
                  columns={[
                    { title: 'Username', dataIndex: 'username', key: 'username' },
                    { 
                      title: 'Status', 
                      dataIndex: 'status', 
                      key: 'status',
                      render: (status) => (
                        <Tag color={status === 'online' ? 'green' : 'red'}>
                          {status.toUpperCase()}
                        </Tag>
                      )
                    },
                    { title: 'Current Calls', dataIndex: 'currentCalls', key: 'currentCalls' },
                    { title: 'Max Calls', dataIndex: 'maxCalls', key: 'maxCalls' },
                  ]}
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          </TabPane>

          <TabPane tab="Call Sync" key="callsync">
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {getStatusIcon(systemStatus.callSync.status)}
                <strong>{systemStatus.callSync.message}</strong>
              </div>

              {systemStatus.callSync.fix && (
                <Alert 
                  message="Call Synchronization Issue" 
                  description={systemStatus.callSync.fix}
                  type={systemStatus.callSync.status === 'error' ? 'error' : 'warning'}
                  style={{ marginTop: 16 }}
                />
              )}

              {systemStatus.callSync.details && (
                <div style={{ marginTop: 16 }}>
                  <Progress 
                    percent={(systemStatus.callSync.details.workingEndpoints / systemStatus.callSync.details.totalEndpoints) * 100}
                    status={systemStatus.callSync.status === 'success' ? 'success' : 'exception'}
                  />
                  <p style={{ marginTop: 8 }}>
                    {systemStatus.callSync.details.workingEndpoints} of {systemStatus.callSync.details.totalEndpoints} sync endpoints working
                  </p>
                </div>
              )}
            </Card>
          </TabPane>
        </Tabs>
      )}
    </Card>
  );
};

export default SystemDiagnostics;
