// Embeddable CallDocker Widget
(function() {
  // Dynamic URL detection for production deployment
  const getBackendUrl = () => {
    // Check if we're in development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    
    // Production: Use Render backend URL
    // You can override this by setting window.CALLDOCKER_BACKEND_URL
    return window.CALLDOCKER_BACKEND_URL || 'https://callcenterdock.onrender.com';
  };

  const BACKEND_URL = getBackendUrl();
  const COMPANY_UUID = window.CALLDOCKER_COMPANY_UUID || 'demo-company-uuid'; // ✅ Use correct company UUID

  let socket = null;
  let peerConnection = null;
  let localStream = null;
  let remoteAudio = null;
  let agentSocketId = null;
  let isMuted = false;
  let endCallBtn = null;
  let muteBtn = null;
  let currentModal = null;

  function log(...args) { console.log('[Widget]', ...args); }

  // Generate a unique visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('calldocker_visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('calldocker_visitor_id', visitorId);
    }
    return visitorId;
  }

  function loadSocketIo(callback) {
    if (window.io) return callback();
    var script = document.createElement('script');
    script.src = BACKEND_URL + '/socket.io/socket.io.js';
    script.onload = callback;
    script.onerror = () => {
      console.error('[Widget] Failed to load Socket.IO from:', script.src);
      // Fallback to CDN if backend Socket.IO fails
      var fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
      fallbackScript.onload = callback;
      document.head.appendChild(fallbackScript);
    };
    document.head.appendChild(script);
  }

  function createWidget() {
    const callBtn = document.createElement('button');
    callBtn.innerText = 'Call Us';
    callBtn.style = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 12px 24px; background: #007bff; color: #fff; border: none; border-radius: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; font-size: 16px;';
    callBtn.onclick = startCall;
    document.body.appendChild(callBtn);

    const chatBtn = document.createElement('button');
    chatBtn.innerText = 'Chat Us';
    chatBtn.style = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 12px 24px; background: #6c757d; color: #fff; border: none; border-radius: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; font-size: 16px; margin-right: 10px;';
    chatBtn.onclick = startChat;
    document.body.appendChild(chatBtn);
  }

  function startCall() {
    console.log('[Widget] Call button clicked');
    openCallModal(); // ✅ Show the modal immediately
    
    fetch(BACKEND_URL + '/api/widget/route-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyUuid: COMPANY_UUID,
        visitorId: getVisitorId(),
        pageUrl: window.location.href,
        callType: 'call'
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('[Widget] /route-call response (call):', data);
        if (data.success) {
          updateStatus('Call connected! Agent: ' + data.agent);
          startWebRTC(data.sessionId, data.agent);
        } else {
          updateStatus('Error: ' + (data.error || 'Failed to connect'));
        }
      })
      .catch(error => {
        console.error('[Widget] Failed to start call:', error);
        updateStatus('Network error - please try again');
      });
  }

  function startChat() {
    console.log('[Widget] Chat button clicked');
    openChatModal(); // ✅ Show the chat modal immediately
    
    fetch(BACKEND_URL + '/api/widget/route-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyUuid: COMPANY_UUID,
        visitorId: getVisitorId(),
        pageUrl: window.location.href,
        callType: 'chat'
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('[Widget] /route-call response (chat):', data);
        if (data.success) {
          updateChatStatus('Chat connected! Agent: ' + data.agent);
          startChatSession(data.sessionId, data.agent);
        } else {
          updateChatStatus('Error: ' + (data.error || 'Failed to connect'));
        }
      })
      .catch(error => {
        console.error('[Widget] Failed to start chat:', error);
        updateChatStatus('Network error - please try again');
      });
  }

  function openCallModal() {
    if (currentModal) {
      document.body.removeChild(currentModal);
    }
    
    currentModal = document.createElement('div');
    currentModal.style = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    const box = document.createElement('div');
    box.style = 'background: #fff; padding: 32px; border-radius: 12px; min-width: 320px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.18);';
    box.innerHTML = '<h2>Calling...</h2><div id="calldocker-status">Connecting to agent...</div>';
    
    // Add End Call and Mute buttons
    endCallBtn = document.createElement('button');
    endCallBtn.innerText = 'End Call';
    endCallBtn.style = 'margin: 16px 8px 0 0; padding: 8px 20px; background: #dc3545; color: #fff; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;';
    endCallBtn.onclick = endCall;
    
    muteBtn = document.createElement('button');
    muteBtn.innerText = 'Mute';
    muteBtn.style = 'margin: 16px 0 0 8px; padding: 8px 20px; background: #007bff; color: #fff; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;';
    muteBtn.onclick = toggleMute;
    
    box.appendChild(endCallBtn);
    box.appendChild(muteBtn);
    currentModal.appendChild(box);
    document.body.appendChild(currentModal);
  }

  function openChatModal() {
    if (currentModal) {
      document.body.removeChild(currentModal);
    }
    
    currentModal = document.createElement('div');
    currentModal.style = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    const box = document.createElement('div');
    box.style = 'background: #fff; padding: 32px; border-radius: 12px; min-width: 400px; max-width: 500px; max-height: 600px; display: flex; flex-direction: column; box-shadow: 0 4px 24px rgba(0,0,0,0.18);';
    
    box.innerHTML = `
      <h2 style="margin: 0 0 20px 0;">Chat Support</h2>
      <div id="chat-status" style="margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 6px;">Connecting to agent...</div>
      <div id="chat-messages" style="flex: 1; overflow-y: auto; margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 6px; min-height: 200px; max-height: 300px;"></div>
      <div style="display: flex; gap: 10px;">
        <input type="text" id="chat-input" placeholder="Type your message..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <button id="send-btn" style="padding: 10px 20px; background: #007bff; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Send</button>
      </div>
      <button id="close-chat" style="margin-top: 15px; padding: 8px 20px; background: #6c757d; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Close Chat</button>
    `;
    
    currentModal.appendChild(box);
    document.body.appendChild(currentModal);
    
    // Add event listeners
    document.getElementById('send-btn').onclick = sendChatMessage;
    document.getElementById('close-chat').onclick = closeModal;
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });
  }

  function updateStatus(message) {
    const statusEl = document.getElementById('calldocker-status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function updateChatStatus(message) {
    const statusEl = document.getElementById('chat-status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (message) {
      addChatMessage('You', message);
      input.value = '';
      // Here you would send the message to the backend
      console.log('[Widget] Sending chat message:', message);
    }
  }

  function addChatMessage(sender, message) {
    const messagesEl = document.getElementById('chat-messages');
    if (messagesEl) {
      const messageDiv = document.createElement('div');
      messageDiv.style = 'margin-bottom: 10px; padding: 8px; background: #fff; border-radius: 4px; border-left: 3px solid #007bff;';
      messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
      messagesEl.appendChild(messageDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function closeModal() {
    if (currentModal) {
      document.body.removeChild(currentModal);
      currentModal = null;
    }
  }

  async function startWebRTC() {
    console.log('[WebRTC] startWebRTC called');
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[WebRTC] getUserMedia success', localStream);
      muteBtn.innerText = 'Mute';
      isMuted = false;
    } catch (err) {
      console.error('[WebRTC] getUserMedia error', err);
      document.getElementById('calldocker-status').innerText = 'Microphone access denied or unavailable.';
      endCallBtn.disabled = true;
      muteBtn.disabled = true;
      return;
    }
    peerConnection = new RTCPeerConnection();
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
      console.log('[WebRTC] addTrack', track);
      log('Added local track to peer connection');
    });
    peerConnection.oniceconnectionstatechange = function() {
      console.log('[WebRTC] ICE state:', peerConnection.iceConnectionState);
    };
    peerConnection.ontrack = function(event) {
      console.log('[WebRTC] ontrack', event);
      if (remoteAudio) {
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play().then(() => {
          console.log('[WebRTC] remoteAudio play() success');
        }).catch(e => {
          console.error('[WebRTC] remoteAudio play() error', e);
        });
      }
    };
    peerConnection.onicecandidate = function(event) {
      if (event.candidate) {
        log('Sending ICE candidate', event.candidate);
        socket.emit('webrtc-ice-candidate', {
          toSocketId: agentSocketId,
          candidate: event.candidate
        });
      }
    };
    peerConnection.onconnectionstatechange = function() {
      log('Connection state:', peerConnection.connectionState);
    };
    // Create offer and send to agent
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    log('Created offer, set local description');
    socket.emit('webrtc-offer', {
      toSocketId: agentSocketId,
      offer
    });
  }

  function endCall() {
    if (peerConnection) peerConnection.close();
    if (socket) socket.disconnect();
    if (remoteAudio) document.body.removeChild(remoteAudio);
    document.querySelectorAll('.calldocker-modal').forEach(el => el.remove());
  }

  function toggleMute() {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    muteBtn.innerText = isMuted ? 'Unmute' : 'Mute';
  }

  loadSocketIo(createWidget);
})(); 