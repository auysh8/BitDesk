# BitDesk — Implementation TODO Checklist & Audit

Based on the assignment specification: **Production-Ready Full-Stack Ticketing & Email Support System (BitMax Technology (P) Ltd)**.

---

## 1. Project Architecture & Foundation
- [x] Initialize modular backend architecture (`src/` with `config/`, `modules/`, `middleware/`, `database/`, `services/`, `queues/`, `templates/`, `validators/`, `utils/`, `constants/`, `docs/`, `logs/`, `tests/`)
  > *Audit Note: Backend has modular `modules/`, `middleware/`, `database/`, `utils/`, `constants/`, `docs/` (Swagger specification), and `tests/` (automated test suite).*
- [x] Configure environment variables management (`dotenv`) and maintain `.env.example`
  > *Audit Note: Both `server/.env.example` and `client/.env.example` are present and documented.*
- [x] Set up database connection using Mongoose with proper connection pooling and error handlers
  > *Audit Note: Implemented in `server/src/database/db.ts` with connection error handling and graceful shutdown in `server.ts`.*
- [x] Configure ESLint and Prettier for code quality across frontend and backend
  > *Audit Note: ESLint and Prettier are configured in both `server/package.json` and `client/package.json`.*
- [x] Implement centralized error handling middleware and standard API response envelope format
  > *Audit Note: Implemented via `ApiError.ts`, `apiResponse.ts` (`sendResponse`), and `errorHandler.ts` middleware.*
- [x] Set up frontend using React.js + Vite + Tailwind CSS
  > *Audit Note: Implemented with Vite, React 19, and Tailwind CSS v4 in `client/`.*
- [x] Configure client-side routing with React Router and state management (Redux Toolkit or Context API)
  > *Audit Note: Implemented with `react-router-dom` and `AuthContext`.*

---

## 2. Database Models & Schemas (Mongoose)
- **User Model**:
  - [x] `name`, `email`, `phone`
  - [x] `passwordHash` (stored as `password`, hashed with bcrypt)
  - [x] `role` (`customer`, `agent`, `admin`)
  - [x] `isVerified` (email verification status)
  - [x] `otpHash`, `otpExpiresAt`
  - [x] `refreshToken` / session storage
  - [x] `createdAt`, `updatedAt`
- **Ticket Model**:
  - [x] `ticketNumber` (unique human-readable format e.g., `TKT-2026-000001`)
  - [x] `subject` / title
  - [x] `description`
  - [x] `requesterId` (ref to User), `requesterEmail`
  - [x] `assignedTo` (ref to User, nullable)
  - [x] `category` (ref to Category)
  - [x] `priority` (`Low`, `Medium`, `High`, `Urgent`)
  - [x] `status` (`Open`, `In Progress`, `Pending`, `Resolved`, `Closed`, `Reopened`)
  - [x] `lastMessageAt`, `assignedAt`, `resolvedAt`, `closedAt`
  - [x] `createdAt`, `updatedAt`
- **TicketMessage Model**:
  - [x] `ticketId` (ref to Ticket)
  - [x] `senderId` (ref to User, optional for email replies)
  - [x] `senderEmail`, `senderRole`
  - [x] `type` (`public`, `internal`)
  - [x] `body` (sanitized text/HTML)
  - [x] `source` (`web`, `email`)
  - [x] `emailMessageId` (for email deduplication and thread tracing)
  - [x] `createdAt`, `updatedAt`
- [x] **TicketActivity Model (Audit Trail)**:
  - [x] `ticketId` (ref to Ticket)
  - [x] `actorId` (ref to User or system)
  - [x] `action` (e.g., `TICKET_CREATED`, `STATUS_CHANGED`, `TICKET_ASSIGNED`, `REPLY_ADDED`, `INTERNAL_NOTE_ADDED`)
  - [x] `oldValue`, `newValue`
  - [x] `metadata`
  - [x] `createdAt`
- [x] **Category Model**:
  - [x] `name` (e.g., Technical Support, Billing & Invoicing, Account & Access, General Inquiries)
  - [x] `description`
  - [x] `isActive`
  - [x] `createdAt`, `updatedAt`
- [x] **EmailEvent Model**:
  - [x] `providerMessageId`
  - [x] `messageId`
  - [x] `ticketId`
  - [x] `direction` (`inbound`, `outbound`)
  - [x] `status` (`queued`, `sent`, `delivered`, `failed`, `processed`)
  - [x] `error`
  - [x] `processedAt`

---

## 3. Authentication & User Management
- [x] Registration with full name, email, and phone
  > *Audit Note: Implemented in `auth.controller.ts` (`register`). Staff accounts require admin approval.*
- [x] Email OTP generation, hashing, sending, and verification
  > *Audit Note: Implemented in `otp.ts` and `auth.controller.ts` (`verifyOtp`).*
- [x] Resend OTP with rate limiting, cooldown, and expiry limits
  > *Audit Note: Implemented via `/api/auth/resend-otp` with a 60-second cooldown timer and rate limiting.*
- [x] Password login with bcrypt hashing
  > *Audit Note: Password login with bcrypt hashing is implemented and protected by rate limiting.*
- [x] Email + OTP passwordless login
  > *Audit Note: Implemented via `/api/auth/login-otp` and `/api/auth/verify-login-otp`.*
- [x] Short-lived JWT Access Token + long-lived Refresh Token flow
  > *Audit Note: Access token expires in 15m; refresh token expires in 7d and is stored in HTTP-only cookie.*
- [x] Refresh token rotation and invalidation endpoint (`/api/auth/refresh-token`)
  > *Audit Note: Implemented in `refreshAccessToken`.*
- [x] Secure logout with refresh token revocation (`/api/auth/logout`)
  > *Audit Note: Clears refresh token in DB and clears HTTP-only cookie.*
- [x] Forgot password flow (request password reset token/OTP)
  > *Audit Note: Implemented in `forgotPassword`.*
- [x] Reset password flow (validate token/OTP and update password)
  > *Audit Note: Implemented in `resetPassword`.*
- [x] Role-Based Access Control (RBAC) middleware for `Customer`, `Support Agent`, and `Admin`
  > *Audit Note: Implemented in `middleware/auth.ts` (`authorizeRoles`).*

---

## 4. Security & Validation Middleware
- [x] Helmet for secure HTTP headers
  > *Audit Note: Enabled in `server/src/app.ts`.*
- [x] Strict CORS configuration
  > *Audit Note: Implemented with origin validation for localhost and configured production domains in `server/src/app.ts`.*
- [x] Rate limiting on sensitive endpoints (Login, OTP, Password Reset, Ticket Creation)
  > *Audit Note: `express-rate-limit` middleware active with `globalRateLimiter` (200 req/min) on `/api` and strict `authRateLimiter` (30 req/15 min) on all auth endpoints.*
- [x] Centralized request validation & sanitization (trim strings, normalize emails, phone format checks)
  > *Audit Note: Joi validation schemas configured with `stripUnknown: true` in `middleware/validate.ts`.*
- [x] Inbound email deduplication and loopback protection
  > *Audit Note: Deduplication by `Message-ID` in `EmailEvent`, and automated system notification loopbacks are filtered.*
- [x] Ticket activity audit trail
  > *Audit Note: Complete lifecycle changes (assignment, status, priority, replies) recorded in `TicketActivity`.*

---

## 5. Ticket Management & Lifecycle (Backend APIs)
- [x] Human-readable unique ticket number sequence generator (`TKT-YYYY-XXXXXX`)
  > *Audit Note: Implemented in `ticket.model.ts` pre-save hook.*
- [x] Ticket state machine supporting all valid transitions:
  - `Open` → `In Progress` / `Pending` / `Resolved` / `Closed`
  - `Resolved` → `Reopened` / `Closed`
  - `Closed` → `Reopened` (with valid reason / customer reply)
  > *Audit Note: Supported via `PATCH /api/tickets/:id` (with full status updates) as well as dedicated `/resolve`, `/close`, and `/reopen` endpoints.*
- [x] `POST /api/tickets` — Create ticket
  > *Audit Note: Creates ticket, initial message, activity log, and dispatches confirmation email.*
- [x] `GET /api/tickets` — List tickets with search, filtering (status, priority, category, agent), sorting, and pagination
  > *Audit Note: Implemented in `getTickets` with role-based filtering, `assignedTo` filters, and sort options.*
- [x] `GET /api/tickets/:ticketId` — Get ticket details
  > *Audit Note: Implemented with authorization checks in `getTicketById`.*
- [x] `PATCH /api/tickets/:ticketId` — Update ticket metadata (status, priority, category)
  > *Audit Note: Implemented with activity logging and real-time socket broadcasting.*
- [x] `POST /api/tickets/:ticketId/assign` — Assign or reassign ticket to an Agent/Admin
  > *Audit Note: Implemented in `assignTicket` with hybrid RBAC rules (agents can claim tickets for themselves).*
- [x] `POST /api/tickets/:ticketId/messages` — Post reply (customer public reply, agent public reply, or agent internal note)
  > *Audit Note: Implemented with checks preventing customers from creating internal notes and preventing non-assigned agents from posting public replies.*
- [x] `GET /api/tickets/:ticketId/messages` — Fetch ticket conversation thread
  > *Audit Note: Implemented; internal notes are excluded for customer role.*
- [x] `POST /api/tickets/:ticketId/resolve` — Mark ticket as Resolved
  > *Audit Note: Implemented; sets `resolvedAt`, sends notification email, logs activity.*
- [x] `POST /api/tickets/:ticketId/reopen` — Reopen ticket
  > *Audit Note: Implemented in `reopenTicket`.*
- [x] `POST /api/tickets/:ticketId/close` — Close ticket
  > *Audit Note: Implemented; sets `closedAt`, sends notification email, logs activity.*
- [x] `GET /api/tickets/:ticketId/activity` — Fetch complete audit/activity timeline
  > *Audit Note: Implemented in `getTicketActivity`.*
- [x] `GET /api/categories` — List active categories
  > *Audit Note: Implemented in `category.controller.ts`.*
- [x] `POST /api/categories` — Create category (Admin)
  > *Audit Note: Implemented with Admin authorization.*
- [x] `PATCH /api/categories/:id` — Update / deactivate category (Admin)
  > *Audit Note: Implemented with Admin authorization.*
- [x] `GET /api/dashboard/summary` — Aggregated ticket metrics
  > *Audit Note: Computes total, open, inProgress, pending, resolved, closed, reopened, unassigned, and assignedToMe.*

---

## 6. Two-Way Email Integration
### 6.1 Outbound Email
- [x] Reusable responsive HTML email templates with ticket context and branding
  > *Audit Note: Implemented in `emailTemplate.ts`.*
- [x] Automated email trigger on ticket creation (confirmation to requester)
  > *Audit Note: Dispatched in `notifyTicketCreated` and `notifyAdminsTicketCreated`.*
- [x] Automated email trigger on assignment/reassignment (notification to agent)
  > *Audit Note: Dispatched in `notifyTicketAssigned`.*
- [x] Automated email trigger on staff reply (notification to requester)
  > *Audit Note: Dispatched in `notifyTicketReply`.*
- [x] Automated email trigger on status changes (`Resolved`, `Closed`, `Reopened`)
  > *Audit Note: Dispatched in `notifyStatusChanged`.*
- [x] Email headers injection: stable `Message-ID`, `In-Reply-To`, `References`, and ticket-encoded `Reply-To` address
  > *Audit Note: Configured in `sendTicketEmail` (`emailService.ts`).*

### 6.2 Inbound Email → Web Ticket Reply
- [x] Inbound email listener/webhook endpoint (`POST /api/email/inbound`)
  > *Audit Note: Implemented in `handleInboundEmail`.*
- [x] Secure ticket identification from `Reply-To`, `References`, or custom headers
  > *Audit Note: Parses `inReplyTo`, `references`, `to` plus-addressing, and fallback subject match.*
- [x] Inbound email deduplication using `Message-ID` / provider event ID
  > *Audit Note: Deduplicates against existing `EmailEvent` records.*
- [x] Stripping quoted prior email threads to store only the new reply
  > *Audit Note: Implemented in `cleanEmailReplyBody`.*
- [x] Ticket message creation with `source: 'email'` and email metadata
  > *Audit Note: Appends message to conversation thread with `source: MESSAGE_SOURCE.EMAIL`.*
- [x] Automatic ticket reopening if incoming customer email arrives on a `Resolved` or `Closed` ticket
  > *Audit Note: Reopens ticket and logs status change activity.*
- [x] Logging inbound email processing outcome in `EmailEvent` and application logs
  > *Audit Note: Tracks status (`processed` or `failed`) in `EmailEvent`.*
- [x] Rejecting or ignoring unverified/unmatched incoming emails safely
  > *Audit Note: Safely returns 200 response while recording failure event in `EmailEvent`.*

---

## 7. Frontend Application (React + Vite + Tailwind)
### 7.1 Authentication & Profile Screens
- [x] Login screen (toggle between Password login and OTP login)
  > *Audit Note: Implemented in `Login.tsx` with Render cold-start indicator.*
- [x] Registration screen with name, email, phone
  > *Audit Note: Implemented in `Register.tsx`.*
- [x] OTP verification screen with resend timer and action
  > *Audit Note: `VerifyOtp.tsx` includes a 60-second countdown timer and "Resend Code" button.*
- [x] Forgot Password & Reset Password screens
  > *Audit Note: Implemented in `ForgotPassword.tsx` and `ResetPassword.tsx`.*

### 7.2 Application Shell & Layout
- [x] Responsive navigation shell (Sidebar and Topbar)
  > *Audit Note: Implemented in `AppLayout.tsx` with mobile drawer and desktop sidebar.*
- [x] Authenticated user menu with role badge and logout action
  > *Audit Note: Displays user role, initial avatar, and sign out button.*
- [x] Role-based route guards (`CustomerRoute`, `AgentRoute`, `AdminRoute`)
  > *Audit Note: Implemented in `ProtectedRoute.tsx` with `allowedRoles`.*
- [x] Comprehensive UI states: loading skeletons, empty states, error banners, cold-start indicators
  > *Audit Note: Implemented across tickets, categories, and users views.*

### 7.3 Dashboard
- [x] Ticket statistics cards: Total, Open, In Progress, Pending, Resolved, Closed, Reopened, Unassigned, Assigned To Me
  > *Audit Note: `Dashboard.tsx` renders all 9 status cards dynamically.*
- [x] Visual status distribution meter
  > *Audit Note: `Dashboard.tsx` includes a multi-color progress meter showing percentages of Open, In Progress, Pending, Resolved, and Closed tickets.*
- [x] Recent activity / audit trail feed
  > *Audit Note: Displayed in `Dashboard.tsx` under Recent Activity.*

### 7.4 Ticket List & Filtering
- [x] Search input for ticket number or subject
  > *Audit Note: Implemented in `TicketList.tsx`.*
- [x] Quick view switcher tabs: "All Tickets", "Assigned to Me", "Unassigned"
  > *Audit Note: Interactive tabs implemented in `TicketList.tsx`.*
- [x] Filter controls: Status, Priority, Category
  > *Audit Note: Multi-select dropdown filters implemented in `TicketList.tsx`.*
- [x] Sorting dropdown: Newest First, Oldest First, Recently Updated, Priority
  > *Audit Note: Sort dropdown connected to backend sort query parameters in `TicketList.tsx`.*
- [x] Server-side pagination controls
  > *Audit Note: Implemented with Previous/Next buttons and page indicators.*

### 7.5 Ticket Creation Screen / Modal
- [x] Form with Subject, Description, Category dropdown, Priority selector
  > *Audit Note: Implemented in `CreateTicket.tsx`.*
- [x] Form validation with inline error feedback
  > *Audit Note: Implemented with required attributes and error alert banners.*

### 7.6 Ticket Detail & Conversation View
- [x] Ticket header: ticket number, subject, current status badge, priority badge, category, requester info, timestamps
  > *Audit Note: Implemented in `TicketDetail.tsx`.*
- [x] Chronological conversation thread displaying customer replies, agent replies, and system events
  > *Audit Note: Displays sender role, timestamp, channel (`Email` vs `Web`).*
- [x] Clear visual distinction between public replies and internal notes (highlighted background)
  > *Audit Note: Internal notes styled with amber background, lock icon, and internal badge.*
- [x] Quick action status controls: Resolve, Reopen, Close, and In Progress / Pending buttons
  > *Audit Note: Added quick status transition buttons for staff.*
- [x] Ticket Activity Timeline panel displaying history of assignment and status transitions
  > *Audit Note: Implemented in right column of `TicketDetail.tsx`.*

### 7.7 Real-Time Collaboration (Socket.IO)
- [x] Real-time updates for new ticket replies in active conversation without manual page refresh
  > *Audit Note: Implemented using Socket.IO (`joinTicketRoom`, `ticket:message_created`).*
- [x] Live updates for ticket status and assignment changes
  > *Audit Note: Implemented using `ticket:status_changed`, `ticket:assigned`, and `dashboard:refresh`.*

---

## 8. Testing Suite
- [x] Automated API integration test suite
  > *Audit Note: Node 22 test suite in `server/src/tests/api.test.ts` testing health, login authentication, RBAC authorization, and Swagger documentation.*

---

## 9. Deliverables & Documentation
- [x] Database seed script (creates Admin, Agent, Customer sample accounts, categories, and clean state)
  > *Audit Note: Implemented in `server/src/database/seed.ts`.*
- [x] Comprehensive `README.md`
  > *Audit Note: Production README in root with live links, feature summary, and demo accounts.*
- [x] Postman Collection (`postman_collection.json`)
  > *Audit Note: Complete Postman v2.1 collection in root covering Auth, Categories, Tickets, Messages, Dashboard, and Inbound Webhook.*
- [x] Swagger / OpenAPI documentation (`/api-docs`)
  > *Audit Note: OpenAPI 3.0 specification in `server/src/docs/swagger.json` mounted at `/api-docs`.*
- [x] Docker configuration (`Dockerfile` and `docker-compose.yml`)
  > *Audit Note: Production `server/Dockerfile`, `client/Dockerfile`, `client/nginx.conf`, and root `docker-compose.yml` orchestrating MongoDB, Redis, Server, and Client.*
