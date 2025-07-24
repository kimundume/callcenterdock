# 🧠 Calldocker AI Agent Instruction Guide

## 📌 SYSTEM CONTEXT (System Prompt)

> You are an AI software engineer working on **Calldocker**, a browser-based, multi-tenant voice call system. Each user (or business account) gets a unique call widget to embed on their website. When a visitor clicks the call button, a WebRTC-based voice call is initiated and routed to that business’s dedicated dashboard where online agents can receive it. Your job is to help implement, test, and enhance this system as a working prototype.

---

## 💼 PROJECT OVERVIEW

**Working Title:** Calldocker
**Type:** Multi-tenant browser-based voice call SaaS
**Goal:** Let businesses receive voice calls from their website without using a phone number
**Core Technology:** WebRTC + Socket.IO + Express.js + JavaScript (React for frontend)

---

## 🏗️ PRODUCT STRUCTURE

### 🎯 Key Concept:

* Every business that signs up gets a **unique UUID**, which becomes their **account identifier**.
* The system is **multi-tenant**, meaning each business has its **own isolated call environment**, agents, and call logs.
* Each business gets a **"Call Us" widget script** that they embed on their website.
* When visitors click this widget, it starts a voice call to that UUID’s dashboard (call center).
* **Only agents from that UUID’s team** can receive the call.

---

## ⚙️ SYSTEM COMPONENTS

### 1. Widget Client (Visitor Side)

* Embedded via a JS script with `data-uuid`
* Displays a floating “Call Us” button
* On click: opens a popup/modal
* Initiates WebRTC + connects to backend signaling server

### 2. Backend (Server Side)

* Built using `Express.js` + `Socket.IO`
* Handles user registration, UUID generation
* Manages agent sessions, incoming calls
* Routes calls based on UUID to online agents

### 3. Agent Dashboard (Business Side)

* Built using React
* Agents log in and join using their UUID
* Incoming call alerts
* Accept/Reject calls
* Live status (Online/Offline)
* Shows call history per account

### 4. Signaling & Media

* Uses WebRTC for audio streaming
* Uses STUN/TURN servers for network traversal
* Signaling handled via WebSocket (Socket.IO)

---

## 🧪 MVP FEATURES

| Feature                 | Description                                     |
| ----------------------- | ----------------------------------------------- |
| User signup             | Register a company, generate UUID               |
| Widget script generator | Script includes `data-uuid` and can be embedded |
| WebRTC audio call       | Peer-to-peer voice session via browser          |
| Signaling server        | Uses Socket.IO for signaling                    |
| Call routing            | Routes call to first available agent per UUID   |
| Multi-agent support     | Each UUID/account can have multiple agents      |
| Dashboard interface     | React UI for agent login, call pickup           |
| Call logs               | In-memory call logs for each UUID/account       |

---

## 🛠️ TECHNOLOGY STACK

| Component            | Tech                                             |
| -------------------- | ------------------------------------------------ |
| Frontend (Dashboard) | React.js                                         |
| Frontend (Widget)    | Vanilla JS or lightweight JS                     |
| Backend              | Node.js + Express                                |
| Real-time comms      | Socket.IO                                        |
| Voice calls          | WebRTC (audio only)                              |
| Storage (MVP)        | In-memory (`tempDB.js`)                          |
| Auth (MVP)           | Placeholder only, no JWT for now                 |
| STUN/TURN            | Use free STUN + install Coturn for TURN fallback |

---

## 🗂️ PROJECT FILE STRUCTURE

```
calldocker/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   │   └── widget.js
│   ├── sockets/
│   │   └── signaling.js
│   ├── utils/
│   │   └── callRouter.js
│   ├── data/
│   │   └── tempDB.js
│   └── package.json
│
├── frontend/
│   ├── dashboard/      ← React-based agent UI
│   └── widget/         ← JS widget embed generator
```

---

## 🔌 BACKEND SIGNALING LOGIC (Socket.IO)

### Events:

* `register-agent` → Agent joins with UUID
* `call-request` → Widget triggers a call to UUID
* `incoming-call` → Sent to first available agent
* `call-routed` → Response to widget if success/fail
* `disconnect` → Removes agent from routing

### Call Flow:

1. Visitor loads widget → initiates `call-request` with UUID
2. Backend checks agents under UUID
3. Routes to first available agent
4. Agent sees `incoming-call`
5. WebRTC handshake starts

---

## 🧩 EMBED WIDGET JS (SAMPLE)

```html
<script>
  const COMPANY_UUID = 'uuid-xyz';

  const callBtn = document.createElement('button');
  callBtn.innerText = "Call Us";
  callBtn.style = "position: fixed; bottom: 20px; right: 20px; z-index: 9999;";
  callBtn.onclick = () => {
    window.open(`https://calldocker.com/call?uuid=${COMPANY_UUID}`, '_blank', 'width=400,height=600');
  };
  document.body.appendChild(callBtn);
</script>
```

---

## 🧠 LOGIC RULES

* Each company/account is **isolated** via UUID.
* Calls from one UUID **can only route** to agents under that UUID.
* Widget connects using `data-uuid` and hits only that company’s pool.
* If no agent is online, widget can show fallback message (e.g., “No one is available”).
* Optional: show agent status to visitor.

---

## 🔮 OPTIONAL ADVANCED FEATURES

| Feature                 | Description                                   |
| ----------------------- | --------------------------------------------- |
| IVR menu                | “Press 1 for Sales…” – routes based on option |
| Team-based routing      | Sales vs Support groups under same UUID       |
| Whisper/coaching        | Add-on for AI or supervisor intervention      |
| Call queueing           | Hold music or queue system if no agent        |
| Agent performance       | Track pickup time, call duration              |
| Real-time chat fallback | If no one answers, switch to text chat        |

---

## 🧪 TESTING INSTRUCTIONS (MVP)

1. Start backend server:

   ```bash
   npm install && npm run dev
   ```

2. Register account:

   ```http
   POST /api/widget/register
   {
     "companyName": "Company X",
     "email": "email@company.com"
   }
   ```

3. Embed widget on test site using returned UUID.

4. Agent opens dashboard and runs:

   ```js
   socket.emit('register-agent', { uuid: 'uuid-company-x', agentId: 'agent1' });
   ```

5. Call from widget sends:

   ```js
   socket.emit('call-request', { uuid: 'uuid-company-x' });
   ```

6. Agent receives:

   ```js
   socket.on('incoming-call', data => { ... });
   ```

---

## 🔐 SECURITY TO PLAN FOR (Later Phase)

* JWT tokens per user + UUID
* Widget validation (signed embed tokens)
* CORS and origin filtering
* Rate limiting call requests
* Call spam protection

---

## 🎯 NEXT GOALS FOR AI AGENT

✅ Build backend scaffolding for multi-tenant call system
✅ Build React agent dashboard interface
✅ Create and test widget client with dynamic call
✅ Connect WebRTC audio stream
✅ Implement basic call routing logic
✅ Deploy backend + frontend (Vercel + DigitalOcean combo)
✅ Setup TURN server (Coturn)

---

## 📘 NAME: “Calldocker”

> A SaaS call handling system that **dockerizes voice communication per client**, allowing isolated, browser-based call centers for any business through one embed line of code.

---

Let me know if you'd like this saved as a downloadable `README.md`, or copied into a Notion-style doc. 