// Embeddable CallDocker Widget
(function() {
  const BACKEND_URL = 'http://localhost:5000';
  const COMPANY_UUID = window.CALLDOCKER_COMPANY_UUID || 'demo-uuid';

  let socket = null;
  let peerConnection = null;
  let localStream = null;
  let remoteAudio = null;
  let agentSocketId = null;
  let isMuted = false;
  let endCallBtn = null;
  let muteBtn = null;

  function log(...args) { console.log('[Widget]', ...args); }

  function loadSocketIo(callback) {
    if (window.io) return callback();
    var script = document.createElement('script');
    script.src = BACKEND_URL + '/socket.io/socket.io.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  function createWidget() {
    const callBtn = document.createElement('button');
    callBtn.innerText = 'Call Us';
    callBtn.style = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 12px 24px; background: #007bff; color: #fff; border: none; border-radius: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; font-size: 16px;';
    callBtn.onclick = openCallModal;
    document.body.appendChild(callBtn);
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
    socket.emit('call-request', { uuid: COMPANY_UUID });

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
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      log('Got local audio stream');
      muteBtn.innerText = 'Mute';
      isMuted = false;
    } catch (err) {
      log('Error getting local audio stream', err);
      document.getElementById('calldocker-status').innerText = 'Microphone access denied or unavailable.';
      endCallBtn.disabled = true;
      muteBtn.disabled = true;
      return;
    }
    peerConnection = new RTCPeerConnection();
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
      log('Added local track to peer connection');
    });
    peerConnection.ontrack = function(event) {
      log('Received remote track', event.streams);
      if (remoteAudio) remoteAudio.srcObject = event.streams[0];
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