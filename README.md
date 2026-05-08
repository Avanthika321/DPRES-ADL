# CrisisCraft 🚨  
**Disaster Preparedness & Crisis Management System**

CrisisCraft is a full-stack educational platform designed to empower students and educators with **disaster preparedness and crisis management skills**. The platform provides interactive learning through a multi-portal management system.

---

## 🌟 Features

### 👨‍💼 Admin Portal
- System-wide management
- User management (add/remove users)
- Emergency alerts (Real-time global broadcasts)
- Reports & analytics

### 👩‍🏫 Teacher Portal
- Upload learning modules (PDF support)
- Manage quizzes and interactive content
- Track student performance
- Monitor drill participation

### 👨‍🎓 Student Portal
- Interactive learning dashboard
- View learning modules and take quizzes
- Participate in virtual drills
- Earn achievements and points
- View leaderboard

---

## 🔐 Authentication
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Secure session management

---

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3 (Vanilla)
- Vanilla JavaScript
- Modern UI with glassmorphism effects

### Backend
- Node.js
- Express.js
- JWT Authentication

### Database
- MongoDB
- Mongoose ORM

---

## 📂 Project Structure

```bash
DPRES-ADL/
├── backend/                # Backend Express application
│   ├── config/             # Database & environment config
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth & role middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   └── server.js           # Main entry point
├── frontend/               # Frontend Vanilla application
│   ├── index.html          # Main UI structure
│   ├── style.css           # Custom styling
│   ├── app.js              # Core logic
│   └── api.js              # API helpers
├── index.html              # Root entry (for deployment)
├── style.css               # Root styles
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ and npm
- MongoDB database (Local or Atlas)

### 2. Clone the Repository
```bash
git clone https://github.com/Avanthika321/DPRES-ADL.git
cd DPRES-ADL
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Return to root
cd ..
```

### 4. Configure Environment Variables
Create a `.env` file inside the `backend/` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```

### 5. Initialize Database
```bash
cd backend
node populate-db.js
```

### 6. Start Development Server
```bash
cd backend
npm run dev
```

### 7. Access the Application
- **Backend API**: `http://localhost:5000`
- **Frontend**: Open `index.html` in the root or serve it via a live server.

---

## 👤 Default Credentials

*   **Admin**: `admin@crisiscraft.edu` / `admin`
*   **Teacher**: `jane.smith@crisiscraft.edu` / `teacher`
*   **Student**: `student@crisiscraft.edu` / `student`

---

## 👥 Team Members
- Avanthika P S
- Gokuladharshini M
- Harini M
- Shivani Prithika K K

---

## 📄 License
Academic Project – For Educational Use Only
