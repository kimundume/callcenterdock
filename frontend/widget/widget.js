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
  
  // Get company UUID from widget configuration
  const getCompanyUuid = () => {
    // Check if widget config is available
    if (window.CallDockerWidget && window.CallDockerWidget.config && window.CallDockerWidget.config.uuid) {
      return window.CallDockerWidget.config.uuid;
    }
    // Fallback to global variable or correct CallDocker UUID
    return window.CALLDOCKER_COMPANY_UUID || 'calldocker-company-uuid';
  };

  let socket = null;
  let peerConnection = null;
  let localStream = null;
  let remoteAudio = null;
  let agentSocketId = null;
  let isMuted = false;
  let endCallBtn = null;
  let muteBtn = null;
  let currentModal = null;
  let currentSessionId = null;

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
        companyUuid: getCompanyUuid(),
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
          startRealCall(data.sessionId, data.agent);
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
        companyUuid: getCompanyUuid(),
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

  function startChatSession(sessionId, agentName) {
    console.log('[Widget] Starting chat session:', sessionId, 'with agent:', agentName);
    
    // Load Socket.IO and establish connection
    loadSocketIo(() => {
      socket = io(BACKEND_URL);
      
      socket.on('connect', () => {
        console.log('[Widget] Socket connected for chat session');
        
        // Join the session room for form:push events
        socket.emit('join-room', { room: `session-${sessionId}` });
        console.log('[Widget] Joined session room for form:push:', `session-${sessionId}`);
        
        // Join the chat room
        socket.emit('chat:join', {
          sessionId: sessionId,
          companyUuid: getCompanyUuid(),
          visitorId: getVisitorId(),
          pageUrl: window.location.href
        });
        
        // Set up socket listeners for chat and form:push
        setupSocketListeners();
      });
      
      socket.on('connect_error', (error) => {
        console.error('[Widget] Socket connection error:', error);
        updateChatStatus('Connection error - please try again');
      });
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

  // startRealCall - WORKING VERSION for two-way audio
  async function startRealCall(sessionId, agentName) {
    console.log("[IVRChatWidget] Starting WebRTC for session:", sessionId);
    currentSessionId = sessionId; // store for mute events

    // ensure socket.io library loaded and socket connected
    await new Promise((resolve, reject) => {
      loadSocketIo(() => {
        try {
          socket = io(BACKEND_URL);
          socket.on('connect', () => {
            console.log('[WebRTC] Socket connected, socket ID:', socket.id);
            socket.emit('join-room', { room: `session-${sessionId}` });
            console.log('[WebRTC] Joined session room:', `session-${sessionId}`);
            setupSocketListeners();
            resolve();
          });
          socket.on('connect_error', (err) => {
            console.error('[WebRTC] Socket connect error', err);
            reject(err);
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    // Create peer connection with ICE servers
    peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
          urls: [
            "stun:102.68.86.104:3478",
            "turn:102.68.86.104:3478?transport=udp",
            "turn:102.68.86.104:3478?transport=tcp"
          ],
          username: "mindfirm",
          credential: "superSecret123"
        }
      ]
    });

    // Get local microphone stream
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
      console.log("[IVRChatWidget] Local stream tracks:", localStream.getTracks());
      isMuted = false;
      if (muteBtn) muteBtn.innerText = 'Mute';
    } catch (err) {
      console.error('[WebRTC] getUserMedia error', err);
      updateStatus('Microphone access denied or unavailable.');
      if (endCallBtn) endCallBtn.disabled = true;
      if (muteBtn) muteBtn.disabled = true;
      return;
    }

    // Create remote audio element
    if (!remoteAudio) {
      remoteAudio = document.createElement('audio');
      remoteAudio.id = 'remoteAudio';
      remoteAudio.autoplay = true;
      remoteAudio.controls = false;
      remoteAudio.style.display = 'none';
      remoteAudio.playsInline = true;
      document.body.appendChild(remoteAudio);
    }

    // Handle remote audio track
    peerConnection.ontrack = event => {
      console.log("[IVRChatWidget] Remote track received:", event.streams[0]);
      const audioEl = document.getElementById("remoteAudio");
      if (audioEl) {
        audioEl.srcObject = event.streams[0];
        audioEl.play().catch(e => console.error("Audio play failed:", e));
      }
    };

    // ICE candidates
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        console.log("[IVRChatWidget] Sending ICE candidate:", event.candidate);
        socket.emit("ice-candidate", { sessionId, candidate: event.candidate });
      }
    };

    // Connection state monitoring
    peerConnection.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'connected') {
        updateStatus('Call connected - Audio active');
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', peerConnection.connectionState);
    };

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("[IVRChatWidget] Sending WebRTC offer:", offer.sdp);
      socket.emit("webrtc-offer", { sessionId, agent: agentName, sdp: offer });
    } catch (err) {
      console.error('[WebRTC] Error creating/sending offer:', err);
    }

    console.log('[WebRTC] WebRTC setup completed');
  }
  
  function setupSocketListeners() {
    // Clean up existing listeners
    socket.off('webrtc-answer');
    socket.off('ice-candidate');
    
    // Handle incoming answer from agent
    socket.on('webrtc-answer', async (data) => {
      console.log('[WebRTC] Received answer:', data);
      if (peerConnection && data && data.sdp) {
        try {
          const answer = new RTCSessionDescription(data.sdp);
          await peerConnection.setRemoteDescription(answer);
          console.log('[WebRTC] Set remote description from answer');
        } catch (err) {
          console.error('[WebRTC] Error setting remote description:', err);
        }
      } else {
        console.warn('[WebRTC] Answer missing or peerConnection not initialized', !!peerConnection, data);
      }
    });

    // Handle incoming ICE candidates from agent
    socket.on('ice-candidate', async (data) => {
      console.log('[WebRTC] Received ICE candidate:', data);
      if (peerConnection && data && data.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('[WebRTC] Added ICE candidate');
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      }
    });
    
    // Listen for call status updates
    socket.on('call-status', (data) => {
      console.log('[WebRTC] Call status update:', data);
      if (data.status === 'accepted') {
        updateStatus('Call accepted by agent');
      } else if (data.status === 'rejected') {
        updateStatus('Call rejected by agent');
        endCall();
      }
    });
    
    // Listen for form push from agent
    socket.on('form:push', (formData) => {
      console.log('[Widget] Received form push from agent:', formData);
      showFormToVisitor(formData);
    });
  }
  
  function showFormToVisitor(formData) {
    console.log('[Widget] Showing form to visitor:', formData);
    
    // Create form modal
    const formModal = document.createElement('div');
    formModal.className = 'calldocker-modal';
    formModal.style = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    const formContent = document.createElement('div');
    formContent.style = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    const formTitle = document.createElement('h3');
    formTitle.textContent = 'Agent Request';
    formTitle.style = 'margin: 0 0 20px 0; color: #333; font-size: 18px;';
    
    const formDescription = document.createElement('p');
    formDescription.textContent = 'The agent has requested some information from you:';
    formDescription.style = 'margin: 0 0 20px 0; color: #666; font-size: 14px;';
    
    const form = document.createElement('form');
    form.style = 'display: flex; flex-direction: column; gap: 15px;';
    
    // Create form fields
    formData.fields.forEach((field, index) => {
      const fieldContainer = document.createElement('div');
      
      const label = document.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      label.style = 'font-weight: 500; color: #333; font-size: 14px;';
      
      const input = document.createElement('input');
      input.type = field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text';
      input.required = field.required;
      input.style = `
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        margin-top: 5px;
      `;
      
      fieldContainer.appendChild(label);
      fieldContainer.appendChild(input);
      form.appendChild(fieldContainer);
    });
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style = 'display: flex; gap: 10px; margin-top: 20px;';
    
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Submit';
    submitBtn.type = 'submit';
    submitBtn.style = `
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.style = `
      padding: 10px 20px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    
    // Handle form submission
    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const formValues = {};
      const inputs = form.querySelectorAll('input');
      inputs.forEach((input, index) => {
        formValues[formData.fields[index].label] = input.value;
      });
      
      console.log('[Widget] Form submitted:', formValues);
      
      // Send form response to backend
      try {
        const response = await fetch(BACKEND_URL + '/api/form-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: formData.companyId,
            sessionId: formData.sessionId,
            formId: formData._id,
            from: 'visitor',
            values: formValues
          })
        });
        
        if (response.ok) {
          console.log('[Widget] Form response sent successfully');
          document.body.removeChild(formModal);
          // Show success message
          const successMsg = document.createElement('div');
          successMsg.textContent = 'Form submitted successfully!';
          successMsg.style = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            z-index: 10001;
            font-size: 14px;
          `;
          document.body.appendChild(successMsg);
          setTimeout(() => document.body.removeChild(successMsg), 3000);
        } else {
          throw new Error('Failed to submit form');
        }
      } catch (error) {
        console.error('[Widget] Form submission error:', error);
        alert('Failed to submit form. Please try again.');
      }
    };
    
    // Handle cancel
    cancelBtn.onclick = () => {
      document.body.removeChild(formModal);
    };
    
    buttonContainer.appendChild(submitBtn);
    buttonContainer.appendChild(cancelBtn);
    form.appendChild(buttonContainer);
    
    formContent.appendChild(formTitle);
    formContent.appendChild(formDescription);
    formContent.appendChild(form);
    
    formModal.appendChild(formContent);
    document.body.appendChild(formModal);
  }

  function endCall() {
    console.log("[Call] Ending call...");
    try {
      if (peerConnection) {
        // Stop all local tracks
        peerConnection.getSenders().forEach(sender => {
          try { sender.track && sender.track.stop(); } catch(e) {}
        });
        peerConnection.close();
        peerConnection = null;
      }
      if (localStream) {
        localStream.getTracks().forEach(t => { try { t.stop(); } catch(e) {} });
        localStream = null;
      }
      if (socket) {
        // Clean up socket listeners
        socket.off("webrtc-offer");
        socket.off("webrtc-answer");
        socket.off("ice-candidate");
        socket.disconnect();
        socket = null;
      }
      if (remoteAudio && remoteAudio.parentNode) {
        remoteAudio.srcObject = null;
        remoteAudio.remove();
        remoteAudio = null;
      }
      document.querySelectorAll('.calldocker-modal').forEach(el => el.remove());
      updateStatus('Call ended');
    } catch (err) {
      console.error('endCall error', err);
    }
  }

  function toggleMute() {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    if (socket) socket.emit('visitor-mute', { sessionId: currentSessionId, isMuted });
    muteBtn.innerText = isMuted ? 'Unmute' : 'Mute';
  }

  // Widget initialization function
  function init(config, widgetId) {
    console.log('[Widget] Initializing with config:', config);
    
    // Store config globally
    window.CallDockerWidget = window.CallDockerWidget || {};
    window.CallDockerWidget.config = config;
    window.CallDockerWidget.widgetId = widgetId;
    
    // Create widget with custom styling
    const callBtn = document.createElement('button');
    callBtn.innerText = config.text || 'Call Us';
    callBtn.style = `
      position: fixed; 
      bottom: 20px; 
      right: 20px; 
      z-index: 9999; 
      padding: 12px 24px; 
      background: ${config.color || '#007bff'}; 
      color: #fff; 
      border: none; 
      border-radius: ${config.shape === 'round' ? '24px' : '8px'}; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
      cursor: pointer; 
      font-size: 16px;
      animation: ${config.animation || 'none'};
    `;
    callBtn.onclick = startCall;
    callBtn.id = widgetId + '-call';
    document.body.appendChild(callBtn);

    const chatBtn = document.createElement('button');
    chatBtn.innerText = 'Chat Us';
    chatBtn.style = `
      position: fixed; 
      bottom: 20px; 
      right: ${config.position === 'bottom-right' ? '120px' : '20px'}; 
      z-index: 9999; 
      padding: 12px 24px; 
      background: #6c757d; 
      color: #fff; 
      border: none; 
      border-radius: ${config.shape === 'round' ? '24px' : '8px'}; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
      cursor: pointer; 
      font-size: 16px;
      animation: ${config.animation || 'none'};
    `;
    chatBtn.onclick = startChat;
    chatBtn.id = widgetId + '-chat';
    document.body.appendChild(chatBtn);
    
    console.log('[Widget] Widget initialized successfully');
  }

  // Expose init function globally
  window.CallDockerWidget = window.CallDockerWidget || {};
  window.CallDockerWidget.init = init;

  // Auto-initialize if no config is provided (for backward compatibility)
  if (!window.CallDockerWidget.config) {
    loadSocketIo(createWidget);
  }
})(); 