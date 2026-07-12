Here is the translated English version of the README document, maintaining the professional formatting and technical terms used in your original draft.

---

# 📅 Session Scheduler Integration System v2.2

A powerful, **real-time multi-user schedule coordination and session management platform** built on the Svelte 5 and Firebase cloud ecosystem. It fully automates the complex workflow of intermediate managers who need to collect schedule surveys from multiple participants—such as band rehearsals, seminars, interviews, and meetings—and visually analyze overlapping times to derive the optimal time slots.

---

## ✨ Features

### 🔐 1. Authentication & Multi-Permission Mapping

* **OAuth Social Login Integration**: Built-in Google login interactions driven by Firebase Auth, with support for extending integrations to Naver, Kakao, and Instagram social accounts.


* **Email-Based Access Control**: Based on specified email permission mapping conditions during session creation, access is granularly split into Administrator (Edit/Confirm permissions) and View-Only (Viewer) rights, inheriting and securely managing permissions downward.



### 🛠️ 2. Flexible Session Scheduling & Lifecycle Management

* **Variable Scheduling Options**: Set specific start and end dates within a flexible range from a minimum of 1 day up to a maximum of 4 weeks (1 month) directly via the calendar interface.


* **Custom Time Slots**: Granularly configure time slot intervals at 30, 60, or 120-minute steps to match the specific nature of the gathering.


* **Participant Constraint Adjustments**:
* **Unspecified Mode**: Anyone with the link can freely participate.


* **Specified Mode**: Restricts access and submissions exclusively to a pre-registered list of designated guests.




* **Secure Deletion Mechanism**:
* **Soft Delete (Archive)**: Hides the session from the active dashboard while safely preserving data in an archivable state for potential recovery.


* **Deep Delete (Permanent Deletion)**: Permanently and physically purges data from the database, preventing any future recovery.





### 📊 3. Real-Time Response Analysis & Decision Support (Dashboard)

* **Real-Time Response Monitoring Pipeline**: Tracks submission statuses in real time, showing the completed headcount alongside a list of non-respondents against the total target audience.


* **Attendance Density Heatmap**: Runs computations on overlapping availability matrices submitted by multiple guests to automatically surface the **TOP 3 optimal time slots** in order of highest density.


* **Unified Calendar View**: Provides a Google Calendar-style daily and monthly layout where users with appropriate read permissions can review filtered views of categories and session schedules at a glance.



### 📱 4. Innovative Mobile/PC Guest Survey Interactions

* **0.2s Hold & Press Vertical Drag (Core Solution)**: Pressing and holding a time cell for 0.2 seconds activates the selection mode, enabling users to seamlessly drag downward to select consecutive time slots within the same date in one go (equipped with haptic vibration feedback).


* **Security & Integrity Validation**: Submissions strictly require entering a legal real name post-social login verification, reinforced by robust logic preventing duplicate submissions based on device and account identifiers alongside predefined response deadlines.



### 📥 5. Versatile Preprocessed Data Export (File Export)

* **Analytical Ready Formats**: Supports direct exports to `CSV` and `XLSX` formats, as well as a live integration pipeline to stream data directly into `Google Sheets` for external data preprocessing.


* **Dynamic Range Layout Export**: When extracting to `PDF` or `PNG/JPG`, the system dynamically alters the layout depending on the duration—rendering a clean **Image Calendar** for schedules under 1 week, and shifting to an aggregate density **Timeline Chart** for schedules exceeding 1 week.



---

## 🛠️ Tech Stack

### Client Side

* **Framework**: Svelte 5 (Powered by the Runes state management engine)


* **Build Tool & Bundler**: Vite 6, TypeScript 5.8


* **Styling**: Tailwind CSS v4, Lucide Svelte (Icon Pack), Motion (Animation)


* **Export Engine**: html2canvas, html-to-image, jspdf, jspdf-autotable



### Backend & Cloud Infrastructure

* **Database & Auth**: Firebase v12 (Firestore Cloud DB, Firebase Authentication)


* **Server-side Server**: Express v4 (Optimized for Node.js 22+ / 24 environments)


* **Automated Print**: Puppeteer (Backend headless browser-based high-resolution variable layout PDF renderer)



---

## 📂 Directory Structure

```text
Class-Session-Schedule-Management-Dev/
├── _setup/                 # Automated provisioning & infrastructure deployment scripts (sh/ps1)
├── server/                 # Puppeteer-based variable layout backend server logic
│   └── pdfExport.ts        # Backend pure HTML calendar parsing & PDF export engine
├── src/
│   ├── components/         # Svelte 5 component slot architecture
│   │   ├── Dashboard.svelte# Unified admin monitoring dashboard
│   │   ├── Detail.svelte   # Real-time Heatmap & TOP 3 recommended slot analysis page
│   │   ├── Survey.svelte   # Guest survey view with 0.2s long-press drag interaction
│   │   └── CalendarPage.svelte # Google Calendar-style filtered view panel
│   ├── lib/
│   │   ├── db.ts           # Firestore CRUD operations & real-time offline sync logic
│   │   └── firebase.ts     # Firebase cloud initialization module
│   ├── utils/
│   │   ├── date.ts         # Variable weekly layout chunking & date math utilities
│   │   └── export.ts       # CSV / XLSX / PDF / PNG client-side export utilities
│   ├── App.svelte          # Global navigation router & state control tower
│   └── types.ts            # Static typing specifications (Session, Category, Guest schemas)
├── firebase.json           # Cloud Firestore security rules & index manifests
├── firestore.rules         # Global security rulesets for account-level data isolation
└── vite.config.ts          # Vite bundling acceleration configurations

```

---

## 🚀 Installation & Setup

This project features a built-in **automated deployment pipeline** that handles complex Firebase Cloud hosting configurations and infrastructure setup in one execution.

### Prerequisites

* **Node.js**: v22 or v24 and above highly recommended.



### Environment Variable Configuration (`.env`)

Create a `.env` file in the root directory and supply the system administrator account details according to the format below.

```env
VITE_SYSTEM_ADMIN_EMAIL=example@gmail.com

```

### 1. Trigger the Deployment & Automated Provisioning Process

Run the script corresponding to your operating system in your terminal. This fully automates dependency resolution (`npm i`), remote Firebase CLI authentication hooks, project selection, and cloud resource provisioning.

* **Windows (PowerShell)**:

```powershell
Invoke-RestMethod -Uri "https://raw.githubusercontent.com/mireu-lab/class-session-schedule-management/setup.ps1" | Invoke-Expression

```

* **Linux / macOS (Bash)**:

```bash
curl -sSL https://raw.githubusercontent.com/mireu-lab/class-session-schedule-management/setup.sh | bash

```

### 2. Run the Local Development Server

Once the automated architecture provisioning is complete, launch the local environment to start developing:

```bash
npm run dev

```

---

### 💡 Documentation Reference Notes:

1. **Tech Stack Specification**: Formulated by inspecting `package.json` and `package-lock.json` to clearly chart the structural interplay between Svelte 5, Tailwind 4, Node 22+ companion infra scripts (`setup.sh`, `setup.ps1`), and the programmatic rendering engine pipeline (`Puppeteer`, `jspdf`, `html2canvas`).


2. **Core Architectural Innovation**: Strategically emphasizes the high-impact **"0.2s Hold & Press Vertical Drag UX Interaction"** and **"Heatmap-based TOP 3 Time Slot Algorithm"** features at the top tier of the feature directory to elevate open-source competitiveness.
