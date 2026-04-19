const axios = require('axios');

// Base URL for API calls
const BASE_URL = 'http://localhost:5000/api';

// Store tokens
let adminToken = '';
let teacherToken = '';

const quizzes = [
    {
        title: "Earthquake Safety Assessment",
        questionsList: [
            {
                text: "What should you do first when an earthquake starts?",
                options: ["Run outside", "Drop, Cover, and Hold On", "Call parents", "Stand under a doorway"],
                correct: 1
            },
            {
                text: "Where is the safest place during a tremor?",
                options: ["Next to a window", "In an elevator", "Under a sturdy desk", "In the kitchen"],
                correct: 2
            },
            {
                text: "After shaking stops, what is the biggest danger?",
                options: ["Aftershocks", "Traffic", "Power outages", "Falling trees"],
                correct: 0
            },
            {
                text: "What kit should you always have ready?",
                options: ["Toolbox", "Emergency supply kit", "School bag", "Cooking kit"],
                correct: 1
            }
        ],
        timeLimit: 30,
        totalMarks: 20
    },
    {
        title: "Flood Evacuation Knowledge Check",
        questionsList: [
            {
                text: "How many inches of moving water can knock you down?",
                options: ["6 inches", "12 inches", "18 inches", "24 inches"],
                correct: 0
            },
            {
                text: "What should you NOT do during a flood?",
                options: ["Move to higher ground", "Walk through flowing water", "Listen to emergency alerts", "Stay off bridges"],
                correct: 1
            },
            {
                text: "What does NEVER do during a flood warning?",
                options: ["Turn off gas", "Drive through flooded roads", "Go to shelter", "Charge your phone"],
                correct: 1
            },
            {
                text: "A flood watch means:",
                options: ["Flooding is imminent", "Flooding is possible", "Flooding has ended", "Rivers are normal"],
                correct: 1
            }
        ],
        timeLimit: 20,
        totalMarks: 20
    },
    {
        title: "Fire Safety & Prevention Quiz",
        questionsList: [
            {
                text: "The 'P' in P.A.S.S stands for:",
                options: ["Push", "Pull", "Press", "Point"],
                correct: 1
            },
            {
                text: "How often should smoke detector batteries be checked?",
                options: ["Every 2 years", "Every year", "Every 6 months", "Every week"],
                correct: 2
            },
            {
                text: "In case of fire, use the:",
                options: ["Elevator", "Service lift", "Stairs", "Roof access"],
                correct: 2
            }
        ],
        timeLimit: 15,
        totalMarks: 10
    },
    {
        title: "First Aid Certification Exam",
        questionsList: [
            {
                text: "What is the first step of CPR?",
                options: ["Check the scene for safety", "Check responsiveness", "Call 911", "Give breaths"],
                correct: 0
            },
            {
                text: "A severe allergic reaction is called:",
                options: ["Arthritis", "Anaphylaxis", "Asphyxiation", "Anemia"],
                correct: 1
            }
        ],
        timeLimit: 45,
        totalMarks: 50
    }
];

const drills = [
    {
        title: "Main Campus Fire Evacuation",
        disasterType: "Fire",
        scheduledDate: "2026-03-05",
        description: "Full evacuation drill for Institution 001."
    },
    {
        title: "Regional Earthquake Drill",
        disasterType: "Earthquake",
        scheduledDate: "2026-04-15",
        description: "Drop, Cover, and Hold On simulation across all institutions."
    },
    {
        title: "Flash Flood Warning Simulation",
        disasterType: "Flood",
        scheduledDate: "2026-05-20",
        description: "High-ground evacuation procedure drill."
    }
];

async function loginUsers() {
    console.log('🔐 Logging in users...');

    // Login as admin
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: "admin@crisiscraft.edu",
            password: "admin"
        });
        adminToken = response.data.token;
        console.log('✅ Admin logged in');
    } catch (error) {
        console.log('❌ Admin login failed:', error.response?.data?.message);
    }

    // Login as teacher
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: "jane.smith@crisiscraft.edu",
            password: "teacher"
        });
        teacherToken = response.data.token;
        console.log('✅ Teacher logged in');
    } catch (error) {
        console.log('❌ Teacher login failed:', error.response?.data?.message);
    }
}

async function createQuizzes() {
    console.log('📝 Creating quizzes...');

    for (const quiz of quizzes) {
        try {
            const response = await axios.post(`${BASE_URL}/quizzes`, quiz, {
                headers: {
                    'Authorization': `Bearer ${teacherToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Created quiz: ${quiz.title}`);
        } catch (error) {
            console.log(`❌ Failed to create quiz ${quiz.title}:`, error.response?.data?.message);
        }
    }
}

async function createDrills() {
    console.log('🚨 Creating drills...');

    for (const drill of drills) {
        try {
            const response = await axios.post(`${BASE_URL}/drills`, drill, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Created drill: ${drill.title}`);
        } catch (error) {
            console.log(`❌ Failed to create drill ${drill.title}:`, error.response?.data?.message);
        }
    }
}

async function populateRemainingData() {
    try {
        console.log('🌱 Starting remaining data population...\n');

        await loginUsers();
        console.log('');

        await createQuizzes();
        console.log('');

        await createDrills();
        console.log('');

        console.log('🎉 All data population completed!');

    } catch (error) {
        console.error('💥 Error during population:', error.message);
    }
}

// Run the population script
populateRemainingData();