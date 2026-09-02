# NISC Election Portal

The **NISC Election Portal** is a secure, institutional digital voting application designed for the **National Institute Student Council (NISC)** elections. The platform provides a streamlined and trustworthy election experience, enabling eligible student voters to view candidate profiles, cast verified ballots, and view certified election outcomes.

---

## Features

- **Google Authentication**: Seamless sign-in using Google accounts to authenticate voter identity.
- **Registered-Voter Allowlist**: Access control enforcing that only authorized student members on the official electoral roll can participate in voting.
- **Candidate Profiles**: Comprehensive candidate information including names, codenames, position platforms, and detailed vision statements.
- **Secure Voting**: Protected voting workflow with clear confirmation dialogs to prevent accidental submissions.
- **One-Vote-Per-Voter Protection**: Authoritative validation guaranteeing exactly one ballot per eligible voter with non-resettable vote tracking.
- **Election States**: Strict four-state election lifecycle:
  - `Upcoming`: Pre-election state where candidate profiles are browsable, but voting has not started.
  - `Live`: Active voting is open for all eligible voters.
  - `Paused`: Voting is temporarily suspended by administrators.
  - `Finished`: Election has permanently concluded and official results are published.
- **Admin Election Controls**: Real-time management interface for election administrators to control status transitions and view participation metrics.
- **Election Results**: Publicly accessible certified results and candidate tally metrics once the election is concluded.
- **Firebase Firestore Backend**: Scalable, real-time database managing election metadata, allowlist verification, and ballot tracking.
- **Firebase Hosting Deployment**: Fast, secure global hosting with static asset delivery and SPA routing.

---

## Admin Controls

Authorized administrators manage the election lifecycle through dedicated administrative controls:

- **Start Election** (`Upcoming` → `Live`): Opens the election and enables voting for all verified voters on the allowlist.
- **Stop/Pause Election** (`Live` → `Paused`): Temporarily suspends active voting (e.g., during scheduled maintenance or quorum adjustments). Ballot submissions are temporarily disabled.
- **Resume Election** (`Paused` → `Live`): Resumes the voting period, re-enabling ballot submissions for voters who have not yet cast their vote.
- **Finish Election** (`Live` / `Paused` → `Finished`): Permanently concludes the election, locks all voting mechanisms, and publishes final certified results.
- **Finished Elections Cannot Be Restarted**: Once an election is marked as Finished, the state transition is permanent and irreversible to protect electoral integrity and finality.

---

## Technology Stack

- **Frontend Framework**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **UI Components & Icons**: Lucide React, Motion
- **Authentication**: Firebase Authentication (Google OAuth provider)
- **Database**: Cloud Firestore
- **Serverless Backend**: Firebase Cloud Functions (Node.js runtime)
- **Deployment & Emulation**: Firebase Hosting, Firebase Local Emulator Suite

---

## Firebase Configuration

The web client connects to Firebase services using environment variables loaded at build and development time by Vite.

Create a `.env` file in the root directory (based on `.env.example`) and configure the following required environment variables:

```bash
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIREBASE_APPCHECK_SITE_KEY=""
VITE_USE_FIREBASE_EMULATOR="false"
VITE_FIREBASE_DATABASE_ID="(default)"
```

> **Note**: Never commit sensitive credentials or private keys to source control.

---

## Local Development

### Prerequisites
- Node.js (v20+ recommended)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will be accessible locally at `http://localhost:3000`.

### 3. Production Build
To create an optimized production build:
```bash
npm run build
```
Compiled static assets are output to the `dist/` directory.

---

## Firebase Deployment

Deploy the project using the Firebase CLI:

### 1. Authenticate with Firebase
```bash
firebase login
```

### 2. Select the Firebase Project
```bash
firebase use nisc-2026
```

### 3. Build the Application
```bash
npm run build
```

### 4. Deploy All Resources
```bash
firebase deploy
```

The `firebase.json` configuration will deploy:
- **Firestore Rules & Indexes**: Security rules (`firestore.rules`) and query indexes (`firestore.indexes.json`).
- **Cloud Functions**: Backend functions located in the `functions/` directory.
- **Firebase Hosting**: The compiled single-page application from the `dist/` directory.

---

## Production URL

Production URL:
[ADD AFTER DEPLOYMENT]

---

## Project Structure

```text
├── functions/                 # Backend Cloud Functions source and configuration
│   ├── src/index.ts           # Cloud Functions entry point
│   └── package.json           # Cloud Functions dependencies
├── public/                    # Static public assets
├── src/                       # Frontend application source
│   ├── components/            # Reusable UI, layout, voter, admin, and results components
│   │   ├── admin/             # Admin controls, status transition modal, and audit views
│   │   ├── common/            # Shared UI components (badges, cards, loaders, navigation)
│   │   ├── layout/            # Application layout shells and headers
│   │   ├── results/           # Results cards, charts, and pending state views
│   │   └── voter/             # Voter portal cards, ballots, and confirmation modals
│   ├── config/                # Election configuration, constants, and allowlist data
│   ├── hooks/                 # Custom React hooks for Firebase and auth state
│   ├── pages/                 # Main routed pages (Home, Login, Voter Portal, Admin, Results)
│   ├── services/              # Firebase, election, admin, and voting service layers
│   ├── types/                 # Shared TypeScript type and interface definitions
│   ├── utils/                 # Formatting utilities, logger, and security helpers
│   ├── App.tsx                # Top-level application component and route management
│   ├── index.css              # Global styles and Tailwind CSS imports
│   └── main.tsx               # Client entry point mounting React root
├── .env.example               # Template for required environment variables
├── firebase.json              # Firebase CLI deployment and emulator configuration
├── firestore.rules            # Firestore security and access control rules
├── firestore.indexes.json     # Firestore composite index definitions
├── package.json               # Project manifest, scripts, and dependencies
├── tsconfig.json              # TypeScript compiler configuration
└── vite.config.ts             # Vite build and plugin configuration
```

---

## Security Notes

- **Role & Authorization Checks**: User permissions and voter eligibility are strictly validated server-side against authorized member records and designated administrative profiles.
- **Ballot Immutability**: Ballots are write-once records; once cast, a voter's ballot cannot be modified or re-cast.
- **Concealed Results**: Election vote totals remain concealed during the active voting phases to prevent early result leakage and maintain voting fairness.
- **Secure Communication**: All API communication and database operations utilize HTTPS and encrypted connections.
