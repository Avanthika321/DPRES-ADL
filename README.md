# CrisisCraft 🚨  
**Disaster Preparedness & Crisis Management System**

CrisisCraft is a full-stack educational platform designed to empower students and educators with **disaster preparedness and crisis management skills**. The platform provides interactive learning through a multi-portal management system.

---

## 🌟 Features

### 👨‍💼 Admin Portal
- System-wide management
- User management (add/remove users)
- Emergency alerts
- Reports & analytics

### 👩‍🏫 Teacher Portal
- Upload learning modules
- Manage quizzes
- Track student performance
- Monitor drill participation

### 👨‍🎓 Student Portal
- View learning modules
- Take quizzes
- Participate in virtual drills
- Earn achievements and points
- View leaderboard

---

## 🔐 Authentication
- JWT-based authentication
- Role-Based Access Control (RBAC)

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose ORM

---

## 📂 Project Structure

```bash
DPRES-ADL/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── app.js
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/DPRES-ADL.git
cd DPRES-ADL
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```

---

### 4. Initialize Database

```bash
cd backend
node populate-db.js
```

---

### 5. Start Development Server

```bash
npm run dev
```

---

### 6. Access the Application

Open in browser:

```bash
http://localhost:5000
```

---


## 👥 Team Members
- Avanthika P S
- Gokuladharshini M
- Harini M
- Shivani Prithika K K
---

## 📄 License
Academic Project – For Educational Use Only
