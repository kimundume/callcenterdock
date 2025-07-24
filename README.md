
# Calldocker (Working Title) 📞🚀

Calldocker is a multi-tenant, browser-based voice calling platform that allows users to embed a “Call Us” widget on their websites. When clicked, the widget initiates a WebRTC voice call directly to the company’s dashboard — functioning as a mini call center without requiring physical phone numbers.

---

## 🔧 System Overview

### 🧠 Concept
Each company (e.g., Company X) creates an account and gets a unique `UUID` and a corresponding embeddable widget. Calls from this widget route directly to the company's dashboard. Each account maintains its own virtual call center with features like:

- Multiple agent support
- IVR menu
- Call routing
- Call queueing and logs
- Audio call via browser (no phone number required)

---

## 🏗️ Backend Architecture

### 🔨 Stack
- **Node.js / Express** (REST API)
- **Socket.io** (Real-time signaling for WebRTC)
- **PostgreSQL** (Tenancy, call logs, user management)
- **Redis** (Call session cache, pub/sub)
- **JWT Auth** (Account security)

### 📂 Folder Structure
```
backend/
├── controllers/
├── routes/
├── models/
├── services/
├── sockets/
├── middlewares/
├── utils/
├── config/
└── index.js
```

### 📦 Key Features
- Multi-tenant architecture
- User auth and role management (agents, supervisors)
- IVR logic (play audio prompt or route to agents)
- WebRTC signaling and call initiation
- Call session storage & analytics
- Secure real-time dashboard

---

## 🌐 Frontend Dashboard

### 🧰 Tech Stack
- React + TailwindCSS
- Zustand or Redux for state
- WebRTC API for call handling
- Socket.io-client for signaling
- Recharts for analytics

### 📋 Features
- Agent call panel (pickup, hold, mute, end)
- Call logs & analytics
- Widget configuration
- Invite team members

---

## 🧩 Embeddable Widget

### 🖼️ Description
- JavaScript snippet (served with unique company UUID)
- Lightweight floating widget UI
- Click-to-call feature (opens in-browser call window)
- Passes session info and connects to backend WebSocket

---

## 🧪 Prototype Instructions for AI Agents

### Backend Setup
1. Initialize Node.js project with Express & Socket.io
2. Create PostgreSQL DB with multi-tenant schema:
   - `companies`, `users`, `calls`, `sessions`
3. Set up Redis for pub/sub (optional but ideal for scale)
4. Use JWT for authentication + company UUID mapping
5. Define routes for:
   - User login/signup
   - Call events (start, end, logs)
   - Dashboard data (agents, metrics)

### Frontend Setup
1. Create React frontend with dynamic dashboard
2. On login, fetch and persist company UUID
3. Integrate WebRTC with agent interface for calls
4. Use Socket.io for real-time comms
5. Display call metrics using Recharts or similar

### Embeddable Widget Setup
1. Serve a custom script like: `https://calldocker.com/widget.js?uuid=COMPANY_UUID`
2. Widget loads with floating button + branding
3. On click, opens a mini call UI -> initiates WebRTC + connects to server

### Call Routing (AI/IVR)
1. Define routing rules per company (DB or JSON config)
2. Auto route to available agent or queue
3. Add option to play a prompt or record messages (voicemail)

---

## 🧠 Additional Thoughts

- Support queueing logic and fallback if no agent is online
- Add voicemail and call recordings (WebRTC MediaRecorder)
- Expand dashboard with lead management & CRM integrations
- Scale signaling layer using Redis adapter or media server (e.g., Jitsi, Mediasoup)

---

## 📎 Example Embedding Code
```html
<script src="https://calldocker.com/widget.js?uuid=YOUR_COMPANY_UUID"></script>
```

---

## 📄 License
MIT (To be confirmed)
