# KLS GIT Exam Section — React + Vite Frontend

A clean, fast, easily-maintainable React site for the KLS Gogte Institute of Technology Examination Section. All notifications are stored in a single plain JavaScript file — no database, no backend, no WordPress required.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Reasoning](#2-tech-stack--reasoning)
3. [Repository Structure](#3-repository-structure)
4. [Quick Start (Local Development)](#4-quick-start-local-development)
5. [How to Add / Edit Notifications](#5-how-to-add--edit-notifications)
6. [How to Add PDF Files](#6-how-to-add-pdf-files)
7. [Deploying to Netlify](#7-deploying-to-netlify)
8. [Connecting a Custom Domain](#8-connecting-a-custom-domain)
9. [GitHub Workflow (Day-to-Day Updates)](#9-github-workflow-day-to-day-updates)
10. [Customisation Reference](#10-customisation-reference)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Project Overview

| What | Detail |
|------|--------|
| **Purpose** | Display exam-related notifications for KLS Gogte Institute of Technology |
| **Audience** | Students checking for results, timetables, registrations, hall tickets, etc. |
| **Update model** | A staff member edits one file (`src/data/notifications.js`) and pushes to GitHub — Netlify auto-deploys within ~30 seconds |
| **PDF hosting** | PDFs can be hosted in the repo (`public/pdfs/`) **or** linked directly from `git.edu`/`2025.git.edu` (existing links work as-is) |

---

## 2. Tech Stack & Reasoning

| Technology | Why |
|------------|-----|
| **React 18 + Vite** | Fast build, minimal config, familiar for modern JS devs |
| **Plain CSS (no framework)** | Zero dependency bloat; easy for a non-developer to tweak colours |
| **GitHub** | Version history, easy rollback, free for public repos |
| **Netlify** | Free tier, auto-deploys on every Git push, custom domain + HTTPS in minutes |
| **No backend / CMS** | Notifications are a simple list — a JS data file is sufficient and far easier to maintain than WordPress |

---

## 3. Repository Structure

```
git-exam-section/
├── public/
│   ├── pdfs/              ← Upload new PDF files here
│   ├── kls-logo.png       ← KLS logo (header left)
│   └── git_logo.jpg       ← GIT logo (header right + favicon)
├── src/
│   ├── components/
│   │   ├── Header.jsx              ← College name, logos, contact
│   │   ├── NotificationList.jsx    ← Search, filters, pagination
│   │   └── NotificationItem.jsx    ← Single notification row
│   ├── data/
│   │   └── notifications.js  ← ★ THE ONLY FILE YOU NEED TO EDIT ★
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── index.html
├── netlify.toml
├── vite.config.js
├── package.json
└── README.md
```

---

## 4. Quick Start (Local Development)

### Prerequisites
- [Node.js 18+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed
- A GitHub account

### Step-by-step

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/git-exam-section.git
cd git-exam-section

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser. The page hot-reloads whenever you save a file.

```bash
# 4. Build for production (optional — Netlify does this automatically)
npm run build
```

---

## 5. How to Add / Edit Notifications

Open **`src/data/notifications.js`**. Each entry follows this format:

```js
{
  date: "DD.MM.YYYY",
  text: "Full notification text.",
  pdf: "https://...",   // or a local path like "/pdfs/filename.pdf"
},
```

### To add a new notification

1. Open `src/data/notifications.js`
2. Add a new object at the **top** of the array:

```js
{
  date: "24.06.2026",
  text: "Approved 2nd Semester B.E. (All Branches) 2025 Scheme Hall Ticket Notification for Even Semester 2025-26.",
  pdf: "https://2025.git.edu/wp-content/uploads/2026/06/YOUR_FILE.pdf",
},
```

3. Save the file
4. Commit and push (see [Section 9](#9-github-workflow-day-to-day-updates))

> The app automatically sorts all entries by date (latest first), so order in the file does not matter. Adding at the top is recommended purely for readability.

---

## 6. How to Add PDF Files

### Option A — Link to the existing server (recommended for existing PDFs)
Use the full URL from `2025.git.edu` or `git.edu` in the `pdf` field. These links already work.

### Option B — Host PDFs in this repository (recommended for new PDFs)

1. Put the PDF in the `public/pdfs/` folder.
2. Reference it with a root-relative path:

```js
pdf: "/pdfs/SEE_TT_Even202526_NewFile.pdf",
```

> Keep PDF filenames short, lowercase, with hyphens — no spaces.

---

## 7. Deploying to Netlify

### First-time setup (do this once)

1. Go to [netlify.com](https://netlify.com) and sign in with your GitHub account.
2. Click **"Add new site" → "Import an existing project"**.
3. Choose **GitHub**, then select the `git-exam-section` repository.
4. The `netlify.toml` file in the repo sets the build config automatically. No manual fields needed.
5. Click **"Deploy site"**.

Netlify will build and deploy your site to a URL like `https://random-name-123.netlify.app`.

### After that — every push auto-deploys

Whenever you push a change to the `main` branch on GitHub, Netlify automatically rebuilds and publishes within ~30 seconds.

---

## 8. Connecting a Custom Domain

> Example: you want the site at `exam.git.edu`

### In Netlify

1. Go to your site dashboard → **"Domain management"** → **"Add custom domain"**.
2. Type your domain (e.g., `exam.git.edu`) and click **Verify**.
3. Netlify will show you a CNAME record to add:
   ```
   CNAME  exam  random-name-123.netlify.app
   ```

### In your DNS provider (whoever manages git.edu DNS)

4. Log in to the DNS control panel for `git.edu`.
5. Add a **CNAME record**:
   - **Name/Host:** `exam`
   - **Value/Points to:** `random-name-123.netlify.app`
   - **TTL:** 3600 (or default)
6. Wait 5–30 minutes for DNS to propagate.
7. Back in Netlify → **"Verify DNS configuration"** — it should turn green.
8. Netlify auto-provisions a free HTTPS certificate — click **"Provision certificate"** if prompted.

---

## 9. GitHub Workflow (Day-to-Day Updates)

### Using GitHub Desktop (recommended for non-developers)

1. Open **GitHub Desktop**.
2. Edit `src/data/notifications.js` in any text editor (Notepad, VS Code, etc.).
3. In GitHub Desktop, you'll see the changed file listed.
4. Write a short summary in the **"Summary"** box, e.g., `Add 24 June result notification`.
5. Click **"Commit to main"**.
6. Click **"Push origin"**.
7. Netlify deploys automatically — site is updated in ~30 seconds.

### Using command line

```bash
git pull
# edit src/data/notifications.js
git add src/data/notifications.js
git commit -m "Add 24 June 2026 SEE results notification"
git push
```

---

## 10. Customisation Reference

### Colours

Edit `src/App.css`. The key variables are near the top:

```css
:root {
  --color-primary: #1a237e;   /* Deep navy — header background */
  --color-accent:  #c62828;   /* GIT red — "NEW" badge, Clear button */
  --color-bg:      #f5f5f5;   /* Page background */
  --color-text:    #212121;   /* Body text */
  --color-border:  #e0e0e0;   /* Notification row dividers */
}
```

### Logos

- Left logo (KLS): replace `public/kls-logo.png`
- Right logo + favicon (GIT): replace `public/git_logo.jpg`

Header references are in `src/components/Header.jsx`.

### College name / contact

Edit `src/components/Header.jsx` directly — it contains the institution name, department, address, and phone number.

### "NEW" badge duration

In `src/components/NotificationItem.jsx`, the badge shows on items posted within the last **10 days**. Change `10` to any number:

```js
const isNew = daysSincePosted(item.date) <= 10;
```

### Pagination size

In `src/App.jsx`, change `PAGE_SIZE`:

```js
const PAGE_SIZE = 20;  // notifications per page
```

---

## 11. Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm install` fails | Make sure Node.js 18+ is installed: `node -v` |
| Page is blank locally | Run `npm run dev` and open the URL shown in the terminal |
| PDF link opens a 404 | Check the URL in `notifications.js`; test it in a browser first |
| Netlify build fails | Go to Netlify → "Deploys" → click the failed deploy → read the error log |
| Custom domain not resolving | DNS changes take up to 30 minutes; check with [dnschecker.org](https://dnschecker.org) |
| Changes not appearing on live site | Check Netlify deploy log; ensure you pushed to the `main` branch |

---

*Built for KLS Gogte Institute of Technology — Examination Section.*
*Maintained via GitHub + Netlify.*
