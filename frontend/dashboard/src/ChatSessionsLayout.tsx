import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Avatar, Badge, Dropdown, Menu, Tooltip, Modal, Drawer, List, Tag, Divider, message, Select } from 'antd';
import { MoreOutlined, SendOutlined, PaperClipOutlined, SmileOutlined, SearchOutlined, UserOutlined, DownloadOutlined, MessageOutlined, ClockCircleOutlined, GlobalOutlined, PhoneOutlined, MailOutlined, FileTextOutlined, SettingOutlined, FormOutlined } from '@ant-design/icons';
import { Tag as AntTag } from 'antd';

// Types for props
interface ChatSession {
  sessionId: string;
  visitorId: string;
  pageUrl: string;
  startedAt: string;
  unreadCount?: number;
  lastMessage?: string;
  lastTimestamp?: string;
  avatarUrl?: string;
  status?: 'unread' | 'replied' | 'contacted';
  visitorInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    browser?: string;
    device?: string;
    previousChats?: number;
    totalTime?: string;
  };
  assignedAgent?: string;
  escalated?: boolean;
  rating?: number | null;
}

interface ChatMessage {
  from: string;
  message: string;
  timestamp: string;
}

interface QuickReply {
  id: string;
  title: string;
  message: string;
  category: string;
}

interface ChatSessionsLayoutProps {
  sessions: ChatSession[];
  activeChat: string | null;
  messages: Record<string, ChatMessage[]>;
  onSelectSession: (sessionId: string) => void;
  onSendMessage: (msg: string) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  agentUsername: string;
  onEscalateChat?: (sessionId: string) => void;
  cannedResponses?: QuickReply[];
}

const statusColor = {
  unread: '#F44336', // red
  replied: '#4CAF50', // green
  contacted: '#FF9800', // orange
};

// Quick Reply Templates
export default function ChatSessionsLayout({
  sessions,
  activeChat,
  messages,
  onSelectSession,
  onSendMessage,
  chatInput,
  setChatInput,
  agentUsername,
  onEscalateChat,
  cannedResponses,
}: ChatSessionsLayoutProps) {
  // Find active session
  const activeSession = sessions.find(s => s.sessionId === activeChat);
  const chatMsgs = activeChat ? messages[activeChat] || [] : [];

  // New state for features
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{message: ChatMessage, index: number}[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showVisitorInfo, setShowVisitorInfo] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Internal Notes state (frontend only)
  const [notes, setNotes] = useState<Record<string, { text: string; author: string; timestamp: string }[]>>({});
  const [noteInput, setNoteInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');

  // Tagging state (frontend only)
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [tagInput, setTagInput] = useState<string[]>([]);
  const tagOptions = ['#VIP', '#complaint', '#followup', '#sales', '#support', '#escalated', '#spam', '#other'];

  // Handle tag change
  const handleTagChange = (newTags: string[]) => {
    if (!activeChat) return;
    setTags(prev => ({ ...prev, [activeChat]: newTags }));
    setTagInput(newTags);
  };

  // Sync tag input with active chat
  useEffect(() => {
    if (activeChat) {
      setTagInput(tags[activeChat] || []);
    }
  }, [activeChat]);

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !activeChat) {
      setSearchResults([]);
      return;
    }
    
    const results = chatMsgs
      .map((msg, index) => ({ message: msg, index }))
      .filter(({ message }) => 
        message.message.toLowerCase().includes(query.toLowerCase()) ||
        message.from.toLowerCase().includes(query.toLowerCase())
      );
    setSearchResults(results);
  };

  // Quick reply functionality
  const handleQuickReply = (reply: QuickReply) => {
    setChatInput(reply.message);
    setShowQuickReplies(false);
  };

  // Add note handler
  const handleAddNote = () => {
    if (!activeChat || !noteInput.trim()) return;
    setNotes(prev => ({
      ...prev,
      [activeChat]: [
        ...(prev[activeChat] || []),
        { text: noteInput.trim(), author: agentUsername, timestamp: new Date().toISOString() },
      ],
    }));
    setNoteInput('');
  };

  // Export chat transcript
  const exportTranscript = () => {
    if (!activeChat || !activeSession) return;
    
    const transcript = `Chat Transcript - ${activeSession.visitorId}
Session ID: ${activeChat}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

${chatMsgs.map(msg => `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.from}: ${msg.message}`).join('\n')}
    `;
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-transcript-${activeSession.visitorId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('Chat transcript exported successfully!');
  };

  // Scroll to search result
  const scrollToMessage = (index: number) => {
    const messageElements = chatContainerRef.current?.querySelectorAll('.chat-message');
    if (messageElements && messageElements[index]) {
      messageElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElements[index].classList.add('highlight-message');
      setTimeout(() => {
        messageElements[index].classList.remove('highlight-message');
      }, 2000);
    }
  };

  // Use admin-managed canned responses if provided, else fallback
  const quickReplies: QuickReply[] = cannedResponses && cannedResponses.length > 0 ? cannedResponses : [
    { id: '1', title: 'Greeting', message: 'Hello! How can I help you today?', category: 'General' },
    { id: '2', title: 'Thank You', message: 'Thank you for contacting us. Is there anything else I can help you with?', category: 'General' },
    { id: '3', title: 'Hold On', message: 'Please hold on for a moment while I check that information for you.', category: 'General' },
    { id: '4', title: 'Transfer', message: 'I\'ll transfer you to a specialist who can better assist you with this matter.', category: 'General' },
    { id: '5', title: 'Pricing Info', message: 'Our pricing starts at $29/month. Would you like me to send you our detailed pricing guide?', category: 'Sales' },
    { id: '6', title: 'Technical Support', message: 'I understand you\'re having technical issues. Let me help you troubleshoot this step by step.', category: 'Support' },
    { id: '7', title: 'Follow Up', message: 'I\'ll follow up with you within 24 hours to ensure everything is resolved to your satisfaction.', category: 'Support' },
    { id: '8', title: 'Closing', message: 'Thank you for choosing our service. Have a great day!', category: 'General' },
  ];

  // Filter quick replies by category
  const filteredQuickReplies = selectedCategory === 'All' 
    ? quickReplies 
    : quickReplies.filter(reply => reply.category === selectedCategory);

  const categories = ['All', ...Array.from(new Set(quickReplies.map(reply => reply.category)))];

  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState('email');
  const [customFields, setCustomFields] = useState([{ label: '', type: 'text', required: true }]);
  const [formLoading, setFormLoading] = useState(false);

  const handlePushForm = async () => {
    if (!activeChat) return;
    setFormLoading(true);
    const companyId = 'demo-company-001'; // Hardcoded for dev
    let fields = [];
    if (formType === 'email') fields = [{ label: 'Email', type: 'email', required: true }];
    else if (formType === 'phone') fields = [{ label: 'Phone', type: 'text', required: true }];
    else fields = customFields;
    const res = await fetch('http://localhost:5000/api/form-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        sessionId: activeChat,
        from: agentUsername,
        type: formType,
        fields
      })
    });
    if (res.ok) {
      message.success('Form pushed to chat!');
      setShowFormModal(false);
      setFormType('email');
      setCustomFields([{ label: '', type: 'text', required: true }]);
    } else {
      message.error('Failed to push form');
    }
    setFormLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '70vh', background: '#f7fafd', borderRadius: 20, boxShadow: '0 4px 24px #2E73FF11', overflow: 'hidden' }}>
      {/* Session List */}
      <div style={{ width: 320, background: '#2e326f', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8eaf6' }}>
        <div style={{ padding: 24, fontWeight: 700, fontSize: 20, borderBottom: '1px solid #e8eaf6', background: '#2e326f' }}>
          All chats <span style={{ fontWeight: 400, fontSize: 16, opacity: 0.7 }}>({sessions.length})</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.map(session => (
            <div
              key={session.sessionId}
              onClick={() => onSelectSession(session.sessionId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                background: activeChat === session.sessionId ? '#fff' : 'transparent',
                color: activeChat === session.sessionId ? '#2e326f' : '#fff',
                cursor: 'pointer',
                borderLeft: activeChat === session.sessionId ? '4px solid #2E73FF' : '4px solid transparent',
                transition: 'background 0.2s, color 0.2s',
                position: 'relative',
              }}
            >
              <Badge dot={!!session.unreadCount} offset={[-6, 32]}>
                <Avatar src={session.avatarUrl} size={40} style={{ background: '#e3e6f3', color: '#2e326f', fontWeight: 700 }}>
                  {session.visitorId?.[0]?.toUpperCase() || '?'}
                </Avatar>
              </Badge>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {session.visitorId}
                  {session.status && (
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor[session.status], display: 'inline-block' }} />
                  )}
                  {/* Show escalated badge in session list */}
                  {session.escalated && (
                    <span style={{ marginTop: 4, fontSize: 12, color: '#E74A3B', fontWeight: 700, marginLeft: 4 }}>Escalated</span>
                  )}
                </div>
                <div style={{ fontSize: 14, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.lastMessage}</div>
                {/* Show rating in session list */}
                {typeof session.rating === 'number' && (
                  <div style={{ marginTop: 4, fontSize: 13 }}>
                    {[1,2,3,4,5].map(star => (
                      <span key={star} style={{ color: session.rating >= star ? '#FFD700' : '#e0e0e0', fontSize: 16 }}>&#9733;</span>
                    ))}
                  </div>
                )}
                {/* Show tags in session list */}
                <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(tags[session.sessionId] || []).map(tag => (
                    <AntTag key={tag} color="blue" style={{ borderRadius: 4, fontSize: 12 }}>{tag}</AntTag>
                  ))}
                </div>
                {/* Show assigned agent */}
                {typeof session.assignedAgent !== 'undefined' && (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#00e6ef' }}>
                    Assigned: {session.assignedAgent || 'Unassigned'}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, minWidth: 60, textAlign: 'right' }}>{session.lastTimestamp}</div>
              <Dropdown overlay={<Menu items={[{ key: 'archive', label: 'Archive' }, { key: 'delete', label: 'Delete' }]} />} trigger={['click']}>
                <Button type="text" icon={<MoreOutlined />} style={{ color: activeChat === session.sessionId ? '#2e326f' : '#fff' }} />
              </Dropdown>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {/* Header */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid #e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{activeSession?.visitorId || 'Select a chat'}</div>
              <div style={{ fontSize: 14, color: '#888' }}>{activeSession?.pageUrl}</div>
              {/* Show rating in chat header */}
              {typeof activeSession?.rating === 'number' && (
                <div style={{ marginTop: 8, fontSize: 18 }}>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} style={{ color: activeSession.rating >= star ? '#FFD700' : '#e0e0e0', fontSize: 22 }}>&#9733;</span>
                  ))}
                </div>
              )}
              {/* Show tags in chat header */}
              {activeChat && (
                <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(tags[activeChat] || []).map(tag => (
                    <AntTag key={tag} color="blue" style={{ borderRadius: 4, fontSize: 13 }}>{tag}</AntTag>
                  ))}
                  {/* Show escalated badge in chat header */}
                  {activeSession?.escalated && (
                    <span style={{ marginTop: 8, fontSize: 13, color: '#E74A3B', fontWeight: 700, marginLeft: 8 }}>Escalated</span>
                  )}
                </div>
              )}
              {/* Show assigned agent in chat header */}
              {activeSession && typeof activeSession.assignedAgent !== 'undefined' && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#00e6ef' }}>
                  Assigned: {activeSession.assignedAgent || 'Unassigned'}
                </div>
              )}
            </div>
            {activeSession && (
              <Button 
                type="text" 
                icon={<UserOutlined />} 
                onClick={() => setShowVisitorInfo(true)}
                style={{ borderRadius: 8 }}
                title="Visitor Information"
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tooltip title="Search messages">
              <Button 
                type="text" 
                icon={<SearchOutlined />} 
                onClick={() => setSearchQuery('')}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
            <Tooltip title="Quick replies">
              <Button 
                type="text" 
                icon={<MessageOutlined />} 
                onClick={() => setShowQuickReplies(true)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
            <Tooltip title="Export transcript">
              <Button 
                type="text" 
                icon={<DownloadOutlined />} 
                onClick={exportTranscript}
                disabled={!activeChat || chatMsgs.length === 0}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
            {/* Escalate button for agents */}
            {onEscalateChat && activeSession && !activeSession.escalated && (
              <Tooltip title="Escalate to Supervisor/Admin">
                <Button type="primary" danger onClick={() => onEscalateChat(activeSession.sessionId)} style={{ borderRadius: 8, fontWeight: 600 }}>Escalate</Button>
              </Tooltip>
            )}
            <Tooltip title="More options">
              <Button type="text" icon={<MoreOutlined />} style={{ borderRadius: 8 }} />
            </Tooltip>
          </div>
        </div>
        {/* Tab Switcher */}
        {activeChat && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e8eaf6', background: '#f7fafd', padding: '0 32px' }}>
            <Button type={activeTab === 'chat' ? 'primary' : 'text'} onClick={() => setActiveTab('chat')} style={{ borderRadius: 8, fontWeight: 600, marginRight: 8 }}>Chat</Button>
            <Button type={activeTab === 'notes' ? 'primary' : 'text'} onClick={() => setActiveTab('notes')} style={{ borderRadius: 8, fontWeight: 600 }}>Notes</Button>
          </div>
        )}
        {/* Tag Input */}
        {activeChat && (
          <div style={{ padding: '12px 32px', background: '#f0f2f5', borderBottom: '1px solid #e8eaf6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Select
              mode="tags"
              style={{ minWidth: 200, borderRadius: 8 }}
              placeholder="Add tags..."
              value={tagInput}
              onChange={handleTagChange}
              options={tagOptions.map(tag => ({ label: tag, value: tag }))}
              tokenSeparators={[',', ' ']}
              maxTagCount={4}
              allowClear
            />
          </div>
        )}
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <>
            {/* Search Bar */}
            {searchQuery !== '' && (
              <div style={{ padding: '12px 32px', background: '#f0f2f5', borderBottom: '1px solid #e8eaf6' }}>
                <Input.Search
                  placeholder="Search in messages..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  onClear={() => { setSearchQuery(''); setSearchResults([]); }}
                  style={{ borderRadius: 8 }}
                  allowClear
                />
                {searchResults.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    Found {searchResults.length} result(s)
                    {searchResults.slice(0, 3).map((result, idx) => (
                      <Button 
                        key={idx} 
                        type="link" 
                        size="small" 
                        onClick={() => scrollToMessage(result.index)}
                        style={{ padding: '0 8px', height: 'auto', fontSize: 12 }}
                      >
                        "{result.message.message.substring(0, 30)}..."
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Chat Bubbles */}
            <div 
              ref={chatContainerRef}
              style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: '#f7fafd' }}
            >
              {chatMsgs.length === 0 && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 80 }}>No messages yet.</div>}
              {chatMsgs.map((msg, i) => (
                <div key={i} className="chat-message" style={{ display: 'flex', flexDirection: msg.from === agentUsername ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: 24 }}>
                  <Avatar style={{ background: msg.from === agentUsername ? '#2E73FF' : '#e3e6f3', color: msg.from === agentUsername ? '#fff' : '#2e326f', margin: msg.from === agentUsername ? '0 0 0 16px' : '0 16px 0 0' }}>
                    {msg.from?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                  <div style={{ maxWidth: 420, marginLeft: msg.from === agentUsername ? 0 : 8, marginRight: msg.from === agentUsername ? 8 : 0 }}>
                    <div style={{
                      background: msg.from === agentUsername ? '#2E73FF' : '#fff',
                      color: msg.from === agentUsername ? '#fff' : '#222',
                      borderRadius: msg.from === agentUsername ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '12px 20px',
                      fontSize: 16,
                      fontWeight: 500,
                      boxShadow: '0 2px 8px rgba(46,115,255,0.08)',
                      marginBottom: 4,
                      wordBreak: 'break-word',
                    }}>{msg.message}</div>
                    <div style={{ fontSize: 12, color: '#aaa', textAlign: msg.from === agentUsername ? 'right' : 'left' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Message Input */}
            {activeChat && (
              <div style={{ padding: '20px 32px', borderTop: '1px solid #e8eaf6', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Input.TextArea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ borderRadius: 12, flex: 1, resize: 'none', background: '#f7fafd' }}
                  onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); onSendMessage(chatInput); } }}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={() => onSendMessage(chatInput)} disabled={!chatInput.trim()} style={{ borderRadius: 12, fontWeight: 600, height: 40 }}>
                  Send
                </Button>
                <Button icon={<FormOutlined />} onClick={() => setShowFormModal(true)} style={{ borderRadius: 12, height: 40 }} />
                <Button icon={<PaperClipOutlined />} style={{ borderRadius: 12, height: 40 }} />
                <Button icon={<SmileOutlined />} style={{ borderRadius: 12, height: 40 }} />
              </div>
            )}
          </>
        )}
        {/* Notes Tab */}
        {activeTab === 'notes' && activeChat && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', padding: '32px 40px' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Internal Notes</div>
            <div style={{ marginBottom: 16 }}>
              <Input.TextArea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Add a private note..."
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ borderRadius: 8, marginBottom: 8 }}
                onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
              />
              <Button type="primary" onClick={handleAddNote} disabled={!noteInput.trim()} style={{ borderRadius: 8, fontWeight: 600 }}>Add Note</Button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', background: '#f7fafd', borderRadius: 8, padding: 16 }}>
              {(notes[activeChat] || []).length === 0 && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 32 }}>No notes yet.</div>}
              {(notes[activeChat] || []).map((note, idx) => (
                <div key={idx} style={{ marginBottom: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #2E73FF11', padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{note.author}</div>
                  <div style={{ fontSize: 15, marginBottom: 4 }}>{note.text}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{new Date(note.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Replies Modal */}
      <Modal
        title="Quick Replies"
        open={showQuickReplies}
        onCancel={() => setShowQuickReplies(false)}
        footer={null}
        width={600}
        style={{ borderRadius: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 200, borderRadius: 8 }}
            options={categories.map(cat => ({ label: cat, value: cat }))}
          />
        </div>
        <List
          dataSource={filteredQuickReplies}
          renderItem={reply => (
            <List.Item
              style={{ 
                padding: '12px 16px', 
                borderRadius: 8, 
                marginBottom: 8, 
                background: '#f7fafd',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => handleQuickReply(reply)}
              onMouseEnter={e => e.currentTarget.style.background = '#e8f1ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#f7fafd'}
            >
              <List.Item.Meta
                title={reply.title}
                description={reply.message}
              />
              <Tag color="blue" style={{ borderRadius: 4 }}>{reply.category}</Tag>
            </List.Item>
          )}
        />
      </Modal>

      {/* Visitor Information Drawer */}
      <Drawer
        title="Visitor Information"
        placement="right"
        onClose={() => setShowVisitorInfo(false)}
        open={showVisitorInfo}
        width={400}
        style={{ borderRadius: 16 }}
      >
        {activeSession && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} src={activeSession.avatarUrl} style={{ background: '#2E73FF', color: '#fff', fontWeight: 700, fontSize: 32 }}>
                {activeSession.visitorId?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}>{activeSession.visitorId}</div>
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GlobalOutlined /> Current Page
              </div>
              <div style={{ color: '#666', fontSize: 14 }}>{activeSession.pageUrl || 'Unknown'}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleOutlined /> Session Started
              </div>
              <div style={{ color: '#666', fontSize: 14 }}>
                {activeSession.startedAt ? new Date(activeSession.startedAt).toLocaleString() : 'Unknown'}
              </div>
            </div>

            {activeSession.visitorInfo && (
              <>
                <Divider />
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserOutlined /> Contact Info
                  </div>
                  {activeSession.visitorInfo.email && (
                    <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MailOutlined style={{ color: '#666' }} />
                      <span style={{ color: '#666', fontSize: 14 }}>{activeSession.visitorInfo.email}</span>
                    </div>
                  )}
                  {activeSession.visitorInfo.phone && (
                    <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PhoneOutlined style={{ color: '#666' }} />
                      <span style={{ color: '#666', fontSize: 14 }}>{activeSession.visitorInfo.phone}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SettingOutlined /> Technical Info
                  </div>
                  {activeSession.visitorInfo.browser && (
                    <div style={{ marginBottom: 4, color: '#666', fontSize: 14 }}>
                      Browser: {activeSession.visitorInfo.browser}
                    </div>
                  )}
                  {activeSession.visitorInfo.device && (
                    <div style={{ marginBottom: 4, color: '#666', fontSize: 14 }}>
                      Device: {activeSession.visitorInfo.device}
                    </div>
                  )}
                  {activeSession.visitorInfo.location && (
                    <div style={{ marginBottom: 4, color: '#666', fontSize: 14 }}>
                      Location: {activeSession.visitorInfo.location}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined /> Chat History
                  </div>
                  <div style={{ color: '#666', fontSize: 14 }}>
                    Previous chats: {activeSession.visitorInfo.previousChats || 0}
                  </div>
                  {activeSession.visitorInfo.totalTime && (
                    <div style={{ color: '#666', fontSize: 14 }}>
                      Total time: {activeSession.visitorInfo.totalTime}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* Push Form Modal */}
      <Modal
        title="Push Form to Chat"
        open={showFormModal}
        onCancel={() => setShowFormModal(false)}
        onOk={handlePushForm}
        okText="Push Form"
        confirmLoading={formLoading}
        style={{ borderRadius: 16 }}
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Select value={formType} onChange={setFormType} style={{ width: 180, borderRadius: 8 }}>
            <Select.Option value="email">Email</Select.Option>
            <Select.Option value="phone">Phone</Select.Option>
            <Select.Option value="custom">Custom</Select.Option>
          </Select>
        </div>
        {formType === 'custom' && (
          <div>
            {customFields.map((field, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input
                  value={field.label}
                  onChange={e => setCustomFields(fields => fields.map((f, i) => i === idx ? { ...f, label: e.target.value } : f))}
                  placeholder="Field Label"
                  style={{ borderRadius: 8, flex: 2 }}
                />
                <Select
                  value={field.type}
                  onChange={val => setCustomFields(fields => fields.map((f, i) => i === idx ? { ...f, type: val } : f))}
                  style={{ borderRadius: 8, flex: 1 }}
                >
                  <Select.Option value="text">Text</Select.Option>
                  <Select.Option value="email">Email</Select.Option>
                  <Select.Option value="number">Number</Select.Option>
                </Select>
                <Select
                  value={field.required ? 'required' : 'optional'}
                  onChange={val => setCustomFields(fields => fields.map((f, i) => i === idx ? { ...f, required: val === 'required' } : f))}
                  style={{ borderRadius: 8, flex: 1 }}
                >
                  <Select.Option value="required">Required</Select.Option>
                  <Select.Option value="optional">Optional</Select.Option>
                </Select>
                <Button danger onClick={() => setCustomFields(fields => fields.filter((_, i) => i !== idx))} style={{ borderRadius: 8 }}>Remove</Button>
              </div>
            ))}
            <Button onClick={() => setCustomFields(fields => [...fields, { label: '', type: 'text', required: true }])} style={{ borderRadius: 8, marginTop: 8 }}>Add Field</Button>
          </div>
        )}
      </Modal>
    </div>
  );
} 