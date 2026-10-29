# MS CodeQuest Leaderboard & Integrated Admin Panel 🏆

An enterprise-grade, responsive programming competition leaderboard and contest management portal built with **React**, **Vite**, **Tailwind CSS**, **SheetJS (xlsx)**, **Express**, and **MongoDB** (with persistent cloud storage & Supabase support).

MS CodeQuest allows administrators to import contest results directly from raw Excel (`.xlsx`, `.xls`) or CSV exports without any third-party API dependencies, validate and map columns, configure tie-breaking rules, and publish live results with a **Surprise Award Ceremony Reveal Flow**.

---

## 🌟 Key Features

### 1. Surprise Award Ceremony Reveal Flow 🎉
When the administrator publishes official contest results, the public leaderboard activates **Surprise Award Ceremony Mode** to keep the competition suspenseful:
1. **Initial State (All Ranks Hidden)**:
   - Standings table is sealed behind a mystery banner.
   - Top 3 champions podiums (1st, 2nd, 3rd) are mystery cards with question marks and sealed details.
2. **Step 1: Preview Ranks 4+ (Remaining Top Rankers)**:
   - Viewer clicks the prominent **"Preview Remaining Top Rankers (Rank 4+)"** button.
   - Unveils contestants from Rank 4 downwards while keeping the top 3 podium spots hidden.
3. **Step 2: Unveil 3rd Place (Bronze Medalist)**:
   - Clicking **"Step 2: Reveal 3rd Place (Bronze)"** triggers a warm bronze confetti explosion and reveals the 3rd place champion, score, university, and stats.
4. **Step 3: Unveil 2nd Place (Silver Medalist)**:
   - Clicking **"Step 3: Reveal 2nd Place (Silver)"** triggers a metallic silver confetti burst and unveils the 2nd place runner-up.
5. **Step 4: Unveil Grand Champion (1st Place Gold)**:
   - Clicking **"Step 4: Reveal Grand Champion (1st Place Gold)"** triggers a massive celebratory fireworks/confetti explosion and crowns the #1 Champion with custom golden crown styling.
6. **Replay & Fast-Forward**:
   - Includes **"Replay Surprise Ceremony"** to restart the ceremony sequence anytime, and **"Reveal All Instantly"** for quick access.

### 2. Administrator Authentication (`thinuka` / `thinuka@123`)
- **Username**: `thinuka`
- **Password**: `thinuka@123`
- The login modal includes a **"Click to Auto-Fill (thinuka)"** shortcut for immediate 1-click access.

### 3. MongoDB Database Integration
- Connected to MongoDB Atlas cluster:
  ```env
  MONGODB_URI="mongodb+srv://thinukavinjayauni_db_user:jwxhfzgI9UZ1JgD8@cluster0.r4abpam.mongodb.net/?retryWrites=true&w=majority"
  ```
- Backend Express server (`server/index.js`) on port 5000:
  - `POST /api/admin/login`: verifies `thinuka` with `thinuka@123`
  - `GET /api/leaderboard`: fetches latest published contest & participants from MongoDB
  - `POST /api/publish`: persistently saves competition, contestants, and publication history
  - `GET /api/history`: audit log of past publications
- Includes resilient offline-first caching and fallback mechanisms so that if Atlas requires IP whitelisting, the app continues to operate without breaking.

### 4. Excel Import, Column Mapping & Olympic Tie-Breaking
- Drag-and-drop or browse `.xlsx`, `.xls`, `.csv` files.
- Client-side parsing via **SheetJS (`xlsx`)**.
- Auto-detection and manual column mapping (Username, Name, Score, Solved, Time Penalty, Submissions, Institution).
- Real-time row validation flagging invalid scores, missing handles, and duplicates.
- Tie-breaking rules:
  - *Solved DESC → Time Penalty ASC → Submissions ASC → Username ASC*
  - *Solved DESC → Submissions ASC*
  - *Score Only*
- Olympic Standard Ties (`1, 2, 2, 4`) and Dense Ranking (`1, 2, 2, 3`).

---

## 🚀 Running the Project

### 1. Start Both Frontend and Backend

In Terminal 1 (Backend Express Server):
```bash
npm run server
```

In Terminal 2 (Frontend React App):
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Admin Login Credentials

- **Username**: `thinuka`
- **Password**: `thinuka@123`
