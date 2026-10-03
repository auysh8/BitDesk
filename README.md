<div align="center">

# 🎫 BitDesk

### Modern Support Ticketing & 2-Way Email Helpdesk System

BitDesk is a full-stack customer support platform built on the MERN stack. It bridges browser-based web portals with real-world email inboxes, featuring seamless 2-way email synchronization, role-based access control, collision locking, and zero-cost transactional email delivery.

<br />

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-bitdesk--1.onrender.com-0052cc?style=for-the-badge&logo=render)](https://bitdesk-1.onrender.com)
[![API Health](https://img.shields.io/badge/⚡_API_Health-bitdesk.onrender.com-2ea44f?style=for-the-badge&logo=fastapi)](https://bitdesk.onrender.com/api/health)

[![Node.js](https://img.shields.io/badge/Node.js-v20+-68a063?style=flat-square&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-v19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-v6-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-v5-000000?style=flat-square&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?style=flat-square&logo=tailwind-css)](https://www.mongodb.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v3-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

</div>

---

> ### 🌐 Live Demo & Credentials
> 
> * **Web App:** [https://bitdesk-1.onrender.com](https://bitdesk-1.onrender.com)
> * **Backend API:** [https://bitdesk.onrender.com/api](https://bitdesk.onrender.com/api)
> 
> #### 🔑 Pre-Configured Demo Admin:
> * **Email:** `admin@bitdesk.dev`
> * **Password:** `Password123!`
> * *Role:* **Admin** (Use this pre-configured admin account to approve newly registered agents, manage categories, and promote your own account to Admin or Support Agent).
> 
> > [!IMPORTANT]
> > **Testing OTP & Live Email Delivery:**  
> > Do **NOT** use demo emails (`@bitdesk.dev`) if you want to test OTP or email notifications, because fake domains cannot receive real emails. To test OTP sign-in and live 2-way email sync, **register with your own real Gmail address**, then log in with the Demo Admin account above to approve or promote yourself!
> 
> > [!NOTE]
> > **Render Free Tier Cold Start:**  
> > The backend is hosted on Render's free tier, which puts inactive instances to sleep after 15 minutes. Initial requests may take **30–45 seconds** to spin up. An in-app loading banner will notify you while the server boots.

---

## 🌟 Key Features

* **Complete 2-Way Email Bridge:** Customers and support agents can converse back-and-forth entirely inside Gmail. BitDesk ingests incoming replies via an inbound webhook, strips quoted email headers, and syncs messages to the web dashboard in real time.
* **Role-Based Access Control (RBAC):**
  * **Customer:** Create tickets, view status, track timeline, and reply via web or email.
  * **Support Agent:** Claim unassigned tickets, add internal notes, and send public replies.
  * **Administrator:** Sole authority to approve new agent registrations, reassign tickets, manage categories, and promote staff roles.
* **Staff Approval Security Gate:** Newly registered Agent and Admin accounts enter an unapproved queue until verified by the primary administrator.
* **Internal Notes & Collision Locking:** Team-only private notes with dedicated amber badges, plus collision guards preventing unassigned agents from accidentally replying to another agent's ticket.
* **Dual Authentication Modes:** Traditional Email + Password login, alongside passwordless 6-digit OTP verification.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios |
| **Backend** | Express 5, Node.js, TypeScript, Mongoose 9, JWT (Access + httpOnly Refresh) |
| **Database** | MongoDB Atlas (Cloud Replica Set) |
| **Email Bridge** | Google Apps Script (Outbound HTTPS Relay + Inbound Webhook forwarder) |
| **Hosting** | Render (Web Service + Static Site) |

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/auysh8/BitDesk.git
cd BitDesk

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Configuration
Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/Bitdesk
JWT_ACCESS_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
GMAIL_RELAY_URL=https://script.google.com/macros/s/<YOUR_SCRIPT_ID>/exec
EMAIL_FROM="BitDesk Support <support@yourdomain.com>"
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Reset Database & Seed Accounts
```bash
cd server
npx tsx src/database/reset-app.ts
```

### 4. Run Locally
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

---

## 📡 REST API Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register customer or staff account |
| `POST` | `/api/auth/login-password` | Public | Sign in using email & password |
| `POST` | `/api/auth/login-otp` | Public | Request 6-digit login OTP |
| `POST` | `/api/auth/verify-login-otp` | Public | Validate OTP and issue JWT tokens |
| `GET` | `/api/tickets` | Authenticated | List tickets with filters & search |
| `POST` | `/api/tickets` | Authenticated | Create a new support ticket |
| `POST` | `/api/tickets/:id/messages` | Authenticated | Post public reply or internal note |
| `POST` | `/api/tickets/:id/assign` | Staff | Assign ticket to an agent |
| `PATCH` | `/api/tickets/:id/status` | Staff | Transition ticket status |
| `POST` | `/api/email/inbound` | Webhook | Ingest inbound email replies from Gmail |
| `GET` | `/api/users` | Admin | Manage users, approve agents & update roles |

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
