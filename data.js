const CrisisData = {
    institutions: [
        { i_id: "INST001", i_name: "Metropolis City Central High", location: { district: "Downtown", city: "Metropolis", state: "NY" } }
    ],
    users: [
        {
            user_id: "U001",
            u_name: { fname: "Sarah", mname: "J", lname: "Connor" },
            role: "Admin",
            status: "Active",
            password: "admin",
            score: 0,
            i_id: "INST001",
            email: "admin@crisiscraft.edu",
            avatar: "Felix"
        },
        {
            user_id: "U002",
            u_name: { fname: "Jane", mname: "A", lname: "Smith" },
            role: "Teacher",
            status: "Active",
            password: "teacher",
            score: 0,
            i_id: "INST001",
            email: "jane.smith@crisiscraft.edu",
            avatar: "Aneka"
        },
        {
            user_id: "U003",
            u_name: { fname: "Kavya", mname: "", lname: "Menon" },
            role: "Student",
            status: "Active",
            password: "student",
            score: 1250,
            i_id: "INST001",
            email: "student@crisiscraft.edu",
            avatar: "Aneka"
        },
        {
            user_id: "U004",
            u_name: { fname: "Rohan", mname: "K", lname: "Gupta" },
            role: "Student",
            status: "Active",
            password: "password123",
            score: 1100,
            i_id: "INST001",
            email: "rohan@gmail.com",
            avatar: "Felix"
        },
        {
            user_id: "U005",
            u_name: { fname: "Alex", mname: "", lname: "Chen" },
            role: "Student",
            status: "Active",
            password: "password123",
            score: 950,
            i_id: "INST001",
            email: "alex.c@tech.edu",
            avatar: "Felix"
        },
        {
            user_id: "U006",
            u_name: { fname: "Maya", mname: "L", lname: "Rodriguez" },
            role: "Student",
            status: "Active",
            password: "password123",
            score: 820,
            i_id: "INST001",
            email: "maya.r@summit.edu",
            avatar: "Aneka"
        },
        {
            user_id: "U007",
            u_name: { fname: "Samuel", mname: "", lname: "Jackson" },
            role: "Teacher",
            status: "Active",
            password: "password123",
            score: 0,
            i_id: "INST001",
            email: "s.jackson@riverside.edu",
            avatar: "Felix"
        },
        {
            user_id: "U008",
            u_name: { fname: "Elena", mname: "V", lname: "Petrova" },
            role: "Student",
            status: "Active",
            password: "password123",
            score: 740,
            i_id: "INST001",
            email: "elena.p@crisiscraft.edu",
            avatar: "Aneka"
        },
        {
            user_id: "U009",
            u_name: { fname: "David", mname: "", lname: "Kim" },
            role: "Student",
            status: "Away",
            password: "password123",
            score: 610,
            i_id: "INST001",
            email: "d.kim@greendale.edu",
            avatar: "Felix"
        },
        {
            user_id: "U010",
            u_name: { fname: "Olivia", mname: "W", lname: "Brown" },
            role: "Student",
            status: "Active",
            password: "password123",
            score: 550,
            i_id: "INST001",
            email: "o.brown@summit.edu",
            avatar: "Aneka"
        }
    ],
    modules: [
        {
            m_id: "MOD001",
            title: "Earthquake Preparedness Basics",
            content: "Earthquakes are sudden tremblings of the ground. When one starts, remember to DROP, COVER, and HOLD ON. Drop to your hands and knees. Cover your head and neck with your arms. If a sturdy table exists, crawl under it for shelter. Hold on to your shelter until the shaking stops. Stay away from glass, windows, and heavy furniture that could fall.",
            upload_date: "2026-02-15",
            uploaded_by: "U002",
            students: 450,
            completion: 82,
            status: "In Progress",
            studentProgress: 75
        },
        {
            m_id: "MOD002",
            title: "Flood Safety and Evacuation",
            content: "Floods can happen anywhere. Six inches of moving water can knock you down, and one foot can sweep a vehicle away. If a flood warning is issued, move to higher ground immediately. Never walk or drive through flowing water. Listen to local alerts and follow designated evacuation routes provided by your school safety officer.",
            upload_date: "2026-02-20",
            uploaded_by: "U002",
            students: 310,
            completion: 95,
            status: "Completed",
            studentProgress: 100
        },
        {
            m_id: "MOD003",
            title: "Fire Safety & Extinguisher Use",
            content: "In case of fire, use the nearest staircase exit—never the elevator. If you encounter smoke, stay low to the ground where the air is cleaner. When using a fire extinguisher, remember the P.A.S.S technique: Pull the pin, Aim at the base of the fire, Squeeze the lever, and Sweep from side to side.",
            upload_date: "2026-03-01",
            uploaded_by: "U007",
            students: 280,
            completion: 65,
            status: "Not Started",
            studentProgress: 0
        },
        {
            m_id: "MOD004",
            title: "First Aid & CPR Certification",
            content: "First aid is the immediate assistance given to any person suffering from either a minor or serious illness or injury. CPR (Cardiopulmonary Resuscitation) consists of chest compressions and rescue breaths. First, check the scene for safety. Then check responsiveness. If they don't respond, call 911 and begin chest compressions at a rate of 100-120 per minute.",
            upload_date: "2026-03-05",
            uploaded_by: "U002",
            students: 190,
            completion: 40,
            status: "Not Started",
            studentProgress: 10
        },
        {
            m_id: "MOD005",
            title: "Chemical Hazard Awareness",
            content: "Chemical hazards can cause immediate or long-term health effects. Always look for hazard symbols like 'Flammable', 'Toxic', or 'Corrosive' on labels. If a chemical spill occurs, notify a teacher immediately and do not touch the substance. Familiarize yourself with the location of eye-wash stations and safety showers in the science labs.",
            upload_date: "2026-03-08",
            uploaded_by: "U007",
            students: 120,
            completion: 30,
            status: "Not Started",
            studentProgress: 0
        }
    ],
    quizzes: [
        {
            quiz_id: "Q001",
            m_id: "MOD001",
            title: "Earthquake Safety Assessment",
            total_marks: 20,
            avg_score: 16.5,
            studentScore: "16/20",
            status: "Completed",
            questions: 4,
            timeLimit: 30,
            questionsList: [
                { text: "What should you do first when an earthquake starts?", options: ["Run outside", "Drop, Cover, and Hold On", "Call parents", "Stand under a doorway"], correct: 1 },
                { text: "Where is the safest place during a tremor?", options: ["Next to a window", "In an elevator", "Under a sturdy desk", "In the kitchen"], correct: 2 },
                { text: "After shaking stops, what is the biggest danger?", options: ["Aftershocks", "Traffic", "Power outages", "Falling trees"], correct: 0 },
                { text: "What kit should you always have ready?", options: ["Toolbox", "Emergency supply kit", "School bag", "Cooking kit"], correct: 1 }
            ]
        },
        {
            quiz_id: "Q002",
            m_id: "MOD002",
            title: "Flood Evacuation Knowledge Check",
            total_marks: 20,
            avg_score: 18.2,
            studentScore: "18/20",
            status: "Completed",
            questions: 4,
            timeLimit: 20,
            questionsList: [
                { text: "How many inches of moving water can knock you down?", options: ["6 inches", "12 inches", "18 inches", "24 inches"], correct: 0 },
                { text: "What should you NOT do during a flood?", options: ["Move to higher ground", "Walk through flowing water", "Listen to emergency alerts", "Stay off bridges"], correct: 1 },
                { text: "What does NEVER do during a flood warning?", options: ["Turn off gas", "Drive through flooded roads", "Go to shelter", "Charge your phone"], correct: 1 },
                { text: "A flood watch means:", options: ["Flooding is imminent", "Flooding is possible", "Flooding has ended", "Rivers are normal"], correct: 1 }
            ]
        },
        {
            quiz_id: "Q003",
            m_id: "MOD003",
            title: "Fire Safety & Prevention Quiz",
            total_marks: 10,
            avg_score: 8.5,
            studentScore: null,
            status: "Open",
            questions: 3,
            timeLimit: 15,
            questionsList: [
                { text: "The 'P' in P.A.S.S stands for:", options: ["Push", "Pull", "Press", "Point"], correct: 1 },
                { text: "How often should smoke detector batteries be checked?", options: ["Every 2 years", "Every year", "Every 6 months", "Every week"], correct: 2 },
                { text: "In case of fire, use the:", options: ["Elevator", "Service lift", "Stairs", "Roof access"], correct: 2 }
            ]
        },
        {
            quiz_id: "Q004",
            m_id: "MOD004",
            title: "First Aid Certification Exam",
            total_marks: 50,
            avg_score: 42,
            studentScore: null,
            status: "Open",
            questions: 2,
            timeLimit: 45,
            questionsList: [
                { text: "What is the first step of CPR?", options: ["Check the scene for safety", "Check responsiveness", "Call 911", "Give breaths"], correct: 0 },
                { text: "A severe allergic reaction is called:", options: ["Arthritis", "Anaphylaxis", "Asphyxiation", "Anemia"], correct: 1 }
            ]
        }
    ],
    drills: [
        {
            drill_id: "DRL001",
            title: "Main Campus Fire Evacuation",
            disaster_type: "Fire",
            scheduled_date: "05 March 2026",
            drill_rating: 4.8,
            description: "Full evacuation drill for Institution 001.",
            participation: 98,
            score: 94,
            status: "Completed",
            date: "05 March 2026"
        },
        {
            drill_id: "DRL002",
            title: "Regional Earthquake Drill",
            disaster_type: "Earthquake",
            scheduled_date: "15 April 2026",
            drill_rating: 0,
            description: "Drop, Cover, and Hold On simulation across all institutions.",
            participation: 92,
            score: 0,
            status: "Registered",
            date: "15 April 2026"
        },
        {
            drill_id: "DRL003",
            title: "Flash Flood Warning Simulation",
            disaster_type: "Flood",
            scheduled_date: "20 May 2026",
            drill_rating: 0,
            description: "High-ground evacuation procedure drill.",
            participation: 0,
            score: 0,
            status: "Registered",
            date: "20 May 2026"
        }
    ],
    achievements: [
        {
            a_id: "ACH001",
            name: "Safety Star",
            badge_icon: "fa-shield-alt",
            description: "Recognized for module excellence.",
            criteria: "Complete 5 Learning Modules"
        },
        {
            a_id: "ACH002",
            name: "Fire Warden",
            badge_icon: "fa-fire-extinguisher",
            description: "Top performer in fire response.",
            criteria: "Score 100% in Fire Drill"
        },
        {
            a_id: "ACH003",
            name: "Heart Hero",
            badge_icon: "fa-heartbeat",
            description: "Certified in CPR simulation.",
            criteria: "Score 95%+ in First Aid Quiz"
        },
        {
            a_id: "ACH004",
            name: "Flood Guide",
            badge_icon: "fa-water",
            description: "Evacuation route expert.",
            criteria: "Complete Flood Module in under 10 mins"
        }
    ],
    alerts: [
        {
            alert_id: "AL001",
            message: "Earthquake Drill starting in 5 minutes.",
            alert_type: "Drill",
            alert_time: "09:00 AM",
            triggered_by: "U001"
        },
        {
            alert_id: "AL002",
            message: "All students please report to your designated safety officers.",
            alert_type: "Warning",
            alert_time: "10:15 AM",
            triggered_by: "U001"
        }
    ],
    statistics: {
        admin: { totalStudents: 8540, totalTeachers: 1420, activeDrills: 3, readinessScore: 88 },
        teacher: { studentsAssigned: 450, modulesUploaded: 5, activeQuizzes: 4, averageScore: 82 },
        student: { modulesCompleted: 1, totalModules: 5, upcomingDrillDate: "15 April 2026", averageQuizScore: 92, totalPoints: 1250 }
    },
    leaderboard: [
        { name: "Aarav Sharma", score: 1450 },
        { name: "Kavya Menon", score: 1250, isUser: true },
        { name: "Diya Patel", score: 1210 },
        { name: "Rohan Gupta", score: 1100 },
        { name: "Alex Chen", score: 950 },
        { name: "Maya Rodriguez", score: 820 }
    ]
};
