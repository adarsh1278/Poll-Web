# Real-Time Polling App

A full-stack, real-time polling application where users can create polls, share them via link, and vote — with **live result updates** pushed over WebSockets. Built with **Next.js 16**, **Express**, **Socket.IO**, and **MongoDB**.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [How We Approached It](#how-we-approached-it)
- [Unique Vote Enforcement — Browser Fingerprint](#unique-vote-enforcement--browser-fingerprint)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Socket Events](#socket-events)
- [Security & Hardening](#security--hardening)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Problem Statement

Online polls are trivially gameable. Anyone can open an incognito tab, clear cookies, or switch browsers to vote again. We needed a system that:

1. Lets anyone **create** and **share** a poll without sign-up.
2. Shows results **in real time** as votes come in.
3. **Prevents duplicate votes** as robustly as possible — without requiring user accounts or authentication.

The core challenge: **how do you enforce "one person, one vote" when there are no user accounts?**

---

## How We Approached It

### 1. Identify the Voter Without Auth

We use **browser fingerprinting** as the primary signal to identify voters:

| Signal | Source | What It Catches |
|---|---|---|
| **Browser Fingerprint** | FingerprintJS (client-side) | Same browser on same device, even across incognito windows |

IP addresses are logged (hashed) for auditing purposes but are **not** used for duplicate vote enforcement. This means **multiple users on the same network (e.g., same WiFi, office, college) can each cast their own vote** — as long as they use different devices or browsers.

The fingerprint alone provides strong protection: FingerprintJS generates a stable visitor ID that survives cookie clears, incognito mode, and most common evasion techniques.

### 2. Hash Everything — Store Nothing Identifiable

Privacy matters. We never store raw IPs or raw fingerprints. Instead:

```
hashedIP          = SHA-256( HASH_SALT + ":" + rawIP )
fingerprintHash   = SHA-256( HASH_SALT + ":" + rawFingerprint )
```

The `HASH_SALT` is a secret env variable. This means:
- The database contains **zero PII** — only irreversible hashes.
- Even if the DB leaks, nobody can reverse-engineer IP addresses or fingerprints.
- The salt prevents rainbow-table attacks against known IP ranges.

### 3. Enforce Uniqueness at the Database Level

We don't just check in application code — we set a **compound unique index** on the `Vote` model:

```js
voteSchema.index({ pollId: 1, fingerprintHash: 1 },    { unique: true });
```

This means MongoDB itself will reject a duplicate vote with error code `11000`, even under race conditions or concurrent requests. The application catches this and returns a `403 Forbidden — "You have already voted on this poll."` error.

> **Why not IP?** Using IP for uniqueness would block multiple legitimate users on the same network (e.g., a college WiFi or office). Browser fingerprints are device-specific, so each person gets their own vote.

### 4. Add a Client-Side Layer (localStorage)

As an extra UX convenience, the client stores `{ pollId: optionId }` in `localStorage` under the key `voted_polls`. This:
- Instantly shows the user they've already voted (no round-trip needed).
- Disables the vote buttons and reveals results view.
- Is **not** relied upon for security — it's purely cosmetic. The real enforcement is server-side.

### 5. Real-Time Updates via WebSockets

Polling (pun intended) the server for results is wasteful. Instead:
- When a user opens a poll page, the client joins a Socket.IO room (`poll_{id}`).
- When any user casts a vote, the server broadcasts the updated results to **everyone** in that room.
- The UI updates instantly — vote counts and percentage bars animate in real time.

### 6. Dual Voting Path (REST + WebSocket)

Votes can be submitted through **two channels**:

| Channel | Endpoint | Use Case |
|---|---|---|
| REST | `POST /api/votes` | Fallback, works if WebSocket fails |
| WebSocket | `submit_vote` event | Primary path, gets acknowledgement callback |

Both paths funnel into the same `castVote()` service function, so the uniqueness logic is shared and consistent.

---

## Unique Vote Enforcement — Browser Fingerprint

Here's the complete flow for how a vote is validated:

```
User clicks "Vote"
       │
       ▼
┌─────────────────────┐
│  Client: generate    │
│  browser fingerprint │  ← FingerprintJS visitorId
│  via FingerprintJS   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Client: emit        │
│  submit_vote via     │  → { pollId, optionId, fingerprint }
│  Socket.IO           │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Server: extract IP  │  ← X-Forwarded-For or socket.handshake.address
│  from connection     │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Server: hash both   │
│  IP and fingerprint  │  → SHA-256 with secret salt
│  (never store raw)   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Server: insert Vote │
│  into MongoDB        │  → unique index on (pollId + fingerprintHash)
│                      │
└────────┬────────────┘
         │
    ┌────┴─────┐
    │  Success │  → Increment option.voteCount & poll.totalVotes
    │          │  → Broadcast updated results to all clients in room
    └──────────┘
         │
    ┌────┴──────────┐
    │  Duplicate     │  → MongoDB error 11000
    │  (code 11000)  │  → Return 403: "You have already voted"
    └───────────────┘
```

### What Each Layer Catches

| Attack Vector | Blocked By |
|---|---|
| Same browser, same device, vote again | Fingerprint hash unique index |
| Switch to incognito / different browser profile | Fingerprint hash unique index (FingerprintJS is stable across incognito) |
| Clear cookies / localStorage | Fingerprint hash unique index (fingerprint survives cookie clears) |
| Use a VPN to change IP | Fingerprint hash unique index |
| Different device on same network | **Allowed** — each device has a unique fingerprint, so each person can vote |
| Different device + VPN | **Not blocked** — this requires authentication to solve |
| Bot / script spamming | Rate limiter (5 votes/min per IP) + fingerprint unique index |

---

## Architecture Overview

```
┌──────────────────────────┐        ┌─────────────────────────────┐
│       Next.js Client     │        │       Express Server        │
│    (React 19 + App Dir)  │        │    (Node.js + Socket.IO)    │
│                          │        │                             │
│  ┌────────────────────┐  │  HTTP  │  ┌───────────────────────┐  │
│  │  CreatePollForm    │──┼───────►│  │  POST /api/polls      │  │
│  └────────────────────┘  │        │  └───────────┬───────────┘  │
│                          │        │              │              │
│  ┌────────────────────┐  │  WS    │  ┌───────────▼───────────┐  │
│  │  PollPage +        │◄─┼───────►│  │  Socket.IO Handlers   │  │
│  │  usePollSocket     │  │        │  │  (join/leave/vote)    │  │
│  └────────────────────┘  │        │  └───────────┬───────────┘  │
│                          │        │              │              │
│  ┌────────────────────┐  │        │  ┌───────────▼───────────┐  │
│  │  FingerprintJS     │  │        │  │  Vote Service         │  │
│  │  (browser hash)    │  │        │  │  (hash + deduplicate) │  │
│  └────────────────────┘  │        │  └───────────┬───────────┘  │
│                          │        │              │              │
│  ┌────────────────────┐  │        │  ┌───────────▼───────────┐  │
│  │  localStorage      │  │        │  │  MongoDB              │  │
│  │  (voted_polls)     │  │        │  │  (Polls, Options,     │  │
│  └────────────────────┘  │        │  │   Votes w/ indexes)   │  │
└──────────────────────────┘        │  └───────────────────────┘  │
                                    └─────────────────────────────┘
```

---

## Tech Stack

### Client
| Technology | Purpose |
|--|--|
| **Next.js 16** | React framework, App Router, SSR-ready |
| **React 19** | UI rendering |
| **Tailwind CSS 4** | Utility-first styling |
| **Socket.IO Client** | Real-time WebSocket connection |
| **FingerprintJS** | Browser fingerprinting for unique vote enforcement |

### Server
| Technology | Purpose |
|--|--|
| **Express 4** | HTTP API framework |
| **Socket.IO 4** | WebSocket server for real-time broadcasts |
| **Mongoose 8** | MongoDB ODM with schema validation |
| **nanoid** | Short, URL-safe unique IDs for polls (10 chars) |
| **Helmet** | Security headers |
| **express-rate-limit** | Rate limiting (5 votes/min, 10 poll creates/min) |
| **express-mongo-sanitize** | Prevents NoSQL injection (`$gt`, `$ne`, etc.) |
| **dotenv** | Environment variable management |

---

## Project Structure

```
├── client/                       # Next.js frontend
│   ├── app/
│   │   ├── page.js               # Home — create a poll
│   │   ├── layout.js             # Root layout with metadata
│   │   ├── globals.css           # Tailwind imports
│   │   ├── poll/[id]/page.js     # Poll voting & results page
│   │   ├── components/
│   │   │   ├── CreatePollForm.js # Poll creation form (2-10 options)
│   │   │   ├── PollOptions.js    # Vote buttons + animated result bars
│   │   │   ├── ShareLink.js      # Copy-to-clipboard share URL
│   │   │   ├── ErrorCard.js      # Error display with retry
│   │   │   └── Spinner.js        # Loading spinner
│   │   ├── hooks/
│   │   │   └── usePollSocket.js  # Socket.IO hook (join room, submit vote, live updates)
│   │   └── lib/
│   │       ├── api.js            # REST API client (fetch wrapper)
│   │       ├── fingerprint.js    # FingerprintJS loader & cache
│   │       ├── socket.js         # Socket.IO singleton with reconnection
│   │       └── storage.js        # localStorage voted_polls tracker
│   └── package.json
│
├── server/                       # Express backend
│   ├── server.js                 # HTTP + Socket.IO server bootstrap
│   ├── app.js                    # Express app (middleware, routes)
│   ├── config/
│   │   ├── db.js                 # MongoDB connection (mongoose)
│   │   └── env.js                # Env vars with defaults (frozen object)
│   ├── models/
│   │   ├── poll.model.js         # Poll schema (nanoid _id, question, totalVotes, expiresAt)
│   │   ├── option.model.js       # Option schema (text, voteCount, pollId ref)
│   │   └── vote.model.js         # Vote schema (hashedIP, fingerprintHash, unique indexes)
│   ├── services/
│   │   ├── poll.service.js       # Create poll, get poll, get results
│   │   └── vote.service.js       # Cast vote (validate → hash → insert → broadcast)
│   ├── controllers/
│   │   ├── poll.controller.js    # REST handlers for poll CRUD
│   │   └── vote.controller.js    # REST handler for vote submission
│   ├── routes/
│   │   ├── poll.routes.js        # POST / | GET /:id | GET /:id/results
│   │   └── vote.routes.js        # POST /
│   ├── sockets/
│   │   └── poll.socket.js        # Socket.IO event handlers (join, leave, vote, results)
│   ├── middleware/
│   │   ├── asyncWrap.js          # Async error catcher (no try/catch in controllers)
│   │   ├── errorHandler.js       # Central error response formatter
│   │   └── rateLimiter.js        # Rate limiters for votes + poll creation
│   └── utils/
│       ├── errors.js             # Custom error classes (AppError, NotFoundError, etc.)
│       ├── hash.js               # SHA-256 hashing with salt
│       ├── ip.js                 # Client IP extraction from headers
│       └── sanitize.js           # Input sanitization (strip <>{}/\$)
└── package.json
```

---

## API Endpoints

### Polls

| Method | Path | Description | Rate Limit |
|--|--|--|--|
| `POST` | `/api/polls` | Create a new poll | 10 req/min |
| `GET` | `/api/polls/:id` | Get poll with options | — |
| `GET` | `/api/polls/:id/results` | Get poll results | — |

#### Create Poll — Request Body

```json
{
  "question": "What's your favorite language?",
  "options": ["JavaScript", "Python", "Rust", "Go"],
  "expiresAt": "2026-03-01T00:00:00.000Z"   // optional
}
```

### Votes

| Method | Path | Description | Rate Limit |
|--|--|--|--|
| `POST` | `/api/votes` | Cast a vote | 5 req/min |

#### Cast Vote — Request Body

```json
{
  "pollId": "a1b2c3d4e5",
  "optionId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "fingerprint": "fp_visitor_id_string"
}
```

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|--|--|--|
| `join_poll` | `pollId` (string) | Join a poll room for live updates |
| `leave_poll` | `pollId` (string) | Leave a poll room |
| `submit_vote` | `{ pollId, optionId, fingerprint }` | Submit a vote (with ack callback) |
| `request_results` | `pollId` (string) | Request current results (with ack callback) |

### Server → Client

| Event | Payload | Description |
|--|--|--|
| `vote_update` | Full poll results object | Broadcast to all clients in the poll room after a vote |

---

## Security & Hardening

| Layer | Implementation |
|--|--|
| **Helmet** | Sets security headers (CSP, X-Frame-Options, etc.) |
| **CORS** | Whitelisted origins only (`CLIENT_URL` env var) |
| **Rate Limiting** | 5 votes/min, 10 poll creations/min per IP |
| **NoSQL Injection** | `express-mongo-sanitize` strips `$` and `.` from input |
| **Input Sanitization** | Custom sanitizer strips `< > { } $ / \` from strings |
| **Request Size** | Body limited to 10KB (`express.json({ limit: "10kb" })`) |
| **IP Hashing** | SHA-256 + salt — raw IPs never stored |
| **Fingerprint Hashing** | SHA-256 + salt — raw fingerprints never stored |
| **DB-Level Uniqueness** | Compound unique indexes prevent race-condition duplicates |
| **Custom Error Classes** | Operational errors expose safe messages; unexpected errors return generic 500 |
| **Trust Proxy** | `app.set("trust proxy", 1)` for correct IP behind reverse proxy |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **MongoDB** (local or Atlas)

### 1. Clone the repo

```bash
git clone <repo-url>
cd polling-app
```

### 2. Set up the server

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/polling
CLIENT_URL=http://localhost:3000
HASH_SALT=your-random-secret-salt-here
NODE_ENV=development
```

Start the server:

```bash
npm run dev
```

### 3. Set up the client

```bash
cd client
npm install
```

Create a `.env.local` file in `client/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

Start the client:

```bash
npm run dev
```

The app will be running at **http://localhost:3000**.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Default | Description |
|--|--|--|
| `PORT` | `4000` | Server port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/polling` | MongoDB connection string |
| `CLIENT_URL` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `HASH_SALT` | `default-salt-change-in-production` | Salt for hashing IPs and fingerprints |
| `NODE_ENV` | `development` | Environment mode |

### Client (`client/.env.local`)

| Variable | Default | Description |
|--|--|--|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` | Socket.IO server URL |

---

## Design Decisions

| Decision | Why |
|--|--|
| **nanoid for poll IDs** | Short (10 chars), URL-safe, no ObjectId exposure |
| **Separate Option model** | Allows atomic `$inc` on vote counts without poll-level write locks |
| **Separate Vote model** | Clean unique-index enforcement; easy to query vote history |
| **Socket.IO rooms** | Only subscribers of a specific poll get updates — efficient fan-out |
| **FingerprintJS (free tier)** | Good-enough browser fingerprinting without paid APIs |
| **Hashing with salt** | Privacy-preserving uniqueness — we prove "same voter" without knowing who |
| **No user accounts** | Lower friction = more participation. Security comes from browser fingerprint |
| **localStorage as UX hint** | Instant "you voted" state on page load, without hitting the server |
| **Dual REST + WS vote path** | Graceful degradation if WebSocket connection drops |