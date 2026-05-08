const axios = require('axios');

// Base URL for API calls
const BASE_URL = 'https://dpres-adl.onrender.com/api';

// Additional sample data
const additionalUsers = [
    // More Teachers with classes
    {
        name: "Dr. Maria Rodriguez",
        email: "maria.rodriguez@crisiscraft.edu",
        password: "password123",
        role: "teacher",
        class: "Grade 10A - Emergency Response"
    },
    {
        name: "Prof. James Wilson",
        email: "james.wilson@crisiscraft.edu",
        password: "password123",
        role: "teacher",
        class: "Grade 11B - Disaster Management"
    },
    {
        name: "Ms. Lisa Chen",
        email: "lisa.chen@crisiscraft.edu",
        password: "password123",
        role: "teacher",
        class: "Grade 9C - Safety Education"
    },
    // More Students
    {
        name: "Arjun Patel",
        email: "arjun.patel@crisiscraft.edu",
        password: "password123",
        role: "student",
        class: "Grade 10A",
        score: 1320
    },
    {
        name: "Sophia Kim",
        email: "sophia.kim@crisiscraft.edu",
        password: "password123",
        role: "student",
        class: "Grade 11B",
        score: 1180
    },
    {
        name: "Carlos Mendoza",
        email: "carlos.mendoza@crisiscraft.edu",
        password: "password123",
        role: "student",
        class: "Grade 9C",
        score: 1050
    },
    {
        name: "Emma Thompson",
        email: "emma.thompson@crisiscraft.edu",
        password: "password123",
        role: "student",
        class: "Grade 10A",
        score: 980
    },
    {
        name: "Liam Johnson",
        email: "liam.johnson@crisiscraft.edu",
        password: "password123",
        role: "student",
        class: "Grade 11B",
        score: 890
    },
    {
        name: "Zara Ahmed",
        email: "zara.ahmed@crisiscraft.edu",
        password: "password123",
        role: "student",
        class: "Grade 9C",
        score: 760
    },
    {
        name: "Noah Garcia",
        email: "noah.garcia@crisiscraft.edu",
        password: "password123",
        role: "student",
        class: "Grade 10A",
        score: 720
    }
];

// Updated leaderboard with all students
const leaderboard = [
    { name: "Aarav Sharma", score: 1450, class: "Grade 12A" },
    { name: "Arjun Patel", score: 1320, class: "Grade 10A" },
    { name: "Kavya Menon", score: 1250, class: "Grade 10B", isUser: true },
    { name: "Sophia Kim", score: 1180, class: "Grade 11B" },
    { name: "Diya Patel", score: 1210, class: "Grade 11A" },
    { name: "Rohan Gupta", score: 1100, class: "Grade 10B" },
    { name: "Carlos Mendoza", score: 1050, class: "Grade 9C" },
    { name: "Emma Thompson", score: 980, class: "Grade 10A" },
    { name: "Alex Chen", score: 950, class: "Grade 10B" },
    { name: "Liam Johnson", score: 890, class: "Grade 11B" },
    { name: "Maya Rodriguez", score: 820, class: "Grade 10B" },
    { name: "Zara Ahmed", score: 760, class: "Grade 9C" },
    { name: "Elena Petrova", score: 740, class: "Grade 10B" },
    { name: "Noah Garcia", score: 720, class: "Grade 10A" },
    { name: "David Kim", score: 610, class: "Grade 10B" },
    { name: "Olivia Brown", score: 550, class: "Grade 9C" }
];

// Store tokens
let adminToken = '';
let teacherToken = '';

async function registerAdditionalUsers() {
    console.log('🚀 Registering additional users...');

    for (const user of additionalUsers) {
        try {
            const userData = {
                name: user.name,
                email: user.email,
                password: user.password,
                role: user.role
            };

            const response = await axios.post(`${BASE_URL}/auth/register`, userData);
            console.log(`✅ Registered: ${user.name} (${user.role}) - ${user.class || ''}`);
        } catch (error) {
            console.log(`⚠️  User ${user.name} might already exist: ${error.response?.data?.message || error.message}`);
        }
    }
}

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

async function createAdditionalModules() {
    console.log('📚 Creating additional modules...');

    const additionalModules = [
        {
            title: "Advanced Fire Safety Training",
            content: "Advanced fire safety covers evacuation procedures for large buildings, fire extinguisher types and usage, smoke management, and emergency communication protocols. Learn about PASS technique, different fire classes, and when to evacuate vs fight fires.",
            fileName: "advanced-fire-safety.pdf"
        },
        {
            title: "Tornado Preparedness Guide",
            content: "Tornadoes can strike with little warning. Learn about tornado watch vs warning systems, safe shelter locations, and what to do before, during, and after a tornado. Understand the enhanced Fujita scale and tornado safety myths.",
            fileName: "tornado-preparedness.pdf"
        },
        {
            title: "Cybersecurity Awareness",
            content: "In today's digital world, cybersecurity is crucial. Learn about phishing attacks, password security, data protection, and safe internet practices. Understand how to identify and report cyber threats in emergency situations.",
            fileName: "cybersecurity-awareness.pdf"
        }
    ];

    for (const module of additionalModules) {
        try {
            const response = await axios.post(`${BASE_URL}/modules`, module, {
                headers: {
                    'Authorization': `Bearer ${teacherToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Created module: ${module.title}`);
        } catch (error) {
            console.log(`❌ Failed to create module ${module.title}:`, error.response?.data?.message);
        }
    }
}

async function createAdditionalQuizzes() {
    console.log('📝 Creating additional quizzes...');

    const additionalQuizzes = [
        {
            title: "Advanced Fire Safety Certification",
            questionsList: [
                {
                    text: "What does the 'P' in PASS stand for when using a fire extinguisher?",
                    options: ["Push", "Pull", "Press", "Point"],
                    correct: 1
                },
                {
                    text: "Which fire extinguisher type is used for electrical fires?",
                    options: ["Type A", "Type B", "Type C", "Type D"],
                    correct: 2
                },
                {
                    text: "When should you NOT attempt to fight a fire?",
                    options: ["Fire is small", "You have an extinguisher", "Fire blocks your exit", "Fire is contained"],
                    correct: 2
                }
            ],
            timeLimit: 20,
            totalMarks: 15
        },
        {
            title: "Tornado Safety Assessment",
            questionsList: [
                {
                    text: "What is the safest place during a tornado?",
                    options: ["Under a bridge", "In a mobile home", "Interior room on lowest floor", "In your car"],
                    correct: 2
                },
                {
                    text: "A tornado WATCH means:",
                    options: ["Tornado on ground", "Conditions are favorable", "Take shelter immediately", "All clear"],
                    correct: 1
                },
                {
                    text: "What should you do if caught in your car during a tornado?",
                    options: ["Drive away", "Stay in car", "Abandon car and lie flat", "Drive toward tornado"],
                    correct: 2
                }
            ],
            timeLimit: 15,
            totalMarks: 15
        }
    ];

    for (const quiz of additionalQuizzes) {
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

async function createAdditionalDrills() {
    console.log('🚨 Creating additional drills...');

    const additionalDrills = [
        {
            title: "Multi-Hazard Emergency Drill",
            disasterType: "Multiple",
            scheduledDate: "2026-06-15",
            description: "Comprehensive drill covering earthquake, fire, and flood scenarios simultaneously."
        },
        {
            title: "Night Time Evacuation Drill",
            disasterType: "Fire",
            scheduledDate: "2026-07-20",
            description: "Emergency evacuation drill conducted during night hours to test low-visibility procedures."
        },
        {
            title: "Chemical Spill Response Drill",
            disasterType: "Chemical",
            scheduledDate: "2026-08-10",
            description: "Laboratory chemical spill containment and evacuation drill."
        }
    ];

    for (const drill of additionalDrills) {
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

async function populateAdditionalData() {
    try {
        console.log('🌱 Starting additional data population...\n');

        await registerAdditionalUsers();
        console.log('');

        await loginUsers();
        console.log('');

        await createAdditionalModules();
        console.log('');

        await createAdditionalQuizzes();
        console.log('');

        await createAdditionalDrills();
        console.log('');

        console.log('🎉 Additional data population completed!');
        console.log('\n📊 New Data Summary:');
        console.log('- 3 additional teachers with classes');
        console.log('- 7 additional students with scores');
        console.log('- 3 additional modules');
        console.log('- 2 additional quizzes');
        console.log('- 3 additional drills');
        console.log('\n🔄 Leaderboard updated with all students');

    } catch (error) {
        console.error('💥 Error during population:', error.message);
    }
}

// Run the population script
populateAdditionalData();