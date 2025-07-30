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
  const COMPANY_UUID = window.CALLDOCKER_COMPANY_UUID || 'calldocker-company-uuid';

  let socket = null;
  let peerConnection = null;
  let localStream = null;
  let remoteAudio = null;
  let agentSocketId = null;
  let isMuted = false;
  let endCallBtn = null;
  let muteBtn = null;

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
        // Trigger WebRTC call flow here
        if (data.success) startWebRTC(data.sessionId, data.agent);
      })
      .catch(error => {
        console.error('[Widget] Failed to start call:', error);
        alert('Unable to connect. Please try again later.');
      });
  }

  function startChat() {
    console.log('[Widget] Chat button clicked');
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
        // Trigger chat flow here
        if (data.success) startChatSession(data.sessionId, data.agent);
      })
      .catch(error => {
        console.error('[Widget] Failed to start chat:', error);
        alert('Unable to connect. Please try again later.');
      });
  }

  function openCallModal() {
    const modal = document.createElement('div');
    modal.style = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    const box = document.createElement('div');
    box.style = 'background: #fff; padding: 32px; border-radius: 12px; min-width: 320px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.18);';
    box.innerHTML = '<h2>Calling...</h2><div id="calldocker-status">Connecting to agent...</div>';
    // Add End Call and Mute buttons
    endCallBtn = document.createElement('button');
    endCallBtn.innerText = 'End Call';
    endCallBtn.style = 'margin: 16px 8px 0 0; padding: 8px 20px; background: #dc3545; color: #fff; border: none; border-radius: 6px; font-size: 16px;';
    endCallBtn.onclick = endCall;
    muteBtn = document.createElement('button');
    muteBtn.innerText = 'Mute';
    muteBtn.style = 'margin: 16px 0 0 8px; padding: 8px 20px; background: #007bff; color: #fff; border: none; border-radius: 6px; font-size: 16px;';
    muteBtn.onclick = toggleMute;
    box.appendChild(endCallBtn);
    box.appendChild(muteBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);

    remoteAudio = document.createElement('audio');
    remoteAudio.autoplay = true;
    remoteAudio.style.display = 'none';
    document.body.appendChild(remoteAudio);

    socket = window.io(BACKEND_URL);
    log('Socket.IO connected:', socket.id);
    socket.emit('call-request', { uuid: COMPANY_UUID, callType: 'call' });

    socket.on('call-routed', function(data) {
      log('call-routed', data);
      if (data.success) {
        agentSocketId = data.agentSocketId ? data.agentSocketId : null;
        log('Using agentSocketId for signaling:', agentSocketId);
        document.getElementById('calldocker-status').innerText = 'Ringing agent...';
      } else {
        document.getElementById('calldocker-status').innerText = 'No agents available. Please try again later.';
        endCallBtn.disabled = true;
        muteBtn.disabled = true;
      }
    });

    socket.on('call-status', function(data) {
      log('call-status', data);
      if (data.status === 'accepted') {
        document.getElementById('calldocker-status').innerText = 'Agent accepted the call! Connecting audio...';
        endCallBtn.disabled = false;
        muteBtn.disabled = false;
        startWebRTC();
      } else if (data.status === 'rejected') {
        document.getElementById('calldocker-status').innerText = 'Agent rejected the call.';
        endCallBtn.disabled = true;
        muteBtn.disabled = true;
      }
    });

    // WebRTC signaling handlers
    socket.on('webrtc-answer', async function(data) {
      log('Received webrtc-answer', data);
      if (peerConnection && data.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        log('Set remote description (answer)');
      }
    });
    socket.on('webrtc-ice-candidate', async function(data) {
      log('Received webrtc-ice-candidate', data);
      if (peerConnection && data.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          log('Added ICE candidate');
        } catch (e) { log('Error adding ICE candidate', e); }
      }
    });

    socket.on('form-push', function(data) {
      console.log('[form-push] Received form-push event', data);
      // ... existing code to display the form ...
    });

    modal.onclick = function(e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
        if (remoteAudio) document.body.removeChild(remoteAudio);
        if (peerConnection) peerConnection.close();
        if (socket) socket.disconnect();
      }
    };
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