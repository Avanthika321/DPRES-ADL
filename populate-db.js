const axios = require('axios');

// Base URL for API calls
const BASE_URL = 'http://localhost:5000/api';

// Static data from CrisisData
const staticData = {
    users: [
        {
            name: "Sarah Connor",
            email: "admin@crisiscraft.edu",
            password: "admin",
            role: "admin"
        },
        {
            name: "Jane Smith",
            email: "jane.smith@crisiscraft.edu",
            password: "teacher",
            role: "teacher"
        },
        {
            name: "Kavya Menon",
            email: "student@crisiscraft.edu",
            password: "student",
            role: "student"
        },
        {
            name: "Rohan Gupta",
            email: "rohan@gmail.com",
            password: "password123",
            role: "student"
        },
        {
            name: "Alex Chen",
            email: "alex.c@tech.edu",
            password: "password123",
            role: "student"
        },
        {
            name: "Maya Rodriguez",
            email: "maya.r@summit.edu",
            password: "password123",
            role: "student"
        },
        {
            name: "Samuel Jackson",
            email: "s.jackson@riverside.edu",
            password: "password123",
            role: "teacher"
        },
        {
            name: "Elena Petrova",
            email: "elena.p@crisiscraft.edu",
            password: "password123",
            role: "student"
        },
        {
            name: "David Kim",
            email: "d.kim@greendale.edu",
            password: "password123",
            role: "student"
        },
        {
            name: "Olivia Brown",
            email: "o.brown@summit.edu",
            password: "password123",
            role: "student"
        }
    ],
    modules: [
        {
            title: "Earthquake Preparedness Basics",
            content: "Earthquakes are sudden tremblings of the ground. When one starts, remember to DROP, COVER, and HOLD ON. Drop to your hands and knees. Cover your head and neck with your arms. If a sturdy table exists, crawl under it for shelter. Hold on to your shelter until the shaking stops. Stay away from glass, windows, and heavy furniture that could fall.",
            fileName: "earthquake-basics.pdf"
        },
        {
            title: "Flood Safety and Evacuation",
            content: "Floods can happen anywhere. Six inches of moving water can knock you down, and one foot can sweep a vehicle away. If a flood warning is issued, move to higher ground immediately. Never walk or drive through flowing water. Listen to local alerts and follow designated evacuation routes provided by your school safety officer.",
            fileName: "flood-safety.pdf"
        },
        {
            title: "Fire Safety & Extinguisher Use",
            content: "In case of fire, use the nearest staircase exit—never the elevator. If you encounter smoke, stay low to the ground where the air is cleaner. When using a fire extinguisher, remember the P.A.S.S technique: Pull the pin, Aim at the base of the fire, Squeeze the lever, and Sweep from side to side.",
            fileName: "fire-safety.pdf"
        },
        {
            title: "First Aid & CPR Certification",
            content: "First aid is the immediate assistance given to any person suffering from either a minor or serious illness or injury. CPR (Cardiopulmonary Resuscitation) consists of chest compressions and rescue breaths. First, check the scene for safety. Then check responsiveness. If they don't respond, call 911 and begin chest compressions at a rate of 100-120 per minute.",
            fileName: "first-aid-cpr.pdf"
        },
        {
            title: "Chemical Hazard Awareness",
            content: "Chemical hazards can cause immediate or long-term health effects. Always look for hazard symbols like 'Flammable', 'Toxic', or 'Corrosive' on labels. If a chemical spill occurs, notify a teacher immediately and do not touch the substance. Familiarize yourself with the location of eye-wash stations and safety showers in the science labs.",
            fileName: "chemical-hazards.pdf"
        }
    ]
};

// Store tokens for different roles
let adminToken = '';
let teacherToken = '';

async function registerUsers() {
    console.log('🚀 Registering users...');

    for (const user of staticData.users) {
        try {
            const response = await axios.post(`${BASE_URL}/auth/register`, user);
            console.log(`✅ Registered: ${user.name} (${user.role})`);
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

async function createModules() {
    console.log('📚 Creating modules...');

    for (const module of staticData.modules) {
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

async function populateDatabase() {
    try {
        console.log('🌱 Starting database population...\n');

        await registerUsers();
        console.log('');

        await loginUsers();
        console.log('');

        await createModules();
        console.log('');

        console.log('🎉 Database population completed!');

    } catch (error) {
        console.error('💥 Error during population:', error.message);
    }
}

// Run the population script
populateDatabase();