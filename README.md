# NISC Secure Election System

> **STATUS:** PHASE 1 COMPLETE  
> *Authentication and voting functionality are intentionally not implemented yet.*

---

## 1. Project Overview

The **NISC Secure Election System** is a high-assurance, tamper-resistant digital voting application built for the **National Institute Student Council (NISC)**. 

### Key System Specifications (Full Scope)
* **Eligible Voters:** Exactly 70 allowlisted student members.
* **Voting Quota:** Exactly 1 vote per approved voter (immutable, non-resettable).
* **Candidates:** 3 official candidate seats.
* **Single Administrator:** `skm151412@gmail.com`
* **Election Lifecycle:** `UPCOMING` → `OPEN` → `CLOSED` → `RESULTS` (strictly linear, manual admin control).
* **Auditability:** Designated admin can always audit who voted for whom and export participation metrics as CSV.

---

## 2. Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
* **Backend & Database:** Firebase Authentication (Google OAuth), Cloud Firestore, Firebase Cloud Functions (Node 20 runtime)
* **Security & Infrastructure:** Firebase App Check, Firebase Security Rules (`firestore.rules`), Firebase Emulator Suite, Firebase Hosting

---

## 3. Security Architecture

The application is built on a **Zero-Trust Client** model:
1. **Frontend Untrusted:** The client browser is never treated as an authority. Frontend states (`isAdmin`, `hasVoted`, `role`) govern presentation only.
2. **Deny-by-Default Database Rules:** All Firestore collections (`members`, `admins`, `elections`, `candidates`, `ballots`, `auditLogs`) are protected by strict security rules.
3. **No Insecure Client Claims:** Roles are resolved against authoritative Firestore collections and server-side Cloud Functions.
4. **Data Isolation:** Ballots are write-once and protected against any client-side update or deletion.

---

## 4. Project Structure

```text
├── .env.example               # Template of required environment variables
├── .firebaserc                # Firebase CLI project binding
├── .gitignore                 # Secrets, logs, and build artifacts exclusion
├── firebase.json              # Firebase Emulators, Firestore, Functions & Hosting config
├── firebase-blueprint.json    # Formal data model and collection schema definition
├── firestore.rules            # Deny-by-default security rules
├── firestore.indexes.json     # Firestore composite index declarations
├── functions/                 # Trusted server-side Cloud Functions
│   ├── package.json           # Functions dependencies (firebase-admin, firebase-functions)
│   ├── tsconfig.json          # Functions TypeScript compilation config
│   └── src/
│       └── index.ts           # Cloud Functions entry point (healthCheck & server operations)
├── metadata.json              # Platform metadata & permissions
├── package.json               # Frontend dependencies & emulator scripts
└── src/
    ├── App.tsx                # Application root with layout & page routing
    ├── main.tsx               # Entry mount
    ├── index.css              # Tailwind CSS styles
    ├── config/
    │   ├── constants.ts       # NISC domain constants (admin email, counts, collections)
    │   └── firebase.ts        # Environment variable loader
    ├── types/
    │   ├── election.ts        # ElectionStatus enum, Election & Candidate interfaces
    │   ├── member.ts          # Member, Admin, AdminRole types
    │   ├── ballot.ts          # Ballot type (write-once)
    │   ├── audit.ts           # AuditLog, AuditEventType types
    │   └── index.ts           # Barrel export & FirebaseConfigStatus
    ├── services/
    │   ├── firebase.ts        # Central Firebase App/Auth/Firestore/Functions init
    │   ├── appCheck.ts        # Firebase App Check configuration
    │   └── firestoreErrors.ts # Secure error handling & sanitization
    ├── hooks/
    │   └── useFirebase.ts     # React hook for Firebase readiness & auth state
    ├── utils/
    │   ├── formatters.ts      # Lifecycle status labels & timestamp formatting
    │   └── logger.ts          # Safe logger (redacting sensitive keys & tokens)
    ├── components/
    │   ├── common/
    │   │   ├── Badge.tsx      # Lifecycle status badges
    │   │   ├── Card.tsx       # Standard card container
    │   │   ├── Header.tsx     # Navigation header with system health indicator
    │   │   ├── Footer.tsx     # Institutional footer
    │   │   ├── LoadingSpinner.tsx
    │   │   └── ErrorMessage.tsx
    │   └── layout/
    │       └── AppLayout.tsx  # Responsive application layout shell
    └── pages/
        ├── HomePage.tsx       # Architecture & foundation dashboard
        ├── LoginPage.tsx      # Authentication gateway specification placeholder
        ├── ElectionPage.tsx   # Election lifecycle & candidate schema placeholder
        └── AdminPage.tsx      # Governance & auditability specification placeholder
```

---

## 5. Environment Variables

Configure the following environment variables in `.env` (refer to `.env.example`):

```bash
# Firebase Client Configuration (nisc-2026)
VITE_FIREBASE_API_KEY="AIzaSyC9u3O-N7WE7C5gTkh__pXyrLNt84tqtF0"
VITE_FIREBASE_AUTH_DOMAIN="nisc-2026.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="nisc-2026"
VITE_FIREBASE_STORAGE_BUCKET="nisc-2026.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="252912759752"
VITE_FIREBASE_APP_ID="1:252912759752:web:f21200eaf84761ce7906fd"
VITE_FIREBASE_APPCHECK_SITE_KEY=""
VITE_USE_FIREBASE_EMULATOR="false"
VITE_FIREBASE_DATABASE_ID="(default)"
```

---

## 6. Local Development & Firebase Emulator Suite

### Running Frontend
```bash
npm run dev
```

### Running with Firebase Emulators
```bash
# Start local emulators (Auth, Firestore, Functions, Hosting)
npm run emulators

# Or run only core backend emulators:
npm run emulators:core
```

Default Emulator Ports:
* **Auth Emulator:** `127.0.0.1:9099`
* **Firestore Emulator:** `127.0.0.1:8080`
* **Functions Emulator:** `127.0.0.1:5001`
* **Hosting Emulator:** `127.0.0.1:5000`
* **Emulator UI Suite:** `http://127.0.0.1:4000`

---

## 7. Current Phase Status

```text
=========================================================
PHASE 1 COMPLETE
Authentication and voting functionality are intentionally 
not implemented yet.
=========================================================
```
