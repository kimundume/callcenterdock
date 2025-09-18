# 🎵 CallDocker Audio Setup Guide

## 🚨 **CRITICAL: Two-Way Audio Fix**

This guide provides step-by-step instructions to fix the two-way audio issues in CallDocker and ensure proper WebRTC communication.

## 🔧 **What Was Fixed**

### **1. TURN/STUN Server Configuration**
- **Added proper TURN servers** for NAT traversal
- **Configured STUN servers** for connection establishment
- **Updated all WebRTC components** with consistent ICE server configuration

### **2. Audio Track Handling**
- **Fixed audio track management** in WebRTC connections
- **Improved getUserMedia constraints** for better audio quality
- **Enhanced audio stream routing** between visitor and agent

### **3. WebRTC Connection Stability**
- **Added multiple ICE server fallbacks** for better connectivity
- **Improved connection state handling** for audio reliability
- **Enhanced error handling** for audio connection issues

## 🎯 **TURN/STUN Server Configuration**

### **Current Configuration:**
```javascript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
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
```

### **Why This Configuration Works:**
1. **Google STUN servers** - For basic NAT traversal
2. **Custom TURN server** - For complex NAT scenarios
3. **Multiple transport protocols** - UDP and TCP support
4. **Authentication** - Proper TURN server credentials

## 🚀 **Deployment Instructions**

### **Step 1: Backend Deployment**
```bash
cd backend
npm run build
npm start
```

### **Step 2: Frontend Deployment**
```bash
cd frontend/dashboard
npm run build
npm run dev
```

### **Step 3: Widget Deployment**
```bash
cd frontend/widget
# Widget files are automatically served by backend
```

## 🔍 **Testing Audio Functionality**

### **1. Test WebRTC Connection**
- Open browser developer tools
- Look for WebRTC connection logs
- Check for ICE connection state changes
- Verify audio track addition

### **2. Test Audio Quality**
- Make a test call between visitor and agent
- Check for audio in both directions
- Verify no echo or distortion
- Test with different network conditions

### **3. Test NAT Traversal**
- Test from different networks
- Test with VPN enabled
- Test from mobile devices
- Verify TURN server usage in logs

## 🛠️ **Troubleshooting Audio Issues**

### **Common Issues & Solutions:**

#### **1. No Audio in Either Direction**
```javascript
// Check getUserMedia constraints
navigator.mediaDevices.getUserMedia({ 
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  } 
})
```

#### **2. One-Way Audio Only**
- Check ICE connection state
- Verify audio track addition
- Check WebRTC offer/answer exchange
- Verify TURN server connectivity

#### **3. Audio Quality Issues**
- Check network bandwidth
- Verify audio constraints
- Check for audio processing settings
- Test with different browsers

#### **4. Connection Failures**
- Check TURN server availability
- Verify STUN server connectivity
- Check firewall settings
- Test with different networks

## 📊 **Monitoring & Debugging**

### **Browser Console Logs to Watch:**
```javascript
// WebRTC Connection State
console.log('ICE state:', peerConnection.iceConnectionState);
console.log('Connection state:', peerConnection.connectionState);

// Audio Track Information
console.log('Local stream tracks:', localStream.getTracks());
console.log('Remote stream tracks:', remoteStream.getTracks());

// ICE Candidate Information
console.log('ICE candidate:', event.candidate);
```

### **Network Tab Monitoring:**
- Check WebSocket connections
- Monitor ICE candidate exchange
- Verify TURN server requests
- Check for connection timeouts

## 🔐 **Security Considerations**

### **TURN Server Security:**
- Use strong credentials
- Implement rate limiting
- Monitor usage patterns
- Regular credential rotation

### **WebRTC Security:**
- Use HTTPS for all connections
- Implement proper authentication
- Monitor for abuse
- Regular security updates

## 📈 **Performance Optimization**

### **Audio Quality Settings:**
```javascript
// Optimized audio constraints
const audioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1
  }
};
```

### **Connection Optimization:**
- Use multiple ICE servers
- Implement connection pooling
- Monitor connection health
- Implement automatic reconnection

## 🚨 **Emergency Audio Fix**

If audio still doesn't work after following this guide:

1. **Check browser permissions** - Ensure microphone access is granted
2. **Test with different browsers** - Chrome, Firefox, Safari
3. **Check network connectivity** - Ensure TURN servers are accessible
4. **Verify WebRTC support** - Check browser WebRTC capabilities
5. **Test with different devices** - Mobile, desktop, different networks

## 📞 **Support & Maintenance**

### **Regular Maintenance:**
- Monitor TURN server performance
- Check for WebRTC updates
- Test audio quality regularly
- Update credentials as needed

### **Monitoring Tools:**
- Browser developer tools
- Network monitoring
- WebRTC statistics
- Audio quality metrics

---

## ✅ **Checklist for Audio Fix**

- [ ] TURN/STUN servers configured
- [ ] WebRTC components updated
- [ ] Audio constraints optimized
- [ ] Connection handling improved
- [ ] Error handling enhanced
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Deployment successful

---

**Last Updated:** August 22, 2025  
**Version:** 2.1.3  
**Status:** ✅ Audio Fix Implemented
