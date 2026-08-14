# Kendriya Vidyalaya - School Management System

A simple, beginner-friendly, full-stack School Management System built using pure HTML, CSS, JavaScript, Node.js (Express), and MySQL.

---

## 📂 Project Structure

All core project code is organized in a flat, beginner-style structure at the root level:

*   **`index.html`** - Main user interface structure.
*   **`style.css`** - Custom stylesheet containing basic student-style CSS styling rules.
*   **`script.js`** - Client-side JavaScript handling page views and API requests.
*   **`server.js`** - Backend Express server containing API routes and SQL queries.
*   **`database.sql`** - Database schema containing 4 basic tables (`users`, `students`, `attendance`, `marks`).

---

## 🛠️ Setup Instructions

### 1. Database Setup
1. Open your local MySQL command line or phpMyAdmin.
2. Run the database configuration script:
   ```bash
   npm run seed
   ```
   *(Note: Ensure your local MySQL root password is set in `server.js` or matching your environment).*

### 2. Run the Server
1. Install Node modules:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm start
   ```
3. Open your browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Demo Accounts

*   **Admin**: `admin` / `Admin@123`
*   **Teacher**: `teacher1` / `Teacher@123`
*   **Student**: `student1` / `Student@123`
