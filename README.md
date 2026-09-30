# ⚡ SeatSwap™ — SaaS Team Seat Micro-Leasing Platform

> **Why pay solo SaaS prices? Share team plan seats. Save up to 75% in total.**  
> Verified Figma Enterprise, Adobe Creative Cloud, LeetCode Pro, and Midjourney workspaces with smart escrow protection and zero-credential relay access.

---

## 🌟 Overview

**SeatSwap** is a peer-to-peer micro-leasing marketplace for idle seats on premium software team plans. Teams with excess paid seats can list them to offset costs, while individual developers, designers, and founders can lease enterprise-grade software at fractional prices without long-term commitments or sharing credentials.

### ✨ Key Features

- **🛡️ Zero-Credential Security**: Access workspaces via relay proxies and workspace invites without ever sharing passwords or billing information.
- **🔒 Smart Escrow Protection**: Payments are held in escrow with a 48-hour probation window and automated health probes every 12 hours. Prorated refunds are dispatched instantly if access is interrupted.
- **⚡ Dual-View Architecture**:
  - **Cinematic Landing Page (`index.html`)**: Interactive scroll-driven presentation with high-definition video backdrop and real-time USD/INR currency conversion.
  - **Dynamic Seat Dashboard (`dashboard.html`)**: Full catalog browsing, side-by-side plan comparisons, interactive lease and host calculators, telemetry metrics, and dispute simulation.
- **🔑 React Authentication Suite (`auth-app`)**: Standalone authentication module built with React 18, Tailwind CSS, and HashRouter for seamless sign-in, registration, and password recovery.
- **🌐 Dual-Port Local Server (`server.js`)**: Out-of-the-box zero-dependency HTTP server running simultaneously on **Port 3000** and **Port 8080** with automated route aliasing and smart 302 redirects.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/shubhamsharma0707/SeatSwap.git
cd SeatSwap
```

### 2. Start the Platform
```bash
npm start
# or: node server.js
```

### 3. Open in Browser
- **Dashboard**: [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)
- **Landing Page**: [http://localhost:3000/index.html](http://localhost:3000/index.html)
- **Sign In / Sign Up**: [http://localhost:3000/login](http://localhost:3000/login)

*(Also mirrored on [http://localhost:8080/](http://localhost:8080/))*

---

## 📂 Project Structure

```
SeatSwap/
├── index.html                   # Cinematic landing page
├── dashboard.html               # Main seat catalog & interactive leasing dashboard
├── server.js                    # Multi-port Node.js dev & production static server
├── package.json                 # Project configuration & start scripts
├── .gitignore                   # Git ignore patterns
│
├── js/
│   ├── auth.js                  # Authentication helpers, session tokens & mock auth
│   └── integration.js           # Navigation sync, currency persistence & modal hooks
│
├── auth-app/                    # React 18 + Tailwind CSS authentication app
│   ├── src/
│   │   ├── pages/               # Login, SignUp, ResetPassword
│   │   ├── components/          # AuthLayout, UI inputs & buttons
│   │   └── App.tsx              # HashRouter route configuration
│   ├── dist/                    # Pre-built distribution bundle (ready-to-serve)
│   ├── vite.config.ts           # Vite configuration with relative base
│   └── package.json             # Auth dependencies & build scripts
│
└── docs/
    ├── ARCHITECTURE.md          # Technical design & product specification
    └── QUICKSTART.md            # Quick verification & test guide
```

---

## 🛠️ Developing & Rebuilding Auth App

If you make modifications inside `auth-app/`:

```bash
cd auth-app
npm install
npm run build
```

The compiled bundle in `auth-app/dist/` will immediately be served by `server.js`.

---

## 🔐 Authentication Modes

SeatSwap includes built-in mock and test session management:
- **Test Credentials**: Any email (e.g. `alex.founder@startup.io`) and password will log in.
- **1-Click Test Login**: Interactive lease modals offer an instant test login trigger for rapid local testing.
- **Session Persistence**: Auth tokens and user state are saved in `localStorage` (`seatswap_auth_token`, `seatswap_user_data`).

---

## 📄 License

ISC License © 2026 SeatSwap
