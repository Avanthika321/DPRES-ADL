CrisisCraft
CrisisCraft is a full-stack educational platform designed to empower students and educators with disaster preparedness and crisis management skills. The platform provides a comprehensive solution for interactive learning with a multi-portal management system. 
Features
Three Distinct Portals:
Admin Portal: System-wide management, global alerts, and user oversight.
Teacher Portal: Tools for uploading modules, managing content, and tracking student performance.
Student Portal: Interactive learning dashboard, module viewer, and point tracking system.
Authentication: Enhanced role-based access control (RBAC) using JWT.
Module Management: Complete lifecycle for educational content with PDF support.
Crisis Alerts: Real-time system broadcasts for emergency notifications.
Tech Stack
Frontend: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
Backend: Node.js with Express.js
Database: MongoDB with Mongoose ORM
Authentication: JWT-based auth with secure role-based permissions

Getting Started
Prerequisites
Node.js 18+ and npm
MongoDB database (Local or Atlas)
Installation
1.Clone the repository
git clone https://github.com/yourusername/DPRES-ADL.git
cd DPRES-ADL

2.Install dependencies


npm install

3.Set up environment variables
 Create a .env file in the backend/ directory with the following variables:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key

4.Initialize the database
cd backend
node populate-db.js

5.Start the development server
cd backend
npm run dev

6.Access the application 
The application will be available at: http://localhost:5000 (Backend) 
Open frontend/index.html in your browser to view the UI.
Project Structure
DPRES-ADL/
├── backend/                    # Node.js & Express Backend
│   ├── config/                 # Database & environment configuration
│   ├── controllers/            # Business logic and request handlers
│   │   ├── adminController.js   # User management and global alerts
│   │   ├── authController.js    # Login, Registration, JWT handling
│   │   ├── drillController.js   # Crisis drill management logic
│   │   ├── moduleController.js  # Educational module logic
│   │   ├── quizController.js    # Quiz management and grading
│   │   ├── studentController.js # Student stats and progress
│   │   └── teacherController.js # Teacher dashboard and student performance
│   ├── middleware/             # Authentication & Security filters
│   │   ├── authMiddleware.js   # JWT token verification
│   │   └── roleMiddleware.js   # Admin/Teacher/Student access control
│   ├── models/                 # Database Schemas (MongoDB/Mongoose)
│   │   ├── User.js             # User profiles (Admin/Teacher/Student)
│   │   ├── Module.js           # Learning content data
│   │   ├── Quiz.js             # Assessment questions
│   │   ├── Drill.js            # Crisis simulation data
│   │   ├── Alert.js            # System-wide emergency broadcasts
│   │   └── ... (Achievements, Results, Progress, etc.)
│   ├── routes/                 # API endpoint definitions
│   │   ├── authRoutes.js       # /api/auth endpoints
│   │   ├── adminRoutes.js      # /api/admin endpoints
│   │   ├── moduleRoutes.js     # /api/modules endpoints
│   │   └── ... (Quiz, Drill, Student, Teacher routes)
│   ├── server.js               # Main entry point for the backend
│   └── .env                    # Environment variables (PORT, DB URI, JWT Secret)
├── frontend/                   # Vanilla JavaScript Frontend
│   ├── index.html              # Main Single Page Application (SPA) structure
│   ├── style.css               # Modern styling and responsive layout
│   ├── app.js                  # Core frontend logic and state management
│   ├── api.js                  # Helper for making backend API calls
│   ├── script.js               # UI interaction and sidebar logic
│   └── data.js                 # Static configurations and local data
├── HARDWARE_SOFTWARE_REQUIREMENTS.md
├── README.md                   # Complete project documentation
├── populate-db.js              # Script to seed the database with initial data
├── package.json                # Project dependencies and scripts
└── node_modules/               # Installed backend libraries



Default Credentials
Admin:
Email: admin@gmail.com
Password: 123456
Teacher:
Email: j@gmail.com
Password: crisiscraft123
Student:
Email: abinav@gmail.com
Password: 123
Deployment
This application can be deployed on any platform that supports Node.js applications with MongoDB databases.
License
This project is licensed under the MIT License - see the LICENSE file for details.
Acknowledgements
"Be Prepared, Not Scared" - Empowering communities through CrisisCraft  education.
