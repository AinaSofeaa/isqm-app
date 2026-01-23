
# 🏗️ ISQM Project Local Setup

Welcome! This guide will help you run the **Interactive Structure Quantity Measurement** app on your own computer.

## Step 1: Install Node.js
First, your computer needs a "runtime" to run JavaScript.
1. Go to [nodejs.org](https://nodejs.org/).
2. Download the **LTS (Long Term Support)** version.
3. Install it like a normal program.

## Step 2: Prepare your Folder
1. Create a new folder on your computer (e.g., on your Desktop) called `ISQM-App`.
2. Copy **all** the files from this project into that folder.

## Step 3: Open your Terminal
1. Open the folder `ISQM-App`.
2. On Windows: Click the address bar at the top, type `cmd`, and press Enter.
3. On Mac: Right-click the folder > "New Terminal at Folder".

## Step 4: Install and Run
In the terminal window, type these two commands one by one:

1. **Install the libraries:**
   ```bash
   npm install
   ```
   > Note: This project uses Supabase for Login + Database. You must set env vars (next section) before running.
2. **Start the app:**
   ```bash
   npm run dev
   ```

---

## Supabase Setup (Login + Database)

### 1) Create env file
Copy `.env.example` to `.env` and fill in your values:

```bash
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### 2) Create table (SQL)
In Supabase SQL editor, create a `calculations` table and enable RLS. Use the SQL provided in the project guide.

### 3) Enable Google login
Enable Google provider in Supabase Auth settings and add your Site URL + Redirect URLs.

## Step 5: View the App
The terminal will show a link like `http://localhost:3000`. 
- Hold **Ctrl** and click that link.
- Your browser will open, and you can see your app running!

---

## Tech Stack Used
- **React**: The logic for the interface.
- **TypeScript**: Ensures the code is stable and error-free.
- **Tailwind CSS**: The professional styling system.
- **Lucide React**: The high-quality icons.
- **Vite**: The "engine" that builds the project.
