let currentRole = 'student';

const roleData = {
    admin: {
        title: "Admin Control Center",
        subtitle: "System oversight and user management portal",
        badge: "System Administrator",
        colorClass: "card-admin",
        features: [
            { icon: "fa-users-gear", title: "Manage Users", desc: "Add, edit, or deactivate system participants." },
            { icon: "fa-book-open", title: "Manage Modules", desc: "Curate and organize learning material databases." },
            { icon: "fa-vr-cardboard", title: "Manage Drills", desc: "Monitor and configure virtual simulation sessions." },
            { icon: "fa-bullhorn", title: "Broadcast Alerts", desc: "Send emergency notifications to all roles.", special: "btn-red" },
            { icon: "fa-chart-pie", title: "View Reports", desc: "Analyze system-wide performance and readiness." }
        ]
    },
    teacher: {
        title: "Teacher Dashboard",
        subtitle: "Classroom management and progress tracking",
        badge: "Educator",
        colorClass: "card-teacher",
        features: [
            { icon: "fa-cloud-arrow-up", title: "Upload Modules", desc: "Share new learning resources with your students." },
            { icon: "fa-clipboard-question", title: "Manage Quizzes", desc: "Create and evaluate assessments for your classes." },
            { icon: "fa-user-check", title: "Student Performance", desc: "Review individual and group drill results." },
            { icon: "fa-arrow-trend-up", title: "Track Progress", desc: "Monitor learning curve and engagement metrics." }
        ]
    },
    student: {
        title: "Student Portal",
        subtitle: "Your personal disaster preparedness roadmap",
        badge: "Learner",
        colorClass: "card-student",
        features: [
            { icon: "fa-book", title: "Learning Modules", desc: "Access your assigned educational content." },
            { icon: "fa-fire-extinguisher", title: "Virtual Drills", desc: "Participate in immersive response simulations." },
            { icon: "fa-medal", title: "Earn Badges", desc: "Complete challenges to unlock safety certifications." },
            { icon: "fa-ranking-star", title: "Leaderboard", desc: "Compare your readiness score with peers." },
            { icon: "fa-pen-to-square", title: "Attempt Quizzes", desc: "Test your knowledge on recent safety modules." }
        ]
    }
};

function selectRole(role) {
    currentRole = role;

    // Update UI buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

function handleLogin() {
    // Hidden transition
    const loginPage = document.getElementById('login-page');
    const appWrapper = document.getElementById('app-wrapper');

    loginPage.style.display = 'none';
    appWrapper.style.display = 'flex';

    renderDashboard();
}

function renderDashboard() {
    const data = roleData[currentRole];

    // Update Header
    document.getElementById('dash-title').innerText = data.title;
    document.getElementById('dash-subtitle').innerText = data.subtitle;
    document.getElementById('role-badge').innerText = data.badge;
    document.getElementById('user-name-label').innerText = `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} User`;

    // Render Feature Cards
    const content = document.getElementById('dashboard-content');
    let cardsHtml = `<div class="stat-grid">`;

    data.features.forEach(feat => {
        cardsHtml += `
            <div class="feature-card glass ${data.colorClass} animate-fade">
                <i class="fa-solid ${feat.icon}" style="font-size: 2rem; margin-bottom: 20px;"></i>
                <h3>${feat.title}</h3>
                <p>${feat.desc}</p>
                <div style="margin-top: 20px;">
                    <button class="btn ${feat.special ? feat.special + ' broadcast-btn' : 'btn-blue'}" 
                            onclick="handleAction('${feat.title}')">
                        ${feat.special ? 'BROADCAST' : 'Open Feature'}
                    </button>
                </div>
            </div>
        `;
    });

    cardsHtml += `</div>`;
    content.innerHTML = cardsHtml;
}

function handleAction(action) {
    if (action === 'Broadcast Alerts') {
        alert('EMERGENCY BROADCAST INITIATED: System-wide alert sent.');
    } else {
        alert(`${action} module opened. (Dummy Data)`);
    }
}

function logout() {
    location.reload();
}

// Global scope for onclick handlers
window.selectRole = selectRole;
window.handleLogin = handleLogin;
window.handleAction = handleAction;
window.logout = logout;
