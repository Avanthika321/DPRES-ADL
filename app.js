window.App = {
    state: {
        role: null,
        activeSection: 'Dashboard',
        isLoggedIn: false,
        profiles: {
            admin: { name: 'Sarah Connor', email: 'admin@crisiscraft.edu', title: 'System Administrator', avatar: 'Felix' },
            teacher: { name: 'Diana Prince', email: 'teacher@crisiscraft.edu', title: 'Emergency Response Teacher', avatar: 'Aneka', standard: '10', section: 'A' },
            student: { name: 'Kavya Menon', email: 'student@crisiscraft.edu', title: 'Student', avatar: 'Aneka', standard: '10', section: 'B' }
        },
        settings: {
            maint: false,
            reg: true,
            autoAlert: true,
            audit: true,
            autoGrade: true,
            perfNotif: true,
            drillRemind: false,
            hideNames: false,
            drillAlrt: true,
            quizAlrt: true,
            ldrAlrt: false,
            bdgAlrt: true,
            pubPro: true,
            ldrbrd: true,
            notifOn: true,
            compactView: false,
            animations: true
        },
        userSearchQuery: '',
        userRoleFilter: 'teacher'
    },

    async init() {
        this.loadState();
        await this.checkAutoLogin();
        this.render();
    },

    async checkAutoLogin() {
        const token = localStorage.getItem('crisis_craft_token');
        const role = localStorage.getItem('crisis_craft_role');
        const userName = localStorage.getItem('crisis_craft_user');

        if (token && role && userName) {
            try {
                // Verify token is still valid by making a test API call
                const response = await fetch('http://localhost:5000/api/auth/verify', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Token is valid, auto-login user
                    this.state.role = role;
                    this.state.isLoggedIn = true;
                    this.state.activeSection = 'Dashboard';
                    this.state.isLoadingModules = false;

                    // Sync local profile state with actual user data from server
                    if (data.user && this.state.profiles[data.user.role]) {
                        const p = this.state.profiles[data.user.role];
                        p.name = data.user.name;
                        p.email = data.user.email;
                        p.standard = data.user.standard || '';
                        p.section = data.user.section || '';

                        // Update title dynamically for students
                        if (data.user.role === 'student') {
                            p.title = p.standard ? `Student, Grade ${p.standard}${p.section || ''}` : 'Student';
                        }
                    }

                    // Load modules for the user
                    await this.loadModules();
                } else {
                    // Token invalid, clear localStorage
                    this.logout();
                }
            } catch (error) {
                // Network error, clear localStorage to be safe
                this.logout();
            }
        }
    },

    saveState() {
        localStorage.setItem('crisis_craft_state', JSON.stringify(this.state));
        // CrisisData no longer persisted - data comes from API
    },

    getAvatar(seed) {
        return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}`;
    },

    loadState() {
        const savedState = localStorage.getItem('crisis_craft_state');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            this.state = { ...this.state, ...parsed };
        }
        // CrisisData no longer persisted - data comes from API
    },

    // Logo Component (SVG)
    getLogo(size = 'medium', centered = false) {
        const dimensions = size === 'large' ? '120' : '40';
        const fontSize = size === 'large' ? '32px' : '22px';
        const logoClass = centered ? 'logo-centered' : 'logo-sidebar';

        return `
            <div class="logo-container ${logoClass}" style="display: flex; flex-direction: ${centered ? 'column' : 'row'}; align-items: center; justify-content: ${centered ? 'center' : 'flex-start'}; gap: ${centered ? '5px' : '15px'}; margin-bottom: 30px;">
                <svg width="${dimensions}" height="${dimensions}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 10px rgba(0, 245, 255, 0.5));">
                    <path d="M50 5L15 20V45C15 65 30 85 50 95C70 85 85 65 85 45V20L50 5Z" fill="#1e3a8a" stroke="#00f5ff" stroke-width="3"/>
                    <path d="M30 40H70V70C70 73 67 75 64 75H36C33 75 30 73 30 70V40Z" fill="rgba(255,255,255,0.1)"/>
                    <path d="M50 40V75" stroke="white" stroke-width="2"/>
                    <path d="M55 25L35 50H50L45 75L65 50H50L55 25Z" fill="#00f5ff">
                        <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
                    </path>
                </svg>
                <span style="font-size: ${fontSize}; font-weight: 700; color: white; letter-spacing: -1px;">Crisis<span style="color: var(--cyan);">Craft</span></span>
            </div>
        `;
    },

    async navigate(role) {
        this.state.role = role;
        this.state.activeSection = 'Dashboard';
        this.state.isLoggedIn = true;
        this.state.isLoadingModules = false;
        // Load modules for both teachers and students
        await this.loadModules();
        this.render();
    },

    async submitLogin() {
        const userVal = document.getElementById('login-user').value.trim();
        const passVal = document.getElementById('login-pass').value;
        const errorEl = document.getElementById('login-error');

        if (!userVal || !passVal) {
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Please fill all required fields`;
            }
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userVal, password: passVal })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user details in localStorage
                localStorage.setItem('crisis_craft_token', data.token);
                localStorage.setItem('crisis_craft_role', data.user.role);
                localStorage.setItem('crisis_craft_user', data.user.name);

                // Sync local profile state with actual user data
                if (this.state.profiles[data.user.role]) {
                    this.state.profiles[data.user.role].name = data.user.name;
                    this.state.profiles[data.user.role].email = data.user.email;
                    this.state.profiles[data.user.role].standard = data.user.standard || '';
                    this.state.profiles[data.user.role].section = data.user.section || '';

                    // Update title dynamically for students
                    if (data.user.role === 'student') {
                        const std = data.user.standard || '';
                        const sec = data.user.section || '';
                        this.state.profiles.student.title = std ? `Student, Grade ${std}${sec}` : 'Student';
                    }
                }

                // Navigate to dashboard
                this.navigate(data.user.role);
            } else {
                if (errorEl) {
                    errorEl.style.display = 'block';
                    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${data.message || 'Invalid credentials'}`;
                    setTimeout(() => { errorEl.style.display = 'none'; }, 5000);
                }
            }
        } catch (error) {
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Network error. Please try again.`;
                setTimeout(() => { errorEl.style.display = 'none'; }, 5000);
            }
            console.error('Login error:', error);
        }
    },

    async loadModules() {
        try {
            console.log('📥 Fetching modules from backend...');
            const modules = await getModules();
            console.log('✅ Modules loaded:', modules);
            this.state.uploadedModules = modules.map(m => ({
                ...m,
                students: m.students || 0,
                completion: m.completion || 0,
                status: m.status || 'Not Started'
            }));
        } catch (error) {
            console.error('❌ Error loading modules:', error);
            this.state.uploadedModules = [];
        }
    },

    async loadAlerts() {
        try {
            const alerts = await getActiveAlerts();
            this.state.activeAlerts = alerts.map(a => ({
                id: a._id,
                message: a.message,
                type: a.type
            }));
            this.render();
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    },

    async loadQuizzes() {
        try {
            console.log('📥 Fetching quizzes from backend...');
            const quizzes = await getQuizzes();
            console.log('✅ Quizzes loaded:', quizzes);
            this.state.quizzes = quizzes;
        } catch (error) {
            console.error('❌ Error loading quizzes:', error);
            this.state.quizzes = [];
        }
    },

    async loadQuizResults() {
        try {
            console.log('📥 Fetching quiz results...');
            const results = await getMyQuizResults();
            this.state.quizResults = results;
        } catch (error) {
            console.error('❌ Error loading results:', error);
            this.state.quizResults = [];
        }
    },

    async loadDrills() {
        try {
            console.log('📥 Fetching drills from backend...');
            const drills = await getDrills();
            console.log('✅ Drills loaded:', drills);
            this.state.drills = drills;
        } catch (error) {
            console.error('❌ Error loading drills:', error);
            this.state.drills = [];
        }
    },

    async loadAdminStats() {
        try {
            console.log('📥 Fetching admin stats...');
            const stats = await getAdminStats();
            this.state.adminStats = stats;
        } catch (error) {
            console.error('❌ Error loading admin stats:', error);
        }
    },

    async loadStudentStats() {
        try {
            console.log('📥 Fetching student stats...');
            const stats = await getStudentStats();
            const progress = await getMyModuleProgress();
            this.state.studentStats = { ...stats, progress };
        } catch (error) {
            console.error('❌ Error loading student stats:', error);
        }
    },

    async loadTeacherStats() {
        try {
            console.log('📥 Fetching teacher stats...');
            const stats = await getTeacherStats();
            this.state.teacherStats = stats;
        } catch (error) {
            console.error('❌ Error loading teacher stats:', error);
        }
    },

    async loadStudentPerformanceStats() {
        try {
            console.log('📥 Fetching student performance stats...');
            const stats = await getStudentPerformanceStats();
            this.state.studentPerformanceStats = stats;
        } catch (error) {
            console.error('❌ Error loading student performance stats:', error);
            this.state.studentPerformanceStats = [];
        }
    },

    async loadDrillParticipation() {
        try {
            console.log('📥 Fetching drill participation data...');
            const data = await getDrillParticipation();
            this.state.drillParticipation = data;
        } catch (error) {
            console.error('❌ Error loading drill participation:', error);
            this.state.drillParticipation = [];
        }
    },

    async loadDrillReminders() {
        try {
            console.log('📥 Fetching drill reminders...');
            const reminders = await getMyDrillReminders();
            this.state.drillReminders = reminders;
        } catch (error) {
            console.error('❌ Error loading drill reminders:', error);
            this.state.drillReminders = [];
        }
    },

    async loadLeaderboard() {
        try {
            console.log('📥 Fetching leaderboard...');
            const leaderboard = await getLeaderboard();
            this.state.leaderboard = leaderboard;
        } catch (error) {
            console.error('❌ Error loading leaderboard:', error);
        }
    },

    async loadAchievements() {
        try {
            console.log('📥 Fetching achievements...');
            const achievements = await getAchievements();
            this.state.achievements = achievements;
        } catch (error) {
            console.error('❌ Error loading achievements:', error);
        }
    },

    async loadAllUserData() {
        try {
            console.log('📥 Fetching all users...');
            const users = await getAllUsers();
            const currentEmail = localStorage.getItem('crisis_craft_email');
            this.state.allUsers = users.filter(u => u.email !== currentEmail);
        } catch (error) {
            console.error('❌ Error loading users:', error);
        }
    },

    async navigate(role) {
        this.state.role = role;
        this.state.activeSection = 'Dashboard';
        this.state.isLoggedIn = true;
        this.state.isLoading = true;
        this.render();

        // Initial data load based on role
        await this.loadInitialData();

        this.state.isLoading = false;
        this.render();
    },

    async loadInitialData() {
        const role = this.state.role;
        const tasks = [];

        if (role === 'admin') {
            tasks.push(this.loadAdminStats());
        } else if (role === 'teacher') {
            tasks.push(this.loadTeacherStats());
            tasks.push(this.loadStudentPerformanceStats());
            tasks.push(this.loadDrillParticipation());
        } else if (role === 'student') {
            tasks.push(this.loadStudentStats());
            tasks.push(this.loadQuizResults());
            tasks.push(this.loadAchievements());
            tasks.push(this.loadDrillReminders());
        }

        tasks.push(this.loadModules());
        tasks.push(this.loadAlerts());
        if (this.state.role === 'admin') {
            tasks.push(this.loadAllUserData());
            tasks.push(this.loadDetailedReports());
        }
        await Promise.all(tasks);
    },

    async changeSection(section) {
        this.state.activeSection = section;
        this.state.isLoading = true;
        this.render();

        try {
            switch (section) {
                case 'Dashboard':
                    if (this.state.role === 'admin') await this.loadAdminStats();
                    else if (this.state.role === 'teacher') await this.loadTeacherStats();
                    else if (this.state.role === 'student') {
                        await Promise.all([this.loadStudentStats(), this.loadDrillReminders()]);
                    }
                    break;
                case 'Student Performance':
                    if (this.state.role === 'teacher') await this.loadStudentPerformanceStats();
                    break;
                case 'Upload Modules':
                case 'Learning Modules':
                    await this.loadModules();
                    break;
                case 'Manage Quizzes':
                case 'Quizzes':
                    await Promise.all([this.loadQuizzes(), this.loadQuizResults()]);
                    break;
                case 'Manage Drills':
                case 'Virtual Drills':
                case 'Drill Participation':
                    if (this.state.role === 'teacher' || this.state.role === 'admin') {
                        await Promise.all([this.loadDrillParticipation(), this.loadDrills()]);
                    } else {
                        await this.loadDrills();
                    }
                    break;
                case 'Manage Users':
                    await this.loadAllUserData();
                    break;
                case 'Leaderboard':
                    await this.loadLeaderboard();
                    break;
                case 'Achievements':
                    await this.loadAchievements();
                    break;
                case 'Reports & Analytics':
                    await this.loadDetailedReports();
                    break;
            }
        } catch (error) {
            console.error('Data loading error:', error);
        }

        this.state.isLoading = false;
        this.render();
    },

    logout() {
        localStorage.removeItem('crisis_craft_token');
        localStorage.removeItem('crisis_craft_role');
        localStorage.removeItem('crisis_craft_user');

        this.state.role = null;
        this.state.activeSection = 'Dashboard';
        this.state.isLoggedIn = false;
        this.render();
    },

    getAuthHeaders() {
        const token = localStorage.getItem('crisis_craft_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    async registerUser(name, email, password, role) {
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Registration successful! You can now log in.', 'success');
            } else {
                this.showToast(data.message || 'Registration failed.', 'error');
            }
        } catch (error) {
            this.showToast('Network error during registration.', 'error');
            console.error('Register API Error:', error);
        }
    },

    render() {
        const root = document.getElementById('app-root');
        if (!this.state.isLoggedIn) {
            root.innerHTML = this.renderLogin();
        } else {
            root.innerHTML = `
                <div id="app">
                    ${this.renderSidebar()}
                    <main class="main-content">
                        ${this.renderHeader()}
                        <div id="dashboard-content">
                            ${this.renderDashboard()}
                        </div>
                    </main>
                </div>
            `;
            this.initCharts();
            if (this.state.role === 'student' && this.state.activeSection === 'Dashboard') this.initCountdown();
        }
    },

    renderLogin() {
        const isRegister = this.state.showRegister;

        // Build standard/section options
        const standardOptions = [6, 7, 8, 9, 10, 11, 12].map(s => '<option value="' + s + '">' + s + 'th</option>').join('');
        const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F'].map(s => '<option value="' + s + '">' + s + '</option>').join('');

        const registerFields = isRegister ? '<div class="input-group"><label>Full Name</label><input type="text" id="reg-name" class="input-style" placeholder="Your Name"></div>' : '';

        const registerExtras = isRegister ? '<div class="input-group"><label>Role</label><select id="reg-role" class="input-style" style="background: rgba(15, 23, 42, 0.9); color: white;"><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div>' +
            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">' +
            '<div class="input-group" style="margin-bottom:0;"><label>Standard</label><select id="reg-standard" class="input-style" style="background: rgba(15, 23, 42, 0.9); color: white;"><option value="">N/A</option>' + standardOptions + '</select></div>' +
            '<div class="input-group" style="margin-bottom:0;"><label>Section</label><select id="reg-section" class="input-style" style="background: rgba(15, 23, 42, 0.9); color: white;"><option value="">N/A</option>' + sectionOptions + '</select></div>' +
            '</div>' : '';

        const btnAction = isRegister ? 'App.submitRegister()' : 'App.submitLogin()';
        const btnLabel = isRegister ? 'Register Now' : 'Login Now';
        const heading = isRegister ? 'Create Account' : 'Welcome Back';
        const subtitle = isRegister ? 'Join CrisisCraft today.' : 'Please enter your credentials.';
        const switchText = isRegister ? 'Already have an account?' : "Don't have an account?";
        const switchAction = isRegister ? false : true;
        const switchLabel = isRegister ? 'Sign In' : 'Register Here';

        return '<div style="min-height: 100vh; display: flex; background: var(--bg-navy); overflow: hidden;">' +
            '<!-- Left Side: Branding / Hero -->' +
            '<div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; padding: 40px;">' +
            '<div style="position: absolute; top: -100px; left: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(0,245,255,0.1) 0%, transparent 70%); border-radius: 50%; filter: blur(40px); animation: pulse-animation 4s infinite;"></div>' +
            '<div style="position: absolute; bottom: 10%; right: 10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%); border-radius: 50%; filter: blur(50px); animation: pulse-animation 6s infinite;"></div>' +
            '<div style="z-index: 10; display: flex; flex-direction: column; align-items: center; text-align: center; animation: fadeIn 1s ease-out;">' +
            '<div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px;">' +
            '<svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 20px rgba(0, 245, 255, 0.4));">' +
            '<path d="M50 5L15 20V45C15 65 30 85 50 95C70 85 85 65 85 45V20L50 5Z" fill="#1e3a8a" stroke="#00f5ff" stroke-width="3"/>' +
            '<path d="M30 40H70V70C70 73 67 75 64 75H36C33 75 30 73 30 70V40Z" fill="rgba(255,255,255,0.08)"/>' +
            '<path d="M55 25L35 50H50L45 75L65 50H50L55 25Z" fill="#00f5ff">' +
            '<animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />' +
            '</path>' +
            '</svg>' +
            '<span style="font-size: 64px; font-weight: 700; color: white; letter-spacing: -2px;">Crisis<span style="color: var(--cyan);">Craft</span></span>' +
            '</div>' +
            '<p style="color: var(--text-secondary); font-size: 1.4rem; font-weight: 400; letter-spacing: 0.5px;">Empowering Preparedness Through Education</p>' +
            '</div>' +
            '</div>' +
            '<!-- Right Side: Login/Register Card -->' +
            '<div style="flex: 1; display: flex; justify-content: center; align-items: center; background: rgba(255,255,255,0.02); backdrop-filter: blur(10px); border-left: 1px solid rgba(255,255,255,0.05); position: relative;">' +
            '<div class="glass login-card" style="padding: 50px; width: 450px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">' +
            '<div style="text-align: center; margin-bottom: 30px;">' +
            '<h2 style="font-size: 2rem;">' + heading + '</h2>' +
            '<p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 10px;">' + subtitle + '</p>' +
            '</div>' +
            registerFields +
            '<div class="input-group"><label>Email</label><input type="email" id="login-user" class="input-style" placeholder="Email"></div>' +
            '<div class="input-group" style="margin-bottom: 25px;"><label>Password</label><input type="password" id="login-pass" class="input-style" placeholder="••••••••"></div>' +
            registerExtras +
            '<div id="login-error" style="display:none; color:var(--red); background:rgba(239, 68, 68, 0.1); padding:12px; border-radius:10px; font-size:0.9rem; margin-bottom:20px; border:1px solid rgba(239, 68, 68, 0.2);"></div>' +
            '<button onclick="' + btnAction + '" class="btn btn-primary" style="margin-top: 10px; padding: 16px; font-size: 1.05rem;">' + btnLabel + '</button>' +
            '<p style="text-align: center; margin-top: 25px; font-size: 0.95rem; color: var(--text-secondary);">' +
            switchText + ' ' +
            '<a href="#" onclick="App.state.showRegister = ' + switchAction + '; App.render(); return false;" style="color: var(--cyan); text-decoration: none; font-weight: 600; margin-left: 5px;">' + switchLabel + '</a>' +
            '</p>' +
            '</div>' +
            '</div>' +
            '</div>';
    },

    async submitRegister() {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('login-user').value.trim();
        const password = document.getElementById('login-pass').value;
        const role = document.getElementById('reg-role').value;
        const standard = document.getElementById('reg-standard').value;
        const section = document.getElementById('reg-section').value;
        const errorEl = document.getElementById('login-error');

        if (!name || !email || !password) {
            errorEl.style.display = 'block';
            errorEl.innerHTML = 'Please fill all fields';
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, standard, section })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Registration successful! Please login.', 'success');
                this.state.showRegister = false;
                this.render();
            } else {
                errorEl.style.display = 'block';
                errorEl.innerHTML = data.message || 'Registration failed';
            }
        } catch (error) {
            errorEl.style.display = 'block';
            errorEl.innerHTML = 'Network error';
        }
    },

    renderStatCard(label, value, icon, color) {
        return `
            <div class="glass glass-card" style="padding: 25px; display: flex; align-items: center; gap: 20px;">
                <div style="width: 50px; height: 50px; background: ${color}20; color: ${color}; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 1.2rem;">
                    <i class="fas ${icon}"></i>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 5px;">${label}</p>
                    <h2 style="font-size: 1.5rem;">${value}</h2>
                </div>
            </div>
        `;
    },

    renderSidebar() {
        const menuItems = {
            admin: [
                { icon: 'fa-chart-pie', label: 'Dashboard' },
                { icon: 'fa-users', label: 'Manage Users' },
                { icon: 'fa-vr-cardboard', label: 'Manage Drills' },
                { icon: 'fa-file-alt', label: 'Reports & Analytics' },
                { icon: 'fa-bell', label: 'Emergency Alerts' }
            ],
            teacher: [
                { icon: 'fa-th-large', label: 'Dashboard' },
                { icon: 'fa-cloud-upload-alt', label: 'Upload Modules' },
                { icon: 'fa-tasks', label: 'Manage Quizzes' },
                { icon: 'fa-user-graduate', label: 'Student Performance' },
                { icon: 'fa-running', label: 'Drill Participation' }
            ],
            student: [
                { icon: 'fa-home', label: 'Dashboard' },
                { icon: 'fa-book-open', label: 'Learning Modules' },
                { icon: 'fa-vr-cardboard', label: 'Virtual Drills' },
                { icon: 'fa-pen-nib', label: 'Quizzes' },
                { icon: 'fa-trophy', label: 'Achievements' },
                { icon: 'fa-list-ol', label: 'Leaderboard' }
            ]
        };

        const activeRole = this.state.role;
        const activeSection = this.state.activeSection;

        return `
            <aside class="glass sidebar">
                ${this.getLogo('medium')}
                <nav style="flex: 1;">
                    ${menuItems[activeRole].map((item) => {
            const isActive = activeSection === item.label;
            return `
                            <div onclick="App.changeSection('${item.label}')" style="display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 12px; cursor: pointer; color: ${isActive ? 'var(--cyan)' : 'var(--text-secondary)'}; background: ${isActive ? 'rgba(0, 245, 255, 0.05)' : 'transparent'}; margin-bottom: 5px; transition: 0.3s;" class="nav-item">
                                <i class="fas ${item.icon}" style="width: 20px;"></i>
                                <span>${item.label}</span>
                            </div>
                        `;
        }).join('')}
                    <div onclick="App.changeSection('Settings')" style="display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 12px; cursor: pointer; color: ${activeSection === 'Settings' ? 'var(--cyan)' : 'var(--text-secondary)'}; background: ${activeSection === 'Settings' ? 'rgba(0, 245, 255, 0.05)' : 'transparent'}; margin-bottom: 5px; transition: 0.3s;" class="nav-item">
                        <i class="fas fa-cog" style="width: 20px;"></i>
                        <span>Settings</span>
                    </div>
                </nav>
                <div onclick="App.logout()" style="display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 12px; cursor: pointer; color: var(--red); margin-top: auto;">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </div>
            </aside>
        `;
    },

    renderHeader() {
        const role = this.state.role || 'admin';
        const fullName = localStorage.getItem('crisis_craft_user') || this.state.profiles[role]?.name || 'User';
        const alertCount = (this.state.activeAlerts || []).length;

        return `
            <header style="display: flex; justify-content: flex-end; align-items: center; gap: 20px; margin-bottom: 40px; padding: 0 20px;">
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(0, 245, 255, 0.05); padding: 8px 15px; border-radius: 20px; border: 1px solid var(--glass-border);">
                    <div style="width: 8px; height: 8px; background: var(--cyan); border-radius: 50%; box-shadow: 0 0 10px var(--cyan);"></div>
                    <span style="font-size: 0.85rem; color: var(--cyan); font-weight: 600;">System Status: Active</span>
                </div>
                <div style="margin-right: auto; margin-left: 20px;">
                    <h2 style="font-size: 1.2rem; color: white;">Welcome back, <span style="color: var(--cyan);">${fullName}</span></h2>
                </div>

                <!-- Notification Bell -->
                <div id="notif-btn" class="glass" onclick="App.toggleNotificationPanel()" style="width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; border-radius: 12px; position: relative; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,245,255,0.1)'" onmouseout="this.style.background=''">
                    <i class="fas fa-bell" style="color: ${alertCount > 0 ? 'var(--cyan)' : 'inherit'};"></i>
                    ${alertCount > 0 ? `<div style="position: absolute; top: 9px; right: 9px; width: 8px; height: 8px; background: var(--red); border-radius: 50%; box-shadow: 0 0 6px var(--red); animation: pulse 1.5s infinite;"></div>` : `<div style="position: absolute; top: 12px; right: 12px; width: 6px; height: 6px; background: var(--red); border-radius: 50%;"></div>`}
                </div>

                <!-- Profile Avatar -->
                <div id="profile-btn" class="glass" onclick="App.toggleProfilePanel()" style="width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; border-radius: 12px; overflow: hidden; cursor: pointer; transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 0 0 2px var(--cyan)'" onmouseout="this.style.boxShadow=''">
                    <img src="${this.getAvatar(this.state.profiles[this.state.role].avatar)}" alt="avatar" style="width: 100%;">
                </div>
            </header>
        `;
    },

    renderDashboard() {
        const role = this.state.role;
        const section = this.state.activeSection;
        let content = '';

        if (section === 'Settings') content = this.renderSettings(role);
        else if (role === 'admin') content = this.renderAdminViews(section);
        else if (role === 'teacher') content = this.renderTeacherViews(section);
        else if (role === 'student') content = this.renderStudentViews(section);

        return this.renderActiveAlerts() + content;
    },

    renderSettings(role) {
        const colors = { admin: 'var(--cyan)', teacher: 'var(--indigo)', student: 'var(--purple)' };
        const p = this.state.profiles[role];
        const color = colors[role];

        const toggleRow = (id, label, desc) => {
            const checked = this.state.settings[id];
            return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 18px 0; border-bottom: 1px solid var(--glass-border);">
                <div>
                    <p style="font-weight:500;">${label}</p>
                    <p style="font-size:0.82rem; color:var(--text-secondary); margin-top:3px;">${desc}</p>
                </div>
                <label style="position:relative; display:inline-block; width:48px; height:26px; cursor:pointer;">
                    <input type="checkbox" ${checked ? 'checked' : ''} id="${id}" style="opacity:0; width:0; height:0;" onchange="App.settingToggle('${id}', this.checked)">
                    <span id="track-${id}" style="position:absolute; inset:0; background:${checked ? color : 'rgba(255,255,255,0.1)'}; border-radius:26px; transition:0.3s;">
                        <span id="knob-${id}" style="position:absolute; height:20px; width:20px; background:white; border-radius:50%; top:3px; left:${checked ? '25px' : '3px'}; transition:0.3s; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></span>
                    </span>
                </label>
            </div>`;
        };

        // Avatar seeds for picker (Simplified to one Boy, one Girl)
        const avatarSeeds = ['Felix', 'Aneka'];

        const roleSpecific = {
            admin: `
                <div class="glass" style="padding:30px; margin-bottom:20px;">
                    <h3 style="margin-bottom:5px;">System Configuration</h3>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:20px;">Control platform-wide settings</p>
                    ${toggleRow('maint', 'Maintenance Mode', 'Take the platform offline for updates')}
                    ${toggleRow('reg', 'Open Registration', 'Allow new users to self-register')}
                    ${toggleRow('autoAlert', 'Auto Drill Alerts', 'Notify all users 24h before a drill')}
                    ${toggleRow('audit', 'Audit Logging', 'Record all admin actions to the audit log')}
                </div>
                <div class="glass" style="padding:30px; margin-bottom:20px;">
                    <h3 style="margin-bottom:20px;">Danger Zone</h3>
                    <div style="display:flex; gap:15px; flex-wrap:wrap;">
                        <button class="btn" style="background:rgba(239,68,68,0.1); color:var(--red); border:1px solid rgba(239,68,68,0.3); width:auto; padding:10px 20px;" onclick="App.showToast('This requires backend API implementation', 'error')">Reset All Quiz Scores</button>
                        <button class="btn" style="background:rgba(239,68,68,0.1); color:var(--red); border:1px solid rgba(239,68,68,0.3); width:auto; padding:10px 20px;" onclick="App.showToast('This requires backend API implementation', 'error')">Clear Drill History</button>
                        <button class="btn" style="background:rgba(239,68,68,0.2); color:var(--red); border:1px solid rgba(239,68,68,0.5); width:auto; padding:10px 20px; font-weight:bold;" onclick="if(confirm('⚠ FACTORY RESET: This will erase app state. Are you sure?')) { localStorage.clear(); location.reload(); }">Factory Reset (Local)</button>
                    </div>
                </div>`,
            teacher: `
                <div class="glass" style="padding:30px; margin-bottom:20px;">
                    <h3 style="margin-bottom:5px;">Teaching Preferences</h3>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:20px;">Customize your classroom experience</p>
                    ${toggleRow('autoGrade', 'Auto-Grade Quizzes', 'Automatically release quiz scores after submission')}
                    ${toggleRow('perfNotif', 'Performance Alerts', 'Get notified when a student drops below 60%')}
                    ${toggleRow('drillRemind', 'Drill Reminders', 'Send daily digest reminders to enrolled students')}
                    ${toggleRow('hideNames', 'Anonymous Grading', 'Hide student names when reviewing submissions')}
                </div>`,
            student: `
                <div class="glass" style="padding:30px; margin-bottom:20px;">
                    <h3 style="margin-bottom:5px;">Notification Preferences</h3>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:20px;">Choose what updates you receive</p>
                    ${toggleRow('drillAlrt', 'Upcoming Drill Alerts', 'Remind me 1 day before a drill I am registered for')}
                    ${toggleRow('quizAlrt', 'Quiz Deadlines', 'Notify when a new quiz is published')}
                    ${toggleRow('ldrAlrt', 'Leaderboard Updates', 'Alert me when someone overtakes my rank')}
                    ${toggleRow('bdgAlrt', 'Badge Earned', 'Celebrate when I unlock a new Achievement')}
                </div>
                <div class="glass" style="padding:30px; margin-bottom:20px;">
                    <h3 style="margin-bottom:20px;">Privacy</h3>
                    ${toggleRow('pubPro', 'Public Profile', 'Allow other students to see your progress')}
                    ${toggleRow('ldrbrd', 'Show on Leaderboard', 'Display your name in the public rankings')}
                </div>`
        };

        return `
            <div style="max-width: 780px;">
                <!-- Profile Card -->
                <div class="glass" style="padding:30px; margin-bottom:20px;">
                    <h3 style="margin-bottom:20px;">Profile</h3>
                    <div style="display:flex; align-items:flex-start; gap:25px;">
                        <div style="position:relative; flex-shrink:0;">
                            <img id="profileAvatar" src="${this.getAvatar(p.avatar)}" style="width:90px; height:90px; border-radius:50%; border:3px solid ${color};">
                            <div style="position:absolute; bottom:2px; right:2px; width:18px; height:18px; background:#22c55e; border-radius:50%; border:2px solid var(--bg-navy);"></div>
                        </div>
                        <div style="flex:1;">
                            <p style="color:var(--text-secondary); font-size:0.82rem; margin-bottom:10px;">Pick an avatar</p>
                            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
                                ${avatarSeeds.map(seed => `<img src="${this.getAvatar(seed)}" style="width:40px; height:40px; border-radius:50%; cursor:pointer; border: 2px solid ${p.avatar === seed ? color : 'transparent'}; transition:0.2s;" onclick="App.changeAvatar('${seed}')" title="${seed}">`).join('')}
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                <div>
                                    <label style="color:var(--text-secondary); font-size:0.82rem; display:block; margin-bottom:5px;">Full Name</label>
                                    <input id="profileName" type="text" class="input-style" value="${p.name}" style="padding:10px 14px;">
                                </div>
                                <div>
                                    <label style="color:var(--text-secondary); font-size:0.82rem; display:block; margin-bottom:5px;">Email</label>
                                    <input id="profileEmail" type="text" class="input-style" value="${p.email}" style="padding:10px 14px;">
                                </div>
                                <div>
                                    <label style="color:var(--text-secondary); font-size:0.82rem; display:block; margin-bottom:5px;">Title</label>
                                    <input id="profileTitle" type="text" class="input-style" value="${p.title || ''}" style="padding:10px 14px;">
                                </div>
                                ${(role === 'student' || role === 'teacher') ? `
                                    <div>
                                        <label style="color:var(--text-secondary); font-size:0.82rem; display:block; margin-bottom:5px;">Standard</label>
                                        <input id="profileStandard" type="text" class="input-style" value="${p.standard || ''}" style="padding:10px 14px; background:rgba(255,255,255,0.03); cursor:not-allowed;" readonly>
                                    </div>
                                    <div>
                                        <label style="color:var(--text-secondary); font-size:0.82rem; display:block; margin-bottom:5px;">Section</label>
                                        <input id="profileSection" type="text" class="input-style" value="${p.section || ''}" style="padding:10px 14px; background:rgba(255,255,255,0.03); cursor:not-allowed;" readonly>
                                    </div>
                                ` : ''}
                            </div>
                            <button class="btn btn-primary" style="width:auto; padding:10px 25px; margin-top:15px;" onclick="App.saveProfile()"><i class="fas fa-save" style="margin-right:8px;"></i>Save Changes</button>
                        </div>
                    </div>
                </div>
                <!-- Appearance -->
                <div class="glass" style="padding:30px; margin-bottom:20px;">
                    <h3 style="margin-bottom:5px;">Appearance</h3>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:20px;">Customize how CrisisCraft looks</p>
                    ${toggleRow('notifOn', 'Email Notifications', 'Receive important updates to your registered email')}
                    ${toggleRow('compactView', 'Compact Sidebar', 'Show the sidebar in icon-only mode')}
                    ${toggleRow('animations', 'UI Animations', 'Enable smooth transitions and hover effects')}
                </div>
                ${roleSpecific[role]}
                <!-- Account Security -->
                <div class="glass" style="padding:30px;">
                    <h3 style="margin-bottom:5px;">Account Security</h3>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:20px;">Manage your account authentication and sessions</p>
                    <div style="display:flex; gap:15px; flex-wrap:wrap;">
                        <button class="btn" style="background:rgba(255,255,255,0.06); border:1px solid var(--glass-border); width:auto; padding:10px 20px; color:white;" onclick="App.showToast('Password change email sent to ${p.email}', 'success')">Change Password</button>
                        <button class="btn" style="background:rgba(255,255,255,0.06); border:1px solid var(--glass-border); width:auto; padding:10px 20px; color:white;" onclick="App.showToast('Two-factor authentication enabled!', 'success')">Enable 2FA</button>
                        <button class="btn" style="background:rgba(239,68,68,0.1); color:var(--red); border:1px solid rgba(239,68,68,0.3); width:auto; padding:10px 20px;" onclick="if(confirm('Sign out of all devices?')) App.logout()">Sign Out All Devices</button>
                    </div>
                </div>
            </div>`;
    },

    changeAvatar(seed) {
        this.state.profiles[this.state.role].avatar = seed;
        this.showToast('Avatar updated!', 'success');
        this.saveState();
        this.render();
    },

    saveProfile() {
        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const titleInput = document.getElementById('profileTitle');

        const role = this.state.role;
        if (nameInput) this.state.profiles[role].name = nameInput.value.trim();
        if (emailInput) this.state.profiles[role].email = emailInput.value.trim();

        if (titleInput && titleInput.value.trim()) {
            this.state.profiles[role].title = titleInput.value.trim();
        } else if (role === 'student') {
            const p = this.state.profiles.student;
            p.title = p.standard ? `Student, Grade ${p.standard}${p.section || ''}` : 'Student';
        }

        this.showToast('Profile updated!', 'success');
        this.saveState();
        this.render();
    },

    async exportCSV(type) {
        let csv = '', filename = '';

        // Ensure report data is loaded
        if (!this.state.detailedReport) {
            this.showToast('Fetching latest data for export...', 'info');
            try {
                this.state.detailedReport = await getDetailedReports();
            } catch (error) {
                return this.showToast('Failed to fetch data for export', 'error');
            }
        }

        const report = this.state.detailedReport;
        if (type === 'full_report' && report) {
            filename = `CrisisCraft_Full_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
            csv = 'Name,Email,Standard,Section,Institution,Total Score\n';
            report.users.forEach(u => {
                csv += `"${u.name}","${u.email}","${u.standard || ''}","${u.section || ''}","${u.institution || 'Main Campus'}",${u.score}\n`;
            });
        } else {
            this.showToast('Export data not available', 'error');
            return;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast(`Report exported as ${filename}`, 'success');
    },

    settingToggle(id, checked) {
        this.state.settings[id] = checked;

        // Targeted DOM update to prevent "jumping" (scrolling to top)
        const track = document.getElementById(`track-${id}`);
        const knob = document.getElementById(`knob-${id}`);
        const colors = { admin: 'var(--cyan)', teacher: 'var(--indigo)', student: 'var(--purple)' };
        const color = colors[this.state.role || 'admin'];

        if (track && knob) {
            track.style.background = checked ? color : 'rgba(255,255,255,0.1)';
            knob.style.left = checked ? '25px' : '3px';
        }

        this.showToast(`${id.charAt(0).toUpperCase() + id.slice(1)} ${checked ? 'enabled' : 'disabled'}`, 'success');
        this.saveState();
        // Do NOT call this.render() here to avoid page jumping
    },

    showToast(msg, type = 'success') {
        const old = document.getElementById('cc-toast');
        if (old) old.remove();
        const t = document.createElement('div');
        t.id = 'cc-toast';
        t.style.cssText = `position:fixed; bottom:30px; right:30px; z-index:9999; background:${type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}; border:1px solid ${type === 'success' ? '#22c55e' : '#ef4444'}; color:white; padding:14px 22px; border-radius:12px; font-size:0.9rem; backdrop-filter:blur(10px); max-width:320px; box-shadow:0 4px 20px rgba(0,0,0,0.3); display:flex; gap:10px; align-items:center;`;
        t.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="color:${type === 'success' ? '#22c55e' : '#ef4444'};"></i> ${msg}`;
        document.body.appendChild(t);
        setTimeout(() => t && t.remove(), 3500);
    },

    renderActiveAlerts() {
        if (!this.state.activeAlerts || this.state.activeAlerts.length === 0) return '';
        return this.state.activeAlerts.map((alert, index) => `
            <div style="background: linear-gradient(90deg, #dc2626 0%, #991b1b 100%); border: 2px solid #ef4444; padding: 18px 25px; margin-bottom: 25px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3); animation: slideDown 0.5s ease-out;">
                <div style="display: flex; gap: 15px; align-items: center;">
                    <div style="background: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 1s infinite;">
                        <i class="fas fa-exclamation-triangle" style="color: #dc2626; font-size: 1.2rem;"></i>
                    </div>
                    <div>
                        <span style="color: white; font-weight: 800; font-size: 1.1rem; letter-spacing: 1px; text-transform: uppercase;">ALERT:</span>
                        <span style="color: white; font-weight: 500; font-size: 1rem; margin-left: 5px;">${alert.message}</span>
                    </div>
                </div>
                ${this.state.role === 'admin' ? `<i class="fas fa-times" style="color: rgba(255,255,255,0.7); cursor: pointer; font-size: 1.2rem; transition: 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='rgba(255,255,255,0.7)'" onclick="App.dismissAlert('${alert.id}')"></i>` : ''}
            </div>
        `).join('');
    },

    sendAlert(msg) {
        const input = document.getElementById('alertInput');
        const alertText = msg || (input ? input.value.trim() : '');

        if (!alertText) {
            this.showToast('Please enter an alert message', 'error');
            return;
        }

        if (!this.state.activeAlerts) this.state.activeAlerts = [];
        this.state.activeAlerts.push(alertText);

        if (input) input.value = '';

        this.showToast('ALERT sent successfully', 'success');
        this.saveState();
        this.render();
    },

    dismissAlert(index) {
        if (this.state.activeAlerts) {
            this.state.activeAlerts.splice(index, 1);
            this.saveState();
            this.render();
        }
    },

    // --- ADMIN VIEWS ---
    renderAdminViews(section) {
        if (section === 'Dashboard') return this.getAdminOverview();
        if (section === 'Manage Users') return this.getManageUsers();
        if (section === 'Manage Drills') return this.getManageDrills();
        if (section === 'Reports & Analytics') return this.getReportsPanel();
        if (section === 'Emergency Alerts') return this.getAlertPanel();
        return `<h2>${section}</h2>`;
    },

    async loadDetailedReports() {
        if (this.state.isReportLoading) return;
        try {
            this.state.isReportLoading = true;
            this.state.isLoading = true;
            const reportData = await getDetailedReports();
            this.state.detailedReport = reportData;
            this.state.isLoading = false;
            this.state.isReportLoading = false;
            this.render();
        } catch (error) {
            this.state.isReportLoading = false;
            this.state.isLoading = false;
            console.error('❌ Detailed Reports Fetch Error:', error);
            this.showToast(`Error: ${error.message || 'Failed to load reports'}`, 'error');
        }
    },

    getReportsPanel() {
        const report = this.state.detailedReport;
        if (!report) {
            if (!this.state.isReportLoading) {
                setTimeout(() => this.loadDetailedReports(), 0);
            }
            return `<div class="glass" style="padding:40px; text-align:center;">
                <div style="width: 40px; height: 40px; border: 3px solid rgba(0, 245, 255, 0.1); border-top: 3px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
                <p style="color:var(--text-secondary);">Loading reports...</p>
            </div>`;
        }

        return `
            <div style="display: grid; gap: 30px;">
                <div class="glass" style="padding: 40px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                        <div>
                            <h2 style="margin-bottom: 5px;">Institutional Readiness Report</h2>
                            <p style="color:var(--text-secondary);">Comprehensive data on student and staff performance</p>
                        </div>
                        <button class="btn btn-primary" style="width:auto; padding:12px 25px;" onclick="App.exportCSV('full_report')">
                            <i class="fas fa-file-export" style="margin-right:8px;"></i>Export CSV
                        </button>
                    </div>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:25px; margin-bottom:30px;">
                        <div class="glass" style="padding:25px; background:rgba(0,245,255,0.02);">
                            <h4 style="margin-bottom:15px; color:var(--cyan);">Top Performers</h4>
                            <div style="display:grid; gap:10px;">
                                ${report.users.slice(0, 5).map(u => `
                                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                                        <span>${u.name}</span>
                                        <span style="color:var(--cyan); font-weight:bold;">${u.score} pts</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="glass" style="padding:25px; background:rgba(139,92,246,0.02);">
                            <h4 style="margin-bottom:15px; color:var(--purple);">Recent Quiz Activity</h4>
                            <div style="display:grid; gap:10px;">
                                ${report.quizResults.slice(0, 5).map(r => `
                                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                                        <span>${r.quizId?.title || 'Quiz'}</span>
                                        <span style="color:var(--purple); font-weight:bold;">${r.readinessScore}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <h4 style="margin-bottom:15px;">Student Performance Roster</h4>
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size:0.85rem;">
                        <thead>
                            <tr style="color: var(--text-secondary); border-bottom: 1px solid var(--glass-border);">
                                <th style="padding: 10px;">STUDENT</th>
                                <th style="padding: 10px;">CLASS</th>
                                <th style="padding: 10px;">EMAIL</th>
                                <th style="padding: 10px; text-align:right;">TOTAL SCORE</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.users.map(u => `
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 12px; color: white; font-weight:500;">${u.name}</td>
                                    <td style="padding: 12px; color: var(--text-secondary);">${u.standard ? `${u.standard}-${u.section}` : '-'}</td>
                                    <td style="padding: 12px; color: var(--text-secondary);">${u.email || '-'}</td>
                                    <td style="padding: 12px; text-align:right; color: var(--cyan); font-weight:bold;">${u.score}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    },

    getAdminOverview() {
        const stats = this.state.adminStats || { totalStudents: 0, totalTeachers: 0, totalUsers: 0, modules: 0, quizzes: 0, drills: 0, systemReadiness: 0 };
        const isLoading = this.state.isLoading;

        if (isLoading) {
            return `
                <div class="glass" style="padding: 40px; text-align: center;">
                    <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                    <p style="color: var(--text-secondary);">Loading statistics...</p>
                </div>`;
        }

        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                ${this.renderStatCard("Total Users", stats.totalUsers, "fa-users", "var(--cyan)")}
                ${this.renderStatCard("Active Drills", stats.activeDrills || 0, "fa-vr-cardboard", "var(--purple)")}
                ${this.renderStatCard("System Readiness", stats.systemReadiness + "%", "fa-shield-alt", "var(--cyan)")}
            </div>
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px;">
                <div class="glass" style="padding: 30px;">
                    <h3 style="margin-bottom: 25px;">Drill Participation Trends</h3>
                    <div style="height: 300px;"><canvas id="drillChart"></canvas></div>
                </div>
                <div class="glass" style="padding: 30px;">
                    <h3 style="margin-bottom: 25px;">Institutional Awareness</h3>
                    <div style="height: 300px;"><canvas id="awarenessChart"></canvas></div>
                </div>
            </div>
        `;
    },

    handleUserSearch(query) {
        this.state.userSearchQuery = query;
        this.render();
    },

    getManageUsers() {
        const currentUserEmail = localStorage.getItem('crisis_craft_email');
        const allNonAdmins = (this.state.allUsers || []).filter(u => u.email !== currentUserEmail && u.role !== 'admin');
        const isLoading = this.state.isLoading;
        const searchQuery = (this.state.userSearchQuery || '').toLowerCase();
        const roleFilter = this.state.userRoleFilter || 'all';

        if (isLoading) {
            return `
                <div class="glass" style="padding: 40px; text-align: center;">
                    <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                    <p style="color: var(--text-secondary);">Loading users...</p>
                </div>`;
        }

        const filteredUsers = allNonAdmins.filter(u => {
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            const matchesSearch = u.name.toLowerCase().includes(searchQuery) || u.email.toLowerCase().includes(searchQuery);
            return matchesRole && matchesSearch;
        });

        return `
            <div class="glass" style="padding: 40px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div>
                        <h3 style="font-size: 1.8rem;">Manage Users</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">${allNonAdmins.length} registered users in the system</p>
                    </div>
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <!-- Role Dropdown -->
                        <div style="position: relative;">
                            <select onchange="App.state.userRoleFilter = this.value; App.render();" 
                                style="appearance: none; padding: 12px 45px 12px 20px; background: rgba(15, 23, 42, 0.9); border: 2px solid var(--glass-border); border-radius: 12px; color: white; outline: none; font-size: 0.9rem; cursor: pointer; transition: 0.3s; min-width: 160px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);"
                                onfocus="this.style.borderColor='var(--cyan)'; this.style.boxShadow='0 0 15px rgba(0,245,255,0.2)'"
                                onblur="this.style.borderColor='var(--glass-border)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)'"
                            >
                                <option value="all" ${roleFilter === 'all' ? 'selected' : ''} style="background: #0f172a; color: white; padding: 10px;">All Roles</option>
                                <option value="teacher" ${roleFilter === 'teacher' ? 'selected' : ''} style="background: #0f172a; color: white; padding: 10px;">Teachers</option>
                                <option value="student" ${roleFilter === 'student' ? 'selected' : ''} style="background: #0f172a; color: white; padding: 10px;">Students</option>
                            </select>
                            <i class="fas fa-chevron-down" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--cyan); font-size: 0.8rem;"></i>
                        </div>

                        <!-- Search Bar -->
                        <div style="position: relative; width: 250px;">
                            <i class="fas fa-search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 0.9rem;"></i>
                            <input type="text" placeholder="Search users..." value="${this.state.userSearchQuery || ''}" 
                                oninput="App.handleUserSearch(this.value)" 
                                style="width: 100%; padding: 12px 15px 12px 45px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; color: white; outline: none; font-size: 0.9rem; transition: border-color 0.3s;"
                                onfocus="this.style.borderColor='var(--cyan)'"
                                onblur="this.style.borderColor='var(--glass-border)'"
                            >
                        </div>
                        <button class="btn btn-primary" style="width: auto; padding: 12px 25px;" onclick="App.showAddUserModal()">
                            <i class="fas fa-user-plus" style="margin-right: 8px;"></i>Add User
                        </button>
                    </div>
                </div>

                <div class="glass" style="overflow: hidden; border: 1px solid var(--glass-border);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--glass-border);">
                                <th style="padding: 18px 25px; color: var(--text-secondary); font-weight: 600; font-size: 0.75rem; letter-spacing: 1px;">NAME</th>
                                <th style="padding: 18px 25px; color: var(--text-secondary); font-weight: 600; font-size: 0.75rem; letter-spacing: 1px;">ROLE</th>
                                <th style="padding: 18px 25px; color: var(--text-secondary); font-weight: 600; font-size: 0.75rem; letter-spacing: 1px;">STATUS</th>
                                <th style="padding: 18px 25px; color: var(--text-secondary); font-weight: 600; font-size: 0.75rem; letter-spacing: 1px; text-align: center;">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredUsers.length === 0 ? `
                                <tr>
                                    <td colspan="4" style="padding: 50px; text-align: center; color: var(--text-secondary);">
                                        <i class="fas fa-users-slash" style="font-size: 2rem; opacity: 0.3; margin-bottom: 15px; display: block;"></i>
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ` : filteredUsers.map(user => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.01)'" onmouseout="this.style.background=''">
                                    <td style="padding: 18px 25px;">
                                        <div style="display: flex; align-items: center; gap: 15px;">
                                            <div style="width: 35px; height: 35px; border-radius: 50%; background: ${user.role === 'teacher' ? 'rgba(79,70,229,0.1)' : 'rgba(139,92,246,0.1)'}; display: flex; align-items: center; justify-content: center;">
                                                <i class="fas ${user.role === 'teacher' ? 'fa-chalkboard-teacher' : 'fa-user-graduate'}" style="color: ${user.role === 'teacher' ? 'var(--indigo)' : 'var(--purple)'}; font-size: 0.9rem;"></i>
                                            </div>
                                            <div>
                                                <p style="font-weight: 600; color: white;">${user.name}</p>
                                                <p style="font-size: 0.75rem; color: var(--text-secondary);">${user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 18px 25px;">
                                        <span style="font-size: 0.75rem; font-weight: 600; color: ${user.role === 'teacher' ? 'var(--indigo)' : 'var(--purple)'}; background: ${user.role === 'teacher' ? 'rgba(79,70,229,0.1)' : 'rgba(139,92,246,0.1)'}; padding: 4px 12px; border-radius: 20px; text-transform: capitalize;">
                                            ${user.role}
                                        </span>
                                    </td>
                                    <td style="padding: 18px 25px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e;"></div>
                                            <span style="font-size: 0.85rem; color: #22c55e; font-weight: 500;">Active</span>
                                        </div>
                                    </td>
                                    <td style="padding: 18px 25px; text-align: center;">
                                        <div style="display: flex; gap: 10px; justify-content: center;">
                                            <button class="glass" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; cursor: pointer; transition: 0.3s;" onclick="App.showEditUserModal('${user._id}')" onmouseover="this.style.background='rgba(0,245,255,0.1)'; this.style.borderColor='var(--cyan)'" onmouseout="this.style.background=''; this.style.borderColor=''">
                                                <i class="fas fa-edit" style="font-size: 0.85rem; color: var(--cyan);"></i>
                                            </button>
                                            <button class="glass" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; cursor: pointer; transition: 0.3s;" onclick="App.removeUser('${user._id}')" onmouseover="this.style.background='rgba(239,68,68,0.1)'; this.style.borderColor='var(--red)'" onmouseout="this.style.background=''; this.style.borderColor=''">
                                                <i class="fas fa-trash" style="font-size: 0.85rem; color: var(--red);"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    getManageDrills() {
        const drills = this.state.drills || [];
        const isLoading = this.state.isLoading;

        if (isLoading) {
            return `
                <div class="glass" style="padding: 40px; text-align: center;">
                    <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                    <p style="color: var(--text-secondary);">Loading drills...</p>
                </div>`;
        }

        return `
            <div class="glass" style="padding: 40px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h3>Manage Virtual Drills</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">${drills.length} scheduled simulations</p>
                    </div>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" onclick="App.showAddDrillModal()">+ Schedule Drill</button>
                </div>
                <div style="display: grid; gap: 15px;">
                    ${drills.length === 0 ? `
                        <div style="text-align: center; padding: 40px;">
                            <i class="fas fa-vr-cardboard" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                            <p style="color: var(--text-secondary);">No drills scheduled yet</p>
                        </div>
                    ` : drills.map(d => `
                        <div class="glass" style="padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(0,245,255,0.1);">
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(0,245,255,0.1); display: flex; align-items: center; justify-content: center; color: var(--cyan);">
                                    <i class="fas fa-vr-cardboard" style="font-size: 1.3rem;"></i>
                                </div>
                                <div>
                                    <h4 style="margin-bottom: 5px;">${d.title}</h4>
                                    <div style="display: flex; gap: 15px; font-size: 0.8rem; color: var(--text-secondary);">
                                        <span><i class="fas fa-calendar" style="margin-right: 5px;"></i>${new Date(d.scheduledDate).toLocaleDateString()}</span>
                                        <span><i class="fas fa-users" style="margin-right: 5px;"></i>${d.participation || 0} Registered</span>
                                        <span style="color: ${d.status === 'Active' ? 'var(--green)' : 'var(--cyan)'}">● ${d.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn" style="width: auto; padding: 8px 15px; font-size: 0.8rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);" onclick="App.viewDrillDetails('${d._id}')">
                                    Details
                                </button>
                                <button class="btn" style="width: auto; padding: 8px 15px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.1); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.2);" onclick="App.removeDrill('${d._id}')">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    getAlertPanel() {
        const alerts = this.state.activeAlerts || [];
        return `
            <div class="glass pulse" style="padding: 30px; border: 2px solid #dc2626; background: rgba(220, 38, 38, 0.05); margin-bottom: 30px; border-radius: 16px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                    <div style="width: 50px; height: 50px; background: #dc2626; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);">
                        <i class="fas fa-exclamation-triangle" style="color: white; font-size: 1.5rem;"></i>
                    </div>
                    <div>
                        <h3 style="color: white; margin: 0;">Emergency ALERT Panel</h3>
                        <p style="color: var(--text-secondary); margin: 5px 0 0; font-size: 0.85rem;">Instantly notify all active users across the platform</p>
                    </div>
                </div>
                <div style="display: flex; gap: 20px; align-items: flex-end; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <label style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:8px; display:block; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Alert Message</label>
                        <input type="text" id="alertInput" class="input-style" placeholder="Describe the emergency situation..." style="background: rgba(0,0,0,0.3); border: 1px solid rgba(220, 38, 38, 0.3);">
                    </div>
                    <div style="width: 180px;">
                        <label style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:8px; display:block; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Severity Level</label>
                        <select id="alertType" class="input-style" style="background:#0f172a; color:white; border: 1px solid rgba(220, 38, 38, 0.3);">
                            <option value="Info">Low (Information)</option>
                            <option value="Warning">Medium (Warning)</option>
                            <option value="Critical">High (EMERGENCY)</option>
                        </select>
                    </div>
                    <button class="btn" style="background: #dc2626; color: white; width: 160px; font-weight: 800; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3); height: 48px;" onclick="App.sendAlert()">SEND ALERT</button>
                </div>
            </div>

            <div class="glass" style="padding: 30px; border-radius: 16px;">
                <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-history" style="color: var(--cyan);"></i> Active Alerts History
                </h3>
                <div style="display: grid; gap: 15px;">
                    ${alerts.length === 0 ? `
                        <div style="text-align: center; padding: 40px;">
                            <i class="fas fa-bell-slash" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.3; margin-bottom: 15px; display: block;"></i>
                            <p style="color:var(--text-secondary);">No active emergency alerts at this time</p>
                        </div>
                    ` : alerts.map(a => `
                        <div class="glass" style="padding:18px 25px; display:flex; justify-content:space-between; align-items:center; border-left:5px solid ${a.type === 'Critical' ? '#dc2626' : a.type === 'Warning' ? '#f59e0b' : '#00f5ff'}; background: rgba(255,255,255,0.02); border-radius: 10px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                                    <span style="font-size: 0.7rem; font-weight: 800; padding: 3px 10px; border-radius: 20px; background: ${a.type === 'Critical' ? 'rgba(220, 38, 38, 0.15)' : a.type === 'Warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 245, 255, 0.15)'}; color: ${a.type === 'Critical' ? '#dc2626' : a.type === 'Warning' ? '#f59e0b' : '#00f5ff'}; border: 1px solid ${a.type === 'Critical' ? '#dc2626' : a.type === 'Warning' ? '#f59e0b' : '#00f5ff'}; text-transform: uppercase;">${a.type}</span>
                                    <span style="font-size: 0.75rem; color: var(--text-secondary);"><i class="far fa-clock"></i> Just now</span>
                                </div>
                                <p style="font-weight:600; color: white; margin: 0; font-size: 1.05rem;">${a.message}</p>
                            </div>
                            <button class="btn" style="width:auto; padding:8px 18px; font-size:0.8rem; background:rgba(239,68,68,0.1); color:#ef4444; border: 1px solid rgba(239,68,68,0.3); font-weight: 600;" onclick="App.dismissAlert('${a._id}')">DISMISS</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async sendAlert() {
        const msg = document.getElementById('alertInput').value.trim();
        const type = document.getElementById('alertType').value;
        if (!msg) return this.showToast('Please enter a message', 'error');

        try {
            await sendAdminAlert(msg, type);
            this.showToast('ALERT broadcasted successfully!', 'success');
            document.getElementById('alertInput').value = '';
            await this.loadAlerts();
        } catch (error) {
            this.showToast('Failed to send ALERT', 'error');
        }
    },

    async dismissAlert(alertId) {
        try {
            await dismissAlert(alertId);
            this.showToast('Alert dismissed', 'success');
            await this.loadAlerts();
        } catch (error) {
            this.showToast('Failed to dismiss alert', 'error');
        }
    },

    // --- TEACHER VIEWS ---
    renderTeacherViews(section) {
        if (section === 'Dashboard') return this.getTeacherOverview();
        if (section === 'Upload Modules') return this.getUploadModules();
        if (section === 'Manage Quizzes') return this.getManageQuizzes();
        if (section === 'Student Performance') return `<div class="glass" style="padding: 40px;"><h3>Student Performance</h3><div style="margin-top:20px;">${this.getStudentPerformanceTable()}</div></div>`;
        if (section === 'Drill Participation') return this.getDrillParticipation();
        return `<h2>${section}</h2>`;
    },

    getUploadModules() {
        const mods = this.state.uploadedModules || [];
        const isLoading = this.state.isLoading;

        return `
            <div style="display:grid; gap:25px;">
                <div class="glass" style="padding:35px; border:1px solid rgba(0,245,255,0.15);">
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:28px;">
                        <div style="width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg,rgba(0,245,255,0.2),rgba(0,245,255,0.05)); display:flex; align-items:center; justify-content:center; border:1px solid rgba(0,245,255,0.3);">
                            <i class="fas fa-cloud-upload-alt" style="color:var(--cyan); font-size:1.2rem;"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; color:white; font-size:1.3rem;">Upload Training Module</h3>
                            <p style="margin:0; color:var(--text-secondary); font-size:0.8rem; margin-top:3px;">Distribute educational PDF content to your students</p>
                        </div>
                    </div>

                    <div id="dropZone" onclick="document.getElementById('pdfInput').click()"
                         style="padding:60px; border:2px dashed rgba(0,245,255,0.25); border-radius:20px; text-align:center; cursor:pointer; transition:0.3s; background:rgba(0,245,255,0.03);"
                         onmouseover="this.style.borderColor='var(--cyan)'; this.style.background='rgba(0,245,255,0.06)'; this.style.transform='scale(1.005)';"
                         onmouseout="this.style.borderColor='rgba(0,245,255,0.25)'; this.style.background='rgba(0,245,255,0.03)'; this.style.transform='scale(1)';"
                    >
                        <div style="width:64px; height:64px; background:rgba(0,245,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 18px;">
                            <i class="fas fa-file-pdf" style="font-size:1.8rem; color:var(--cyan);"></i>
                        </div>
                        <p style="font-size:1.2rem; font-weight:600; margin-bottom:8px; color:white;">Click to select or drag & drop PDF</p>
                        <p style="color:var(--text-secondary); font-size:0.85rem;">Maximum file size: 50MB</p>
                        <input type="file" id="pdfInput" accept=".pdf" style="display:none;" onchange="App.handleFileSelect(this)">
                    </div>
                    <div id="selectedFileInfo" style="margin-top:20px; display:none;">
                        <div class="glass" style="padding:15px 20px; display:flex; align-items:center; justify-content:space-between; border:1px solid rgba(0,245,255,0.2);">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <i class="fas fa-file-pdf" style="color:#ef4444; font-size:1.4rem;"></i>
                                <div>
                                    <p id="selectedFileName" style="font-weight:500;"></p>
                                    <p id="selectedFileSize" style="font-size:0.8rem; color:var(--text-secondary);"></p>
                                </div>
                            </div>
                            <i class="fas fa-times" style="color:var(--text-secondary); cursor:pointer;" onclick="App.clearFileSelection()"></i>
                        </div>
                        <div style="margin-top:15px;">
                            <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:8px;">Module Title</label>
                            <input type="text" id="moduleTitle" class="input-style" placeholder="e.g. Earthquake Response Protocol" style="padding:12px 16px; margin-bottom:15px;">
                            
                            <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:8px;">Module Content / Summary</label>
                            <textarea id="moduleContent" class="input-style" placeholder="Enter the key training content or summary here..." style="padding:12px 16px; margin-bottom:15px; min-height:100px; resize:vertical;"></textarea>
                            
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px;">
                                <div>
                                    <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:8px;">Target Class (Standard)</label>
                                    <select id="moduleStandard" style="width:100%; padding:12px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem;">
                                        <option value="">All Standards</option>
                                        ${[6, 7, 8, 9, 10, 11, 12].map(s => `<option value="${s}">${s}th Standard</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:8px;">Target Section</label>
                                    <select id="moduleSection" style="width:100%; padding:12px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem;">
                                        <option value="">All Sections</option>
                                        ${['A', 'B', 'C', 'D', 'E', 'F'].map(s => `<option value="${s}">Section ${s}</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                            <button onclick="App.postModule(); return false;" 
                                style="margin-top:10px; padding:13px 35px; border-radius:12px; border:none; background:linear-gradient(135deg, #00c9e0, #0077ff); color:white; font-size:0.95rem; font-weight:700; cursor:pointer; transition:0.3s; box-shadow: 0 4px 15px rgba(0,200,255,0.3);"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,200,255,0.45)';"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,200,255,0.3)';"
                            >
                                <i class="fas fa-paper-plane" style="margin-right:10px;"></i>Publish Training Module
                            </button>
                        </div>
                    </div>
                </div>
                <div class="glass" style="padding:35px;">
                    <h3 style="margin-bottom:20px;">Posted Modules <span style="color:var(--text-secondary); font-size:0.85rem; font-weight:normal;">(${isLoading ? '...' : mods.length})</span></h3>
                    <div style="display:grid; gap:12px;">
                        ${isLoading ? `
                            <div style="text-align:center; padding:30px;">
                                <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                                <p style="color: var(--text-secondary);">Loading modules...</p>
                            </div>
                        ` : mods.length === 0 ? `
                            <div style="text-align:center; padding:30px;">
                                <i class="fas fa-inbox" style="font-size:2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                                <p style="color: var(--text-secondary);">No modules uploaded yet</p>
                                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 5px;">Upload your first module above</p>
                            </div>
                        ` : `
                            ${mods.map((m, i) => `
                                <div class="glass" style="padding:18px 22px; display:flex; align-items:center; justify-content:space-between; border:1px solid rgba(0,245,255,0.15); transition:0.2s;" onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='translateX(0)'">
                                    <div style="display:flex; align-items:center; gap:15px; flex:1; min-width:0; overflow:hidden;">
                                        <div style="width:40px; height:40px; border-radius:10px; background:rgba(239,68,68,0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                            <i class="fas fa-file-pdf" style="color:#ef4444;"></i>
                                        </div>
                                        <div style="flex:1; min-width:0; overflow:hidden;">
                                            <p style="font-weight:500; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.title}</p>
                                            <div style="display:flex; flex-wrap:wrap; gap:15px; font-size:0.8rem; color:var(--text-secondary);">
                                                <span><i class="fas fa-file" style="margin-right:4px;"></i>${m.fileName}</span>
                                                <span><i class="far fa-calendar-alt" style="margin-right:4px;"></i>${new Date(m.createdAt).toLocaleDateString()}</span>
                                                ${(m.targetStandard || m.targetSection) ? `<span style="color:var(--cyan);"><i class="fas fa-school" style="margin-right:4px;"></i>Class ${m.targetStandard || 'All'}${m.targetSection ? ' - ' + m.targetSection : ''}</span>` : '<span style="color:var(--indigo);"><i class="fas fa-globe" style="margin-right:4px;"></i>All Classes</span>'}
                                                ${m.createdBy ? `
                                                    <span style="color:var(--cyan); font-weight:500;">
                                                        <i class="fas fa-chalkboard-teacher" style="margin-right:4px;"></i>
                                                        Uploaded by: ${m.createdBy.name} ${m.createdBy.standard ? `(${m.createdBy.standard}-${m.createdBy.section})` : ''}
                                                    </span>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div style="display:flex; gap:10px; align-items:center; flex-shrink:0; margin-left:15px;">
                                        <button class="btn" style="width:auto; padding:5px 12px; font-size:0.75rem; background:rgba(0,245,255,0.1); color:var(--cyan); border:1px solid rgba(0,245,255,0.2);" onclick="App.viewModule('${m._id}')">
                                            <i class="fas fa-eye" style="margin-right:4px;"></i>View
                                        </button>
                                        <button class="btn" style="width:auto; padding:5px 12px; font-size:0.75rem; background:rgba(139,92,246,0.1); color:var(--purple); border:1px solid rgba(139,92,246,0.2);" onclick="App.editModule('${m._id}')">
                                            <i class="fas fa-edit" style="margin-right:4px;"></i>Edit
                                        </button>
                                        <i class="fas fa-trash" style="color:var(--red); cursor:pointer; opacity:0.6; transition:0.2s; font-size:0.85rem;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" onclick="App.removeModule('${m._id}')"></i>
                                    </div>
                                </div>
                            `).join('')}
                        `}
                    </div>
                </div>
            </div>`;
    },

    handleFileSelect(input) {
        const file = input.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            this.showToast('Only PDF files are accepted', 'error');
            input.value = '';
            return;
        }
        document.getElementById('selectedFileInfo').style.display = 'block';
        document.getElementById('selectedFileName').textContent = file.name;
        document.getElementById('selectedFileSize').textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        document.getElementById('moduleTitle').value = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');

        const reader = new FileReader();
        reader.onload = (e) => {
            if (!this.state) this.state = {};
            this.state.currentFileData = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    clearFileSelection() {
        document.getElementById('pdfInput').value = '';
        document.getElementById('selectedFileInfo').style.display = 'none';
        if (this.state) this.state.currentFileData = null;
    },

    async postModule() {
        const title = document.getElementById('moduleTitle')?.value.trim();
        const file = document.getElementById('pdfInput')?.files[0];
        const targetStandard = document.getElementById('moduleStandard')?.value || '';
        const targetSection = document.getElementById('moduleSection')?.value || '';

        if (!title) { this.showToast('Please enter a module title', 'error'); return; }
        if (!file) { this.showToast('Please select a PDF file', 'error'); return; }

        console.log('🚀 postModule triggered');
        console.log('Title:', title);
        console.log('File:', file.name);
        console.log('Target Standard:', targetStandard);
        console.log('Target Section:', targetSection);
        console.log('Sending fetch to http://localhost:5000/api/modules');

        try {
            const response = await fetch('http://localhost:5000/api/modules', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    title: title,
                    content: document.getElementById('moduleContent')?.value.trim() || '',
                    fileName: file.name,
                    fileData: this.state ? this.state.currentFileData : null,
                    targetStandard: targetStandard,
                    targetSection: targetSection
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast(`"${title}" posted successfully!`, 'success');
                this.clearFileSelection();
                // Reload modules from backend and re-render
                await this.loadModules();
                this.render();
            } else {
                this.showToast(data.message || 'Error posting module', 'error');
            }
        } catch (error) {
            console.error('Module upload error:', error);
            this.showToast('Network error while uploading module', 'error');
        }
    },

    async removeModule(moduleId) {
        if (!confirm('Remove this module?')) return;
        try {
            const response = await fetch(`http://localhost:5000/api/modules/${moduleId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.showToast('Module removed successfully', 'success');
                await this.loadModules();
                this.render();
            } else {
                const data = await response.json();
                this.showToast(data.message || 'Error removing module', 'error');
            }
        } catch (error) {
            console.error('Module deletion error:', error);
            this.showToast('Network error while deleting module', 'error');
        }
    },

    viewModule(moduleId) {
        const mod = (this.state.uploadedModules || []).find(m => m._id === moduleId);
        if (!mod) {
            this.showToast('Module not found', 'error');
            return;
        }

        this.showModuleViewer(moduleId);
    },

    editModule(moduleId) {
        const mod = (this.state.uploadedModules || []).find(m => m._id === moduleId);
        if (!mod) return this.showToast('Module not found', 'error');

        if (document.getElementById('editModuleModal')) return;
        const modal = document.createElement('div');
        modal.id = 'editModuleModal';
        modal.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); z-index:2500; display:flex; justify-content:center; align-items:center; padding:20px;`;

        modal.innerHTML = `
            <div class="glass" style="width:1000px; max-height:95vh; overflow-y:auto; padding:40px; position:relative; border:1px solid rgba(0,245,255,0.3); box-shadow: 0 0 50px rgba(0,245,255,0.1);">
                <button style="position:absolute; top:20px; right:20px; background:rgba(255,255,255,0.05); border:none; color:white; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;" onclick="document.getElementById('editModuleModal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                
                <input type="hidden" id="editModId" value="${mod._id}">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:20px; flex:1;">
                        <div style="width:60px; height:60px; background:linear-gradient(135deg, var(--cyan), #0077ff); border-radius:15px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; box-shadow: 0 0 20px rgba(0,245,255,0.3);">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div style="flex:1; max-width:600px;">
                            <input type="text" id="editModTitle" value="${mod.title || ''}" placeholder="Module Title" style="width:100%; background:transparent; border:none; border-bottom:1px dashed rgba(0,245,255,0.5); color:white; font-size:1.8rem; font-weight:bold; outline:none; padding:5px 0; transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--cyan)'" onblur="this.style.borderColor='rgba(0,245,255,0.5)'">
                            <p style="color:var(--cyan); font-size:0.9rem; margin-top:5px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Edit Module Learning Path</p>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-primary" style="padding:12px 25px; font-size:1rem; background:linear-gradient(135deg, var(--cyan), #0077ff); border:none; border-radius:12px; font-weight:700; box-shadow:0 10px 20px rgba(0,245,255,0.2); transition:transform 0.2s;" onclick="App.submitEditModule()" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="fas fa-save" style="margin-right:8px;"></i> Save Changes
                        </button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr; gap:30px; margin-bottom:20px;">
                    <div class="content-area">
                        <textarea id="editModContent" style="width:100%; background:rgba(255,255,255,0.03); padding:30px; border-radius:15px; border:1px dashed rgba(0,245,255,0.3); line-height:1.8; color:rgba(255,255,255,0.9); font-size:1.05rem; min-height:250px; resize:vertical; outline:none; font-family:inherit; transition:border-color 0.2s;" placeholder="Enter module content here..." onfocus="this.style.borderColor='var(--cyan)'" onblur="this.style.borderColor='rgba(0,245,255,0.3)'">${mod.content || ''}</textarea>
                    </div>
                </div>

                <div style="margin-bottom:20px; background:rgba(255,255,255,0.02); padding:20px; border-radius:15px; border:1px solid rgba(255,255,255,0.05);">
                    <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:8px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Re-upload / Update PDF Document (Optional)</label>
                    <input type="file" id="editPdfInput" accept=".pdf" style="width:100%; padding:10px; color:white; background:rgba(0,0,0,0.2); border-radius:8px; border:1px solid rgba(255,255,255,0.1);" onchange="App.handleEditFileSelect(this)">
                    <p style="font-size:0.8rem; color:var(--cyan); margin-top:8px;" id="editPdfStatus">${mod.fileData ? '<i class="fas fa-check-circle"></i> A PDF is currently attached to this module.' : '<i class="fas fa-exclamation-triangle" style="color:var(--yellow);"></i> No PDF is currently attached. Please re-upload.'}</p>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; background:rgba(255,255,255,0.02); padding:25px; border-radius:15px; border:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:8px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Target Class</label>
                        <select id="editModStandard" style="width:100%; padding:12px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; outline:none; font-size:1rem; cursor:pointer;" onfocus="this.style.borderColor='var(--cyan)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
                            <option value="">All Standards</option>
                            ${[6, 7, 8, 9, 10, 11, 12].map(s => `<option value="${s}" ${mod.targetStandard == s ? 'selected' : ''}>${s}th Standard</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:8px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Target Section</label>
                        <select id="editModSection" style="width:100%; padding:12px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; outline:none; font-size:1rem; cursor:pointer;" onfocus="this.style.borderColor='var(--cyan)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
                            <option value="">All Sections</option>
                            ${['A', 'B', 'C', 'D', 'E', 'F'].map(s => `<option value="${s}" ${mod.targetSection == s ? 'selected' : ''}>Section ${s}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    handleEditFileSelect(input) {
        const file = input.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            this.showToast('Only PDF files are accepted', 'error');
            input.value = '';
            return;
        }
        document.getElementById('editPdfStatus').innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing ${file.name}...`;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!this.state) this.state = {};
            this.state.editFileData = e.target.result;
            this.state.editFileName = file.name;
            document.getElementById('editPdfStatus').innerHTML = `<i class="fas fa-check-circle" style="color:#22c55e;"></i> Ready to save: <strong>${file.name}</strong>`;
        };
        reader.readAsDataURL(file);
    },

    async submitEditModule() {
        const moduleId = document.getElementById('editModId').value;
        const title = document.getElementById('editModTitle').value.trim();
        const content = document.getElementById('editModContent').value.trim();
        const targetStandard = document.getElementById('editModStandard').value;
        const targetSection = document.getElementById('editModSection').value;

        if (!title) return this.showToast('Module title is required', 'error');

        const payload = { title, content, targetStandard, targetSection };

        // If they uploaded a new PDF, include it in the update payload
        if (this.state && this.state.editFileData) {
            payload.fileData = this.state.editFileData;
            payload.fileName = this.state.editFileName;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/modules/${moduleId}`, {
                method: 'PATCH',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                this.showToast('Module updated successfully', 'success');
                if (this.state) {
                    this.state.editFileData = null;
                    this.state.editFileName = null;
                }
                document.getElementById('editModuleModal').remove();
                await this.loadModules();
                this.render();
            } else {
                const data = await response.json();
                this.showToast(data.message || 'Error updating module', 'error');
            }
        } catch (error) {
            console.error('Module update error:', error);
            this.showToast('Network error while updating module', 'error');
        }
    },

    // --- Manage Quizzes ---
    getManageQuizzes() {
        const quizzes = this.state.quizzes || [];
        const isLoading = this.state.isLoading;

        if (isLoading) {
            return `
                <div class="glass" style="padding: 40px; text-align: center;">
                    <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                    <p style="color: var(--text-secondary);">Loading quizzes...</p>
                </div>`;
        }

        return `
            <div class="glass" style="padding: 40px; border:1px solid rgba(139,92,246,0.18);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div style="width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(139,92,246,0.05)); display:flex; align-items:center; justify-content:center; border:1px solid rgba(139,92,246,0.3);">
                            <i class="fas fa-tasks" style="color:var(--purple); font-size:1.2rem;"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; color:white; font-size:1.3rem;">Manage Assessments</h3>
                            <p style="margin:0; color:var(--text-secondary); font-size:0.8rem; margin-top:3px;">${quizzes.length} active evaluations in the system</p>
                        </div>
                    </div>
                    <button onclick="App.showQuizModal()" 
                        style="padding:11px 24px; border-radius:12px; border:none; background:linear-gradient(135deg, #a78bfa, #7c3aed); color:white; font-size:0.9rem; font-weight:600; cursor:pointer; transition:0.2s; box-shadow: 0 4px 15px rgba(139,92,246,0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(139,92,246,0.45)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(139,92,246,0.3)';"
                    >
                        <i class="fas fa-plus-circle" style="margin-right:8px;"></i>Create New Quiz
                    </button>
                </div>
                <div style="display: grid; gap: 15px;">
                    ${quizzes.length === 0 ? `
                        <div style="text-align: center; padding: 40px;">
                            <i class="fas fa-tasks" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                            <p style="color: var(--text-secondary);">No quizzes created yet</p>
                        </div>
                    ` : quizzes.map(q => `
                        <div class="glass" style="padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(139, 92, 246, 0.1);">
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(139, 92, 246, 0.1); display: flex; align-items: center; justify-content: center; color: var(--purple);">
                                    <i class="fas fa-pen-nib" style="font-size: 1.3rem;"></i>
                                </div>
                                <div>
                                    <h4 style="margin-bottom: 5px;">${q.title}</h4>
                                    <div style="display: flex; gap: 15px; font-size: 0.8rem; color: var(--text-secondary);">
                                        <span><i class="fas fa-question-circle" style="margin-right: 5px;"></i>${q.questionsList?.length || 0} Questions</span>
                                        <span><i class="fas fa-clock" style="margin-right: 5px;"></i>${q.timeLimit} Minutes</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn" style="width: auto; padding: 8px 15px; font-size: 0.8rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);" onclick="App.showEditQuizModal('${q._id}')">
                                    Edit
                                </button>
                                <button class="btn" style="width: auto; padding: 8px 15px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.1); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.2);" onclick="App.deleteQuiz('${q._id}')">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    toggleQuizStatus(index) {
        // TODO: Implement with API call to PATCH /api/quizzes/{id}/status
        this.showToast('Quiz status update requires API integration', 'info');
    },

    async deleteQuiz(quizId) {
        if (!confirm('Delete this quiz permanently?')) return;
        try {
            await deleteQuiz(quizId);
            this.showToast('Quiz deleted successfully', 'success');
            await this.loadQuizzes();
            this.render();
        } catch (error) {
            this.showToast('Failed to delete quiz', 'error');
        }
    },

    // --- Drill Participation ---
    getDrillParticipation() {
        const data = this.state.drillParticipation || [];
        const isLoading = this.state.isLoading;

        if (isLoading) {
            return `
                <div class="glass" style="padding: 40px; text-align: center;">
                    <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                    <p style="color: var(--text-secondary);">Loading participation data...</p>
                </div>`;
        }

        if (data.length === 0) {
            return `
                <div class="glass" style="padding:40px;">
                    <h3 style="margin-bottom:25px;">Drill Participation Overview</h3>
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-vr-cardboard" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                        <p style="color: var(--text-secondary);">No drill data available yet.</p>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 5px;">Data will appear once drills are created and students register.</p>
                    </div>
                </div>`;
        }

        return `
            <div style="display: grid; gap: 25px;">
                <div class="glass" style="padding:40px;">
                    <h3 style="margin-bottom:25px;">Drill Participation Overview</h3>
                    <div style="display: grid; gap: 20px;">
                        ${data.map(item => `
                            <div class="glass" style="padding: 25px; border: 1px solid rgba(0, 245, 255, 0.1);">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                                    <div>
                                        <h4 style="font-size: 1.2rem; margin-bottom: 5px; color: white;">${item.drill.title}</h4>
                                        <div style="display: flex; gap: 15px; font-size: 0.85rem; color: var(--text-secondary);">
                                            <span><i class="fas fa-calendar-alt" style="margin-right: 5px;"></i>${new Date(item.drill.scheduledDate).toLocaleDateString()}</span>
                                            <span><i class="fas fa-biohazard" style="margin-right: 5px;"></i>${item.drill.disasterType}</span>
                                            <span style="color: var(--cyan);"><i class="fas fa-info-circle" style="margin-right: 5px;"></i>${item.drill.status}</span>
                                        </div>
                                    </div>
                                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
                                        <div style="text-align: right;">
                                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--cyan);">${item.participated}/${item.totalRegistered}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Participation</div>
                                        </div>
                                        <button
                                            id="reminder-btn-${item.drill._id}"
                                            onclick="App.sendDrillReminder('${item.drill._id}', '${item.drill.title.replace(/'/g, "\\'")}', this)"
                                            style="display: flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 10px; border: 1px solid rgba(0,245,255,0.35); background: rgba(0,245,255,0.08); color: var(--cyan); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.25s; white-space: nowrap;"
                                            onmouseover="this.style.background='rgba(0,245,255,0.18)'; this.style.borderColor='var(--cyan)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 14px rgba(0,245,255,0.2)';"
                                            onmouseout="this.style.background='rgba(0,245,255,0.08)'; this.style.borderColor='rgba(0,245,255,0.35)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"
                                        >
                                            <i class="fas fa-bell"></i> Send Reminder
                                        </button>
                                    </div>
                                </div>
                                
                                <div style="margin-bottom: 15px;">
                                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${item.totalRegistered > 0 ? (item.participated / item.totalRegistered) * 100 : 0}%; height: 100%; background: linear-gradient(90deg, var(--cyan), var(--indigo));"></div>
                                    </div>
                                </div>

                                <details style="cursor: pointer;">
                                    <summary style="color: var(--cyan); font-size: 0.9rem; font-weight: 600; outline: none; margin-bottom: 10px;">
                                        View Registered Students (${item.students.length})
                                    </summary>
                                    <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                                            <thead>
                                                <tr style="color: var(--text-secondary); border-bottom: 1px solid rgba(255,255,255,0.05);">
                                                    <th style="padding: 8px 0;">STUDENT</th>
                                                    <th style="padding: 8px 0;">EMAIL</th>
                                                    <th style="padding: 8px 0;">STATUS</th>
                                                    <th style="padding: 8px 0;">SCORE</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${item.students.map(s => `
                                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
                                                        <td style="padding: 10px 0; color: white;">${s.name}</td>
                                                        <td style="padding: 10px 0; color: var(--text-secondary);">${s.email}</td>
                                                         <td style="padding: 10px 0;">
                                                            ${(() => {
                const scheduledDate = item.drill ? new Date(item.drill.scheduledDate) : new Date();
                const isPast = scheduledDate < new Date();
                const status = s.participated ? 'Participated' : (isPast ? 'Missed' : '-');
                const bgColor = s.participated ? 'rgba(16, 185, 129, 0.1)' : (isPast ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)');
                const color = s.participated ? 'var(--green)' : (isPast ? 'var(--red)' : 'var(--text-secondary)');
                const borderColor = s.participated ? 'rgba(16, 185, 129, 0.2)' : (isPast ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)');
                return `<span style="padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; background: ${bgColor}; color: ${color}; border: 1px solid ${borderColor};">${status}</span>`;
            })()}
                                                        </td>
                                                        <td style="padding: 10px 0; color: ${s.participated ? 'var(--cyan)' : 'var(--text-secondary)'}; font-weight: 600;">
                                                            ${s.participated ? s.score + '%' : '-'}
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
    },

    async sendDrillReminder(drillId, drillTitle, btn) {
        if (!drillId) { this.showToast('Invalid drill ID', 'error'); return; }

        // Update button to loading state
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.style.opacity = '0.7';
        }

        try {
            const token = localStorage.getItem('crisis_craft_token');
            const response = await fetch(`http://localhost:5000/api/drills/${drillId}/remind`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast(
                    `✅ Reminder sent to ${data.count || 'all'} student(s) for "${drillTitle}"`,
                    'success'
                );
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
                    btn.style.background = 'rgba(34,197,94,0.15)';
                    btn.style.borderColor = 'rgba(34,197,94,0.4)';
                    btn.style.color = '#22c55e';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-bell"></i> Send Reminder';
                        btn.style.background = 'rgba(0,245,255,0.08)';
                        btn.style.borderColor = 'rgba(0,245,255,0.35)';
                        btn.style.color = 'var(--cyan)';
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    }, 3000);
                }
            } else {
                this.showToast(data.message || 'Failed to send reminder', 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-bell"></i> Send Reminder';
                    btn.style.opacity = '1';
                }
            }
        } catch (error) {
            console.error('Reminder error:', error);
            this.showToast('Network error sending reminder', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-bell"></i> Send Reminder';
                btn.style.opacity = '1';
            }
        }
    },

    getTeacherOverview() {
        const stats = this.state.teacherStats || { studentsCount: 0, modulesCount: 0, quizzesCount: 0, avgScore: 0 };
        const modules = this.state.uploadedModules || [];
        const isLoading = this.state.isLoading;

        if (isLoading) {
            return `
                <div class="glass" style="padding: 40px; text-align: center;">
                    <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                    <p style="color: var(--text-secondary);">Loading dashboard...</p>
                </div>`;
        }

        return `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                ${this.renderStatCard("Total Students", stats.studentsCount, "fa-users", "var(--cyan)")}
                ${this.renderStatCard("Modules Uploaded", stats.modulesCount, "fa-book", "var(--indigo)")}
                ${this.renderStatCard("Active Quizzes", stats.quizzesCount, "fa-pen-nib", "var(--purple)")}
                ${this.renderStatCard("Average Score", stats.avgScore + "%", "fa-graduation-cap", "var(--cyan)")}
            </div>
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px;">
                <div class="glass" style="padding: 30px;">
                    <h3 style="margin-bottom:20px;">Module Engagement</h3>
                    ${modules.length === 0 ? `<p style="color:var(--text-secondary); text-align:center; padding:20px;">No modules uploaded yet.</p>` : modules.map(mod => `
                        <div style="margin-bottom:15px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span>${mod.title}</span>
                                <span style="color:var(--cyan);">${mod.completion || 0}% Completion</span>
                            </div>
                            <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
                                <div style="width:${mod.completion || 0}%; height:100%; background:var(--cyan);"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="glass" style="padding: 30px;">
                    <h3 style="margin-bottom: 20px;">Recent Activity</h3>
                    <div style="display: grid; gap: 10px;">
                        <p style="color:var(--text-secondary); text-align:center; padding:10px;">No recent activity</p>
                    </div>
                </div>
            </div>
        `;
    },

    getStudentPerformanceTable() {
        // Data would normally be fetched from an API
        const students = this.state.studentPerformanceStats || [];

        if (students.length === 0) {
            return `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-user-graduate" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--text-secondary);">No student performance data available</p>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 5px;">Data will appear once students complete modules and quizzes</p>
                </div>
            `;
        }

        return `
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size:0.9rem;">
                <thead>
                    <tr style="color: var(--text-secondary); border-bottom: 1px solid var(--glass-border);">
                        <th style="padding: 10px 0;">NAME</th>
                        <th style="padding: 10px 0;">MODULE AVG</th>
                        <th style="padding: 10px 0;">QUIZ SCORE</th>
                        <th style="padding: 10px 0;">DRILL READY</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr style="border-bottom: 1px solid var(--glass-border);">
                            <td style="padding: 12px 0; color: white;">${student.name}</td>
                            <td style="padding: 12px 0; color: var(--cyan);">${student.moduleAvg}%</td>
                            <td style="padding: 12px 0; color: var(--purple);">${student.quizScore}</td>
                            <td style="padding: 12px 0;">
                                <span style="color: ${student.drillReady === 'Yes' ? 'var(--green)' : 'var(--red)'}; font-weight: 600;">
                                    ${student.drillReady}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    async deleteQuiz(quizId) {
        if (!confirm('Delete this quiz permanently?')) return;
        try {
            await deleteQuiz(quizId);
            this.showToast('Quiz deleted successfully', 'success');
            this.loadQuizzes().then(() => this.render());
        } catch (error) {
            this.showToast('Failed to delete quiz', 'error');
        }
    },

    async showEditQuizModal(quizId) {
        try {
            const quiz = await getQuiz(quizId);
            this.showQuizModal(quiz);
        } catch (error) {
            this.showToast('Failed to load quiz details', 'error');
        }
    },

    showCreateQuizModal() {
        this.showQuizModal();
    },

    showQuizModal(quiz = null) {
        if (document.getElementById('quizModal')) return;
        const isEdit = !!quiz;
        const modal = document.createElement('div');
        modal.id = 'quizModal';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(5,10,30,0.75); backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px;
        `;

        const inputStyle = `width:100%; padding:12px 14px 12px 38px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; transition:0.2s;`;
        const labelStyle = `color:rgba(255,255,255,0.6); font-size:0.8rem; font-weight:600; letter-spacing:0.5px; display:block; margin-bottom:8px; text-transform:uppercase;`;
        const focusPurple = `onfocus="this.style.borderColor='rgba(139,92,246,0.45)'; this.style.background='rgba(139,92,246,0.05)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.05)';" `;

        modal.innerHTML = `
            <div style="
                padding: 35px 40px;
                width: 850px;
                border-radius: 24px;
                border: 1px solid rgba(139,92,246,0.25);
                background: linear-gradient(135deg, rgba(18,12,45,0.98) 0%, rgba(25,20,55,0.98) 50%, rgba(15,10,40,0.98) 100%);
                box-shadow: 0 30px 60px -12px rgba(0,0,0,0.8), 0 0 40px rgba(139,92,246,0.08);
                position: relative; overflow: hidden; max-height: 90vh; overflow-y: auto;
            ">
                <div style="position:absolute; top:-50px; right:-50px; width:200px; height:200px; background:radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); pointer-events:none;"></div>
                <div style="position:absolute; bottom:-40px; left:-40px; width:150px; height:150px; background:radial-gradient(circle, rgba(0,245,255,0.1), transparent 70%); pointer-events:none;"></div>

                <!-- Header -->
                <div style="display:flex; align-items:center; gap:16px; margin-bottom:28px;">
                    <div style="width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(139,92,246,0.05)); display:flex; align-items:center; justify-content:center; border:1px solid rgba(139,92,246,0.3);">
                        <i class="fas fa-tasks" style="color:var(--purple); font-size:1.2rem;"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; color:white; font-size:1.3rem;">${isEdit ? 'Edit Assessment' : 'Create New Assessment'}</h3>
                        <p style="margin:0; color:var(--text-secondary); font-size:0.8rem; margin-top:3px;">Design knowledge evaluation for your students</p>
                    </div>
                </div>

                <input type="hidden" id="quizId" value="${isEdit ? quiz._id : ''}">
                
                <!-- Quiz Title -->
                <div style="margin-bottom:20px;">
                    <label style="${labelStyle}">Assessment Title</label>
                    <div style="position:relative;">
                        <i class="fas fa-heading" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(139,92,246,0.5); font-size:0.9rem;"></i>
                        <input type="text" id="quizTitle" placeholder="e.g. Earthquake Safety Basics" style="${inputStyle}" value="${isEdit ? quiz.title : ''}" ${focusPurple}>
                    </div>
                </div>

                <!-- Config side by side -->
                <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                    <div style="flex: 1;">
                        <label style="${labelStyle}">Time Limit (Minutes)</label>
                        <div style="position:relative;">
                            <i class="fas fa-clock" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(139,92,246,0.5); font-size:0.9rem;"></i>
                            <input type="number" id="quizTime" style="${inputStyle}" value="${isEdit ? quiz.timeLimit : '15'}" ${focusPurple}>
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <label style="${labelStyle}">Total Marks</label>
                        <div style="position:relative;">
                            <i class="fas fa-star" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(139,92,246,0.5); font-size:0.9rem;"></i>
                            <input type="number" id="quizMarks" style="${inputStyle}" value="${isEdit ? quiz.totalMarks : '100'}" ${focusPurple}>
                        </div>
                    </div>
                </div>

                <!-- Questions Section -->
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 15px;">
                    <div>
                        <h4 style="color: white; margin: 0; font-size: 1.1rem;">Assessment Questions</h4>
                        <p style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 4px;">Click the button to add more questions</p>
                    </div>
                    <button class="btn btn-primary" style="width: auto; padding: 8px 18px; font-size: 0.85rem; background: linear-gradient(135deg, #a78bfa, #8b5cf6);" onclick="App.addQuestionEntry()">
                        <i class="fas fa-plus" style="margin-right: 8px;"></i>Add Question
                    </button>
                </div>

                <div id="questionsContainer" style="display: grid; gap: 20px; margin-bottom: 35px;">
                    ${isEdit ? this.renderQuestionEditor(quiz.questionsList) : ''}
                </div>

                <!-- Footer Buttons -->
                <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);">
                    <button onclick="App.closeQuizModal()"
                        style="padding:11px 24px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.8); font-size:0.9rem; cursor:pointer; transition:0.2s;"
                        onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'"
                    >Cancel</button>
                    <button onclick="${isEdit ? 'App.submitEditQuiz()' : 'App.submitCreateQuiz()'}"
                        style="padding:11px 32px; border-radius:12px; border:none; background:linear-gradient(135deg, #a78bfa, #7c3aed); color:white; font-size:0.9rem; font-weight:600; cursor:pointer; transition:0.2s; box-shadow: 0 4px 15px rgba(139,92,246,0.3);"
                        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(139,92,246,0.45)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(139,92,246,0.3)';"
                    >
                        <i class="fas ${isEdit ? 'fa-save' : 'fa-check'}" style="margin-right:8px;"></i>
                        ${isEdit ? 'Save Changes' : 'Publish Quiz'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (!isEdit) this.addQuestionEntry();
    },

    renderQuestionEditor(questions) {
        const inputStyle = `width:100%; padding:10px 14px 10px 38px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:white; font-size:0.88rem; outline:none; box-sizing:border-box; transition:0.2s;`;
        const focusPurple = `onfocus="this.style.borderColor='rgba(139,92,246,0.35)'; this.style.background='rgba(139,92,246,0.04)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.04)';" `;

        return questions.map((q, i) => `
            <div class="question-entry" style="background: rgba(255,255,255,0.02); padding: 25px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); position:relative;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 18px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="width:24px; height:24px; border-radius:6px; background:rgba(139,92,246,0.15); display:flex; align-items:center; justify-content:center; color:var(--purple); font-size:0.75rem; font-weight:800; border:1px solid rgba(139,92,246,0.2);">${i + 1}</span>
                        <span style="color: white; font-weight: 700; font-size: 0.95rem;">Question Text</span>
                    </div>
                    <button style="background:rgba(239,68,68,0.1); border:none; color:var(--red); padding:6px 10px; border-radius:8px; cursor:pointer; font-size:0.8rem; transition:0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'" onclick="this.closest('.question-entry').remove()">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div style="position:relative; margin-bottom: 20px;">
                    <i class="fas fa-question-circle" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(139,92,246,0.4); font-size:0.9rem;"></i>
                    <input type="text" class="q-text" style="${inputStyle}" placeholder="Enter the question for the students..." value="${q.text}" ${focusPurple}>
                </div>
                
                <p style="color: rgba(255,255,255,0.5); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Options (Select the correct one)</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    ${[0, 1, 2, 3].map(optIdx => `
                        <div style="display:flex; gap: 10px; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                            <input type="radio" name="correct_${i}" ${q.correct === optIdx ? 'checked' : ''} class="q-correct" value="${optIdx}" style="accent-color:var(--purple); width:16px; height:16px;">
                            <input type="text" class="q-opt" style="width:100%; background:transparent; border:none; color:white; font-size:0.85rem; outline:none;" placeholder="Option ${optIdx + 1}" value="${q.options[optIdx] || ''}">
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    addQuestionEntry() {
        const container = document.getElementById('questionsContainer');
        const index = container.children.length;
        const div = document.createElement('div');
        div.className = 'question-entry';
        div.style.cssText = 'background: rgba(255,255,255,0.02); padding: 25px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); position:relative; animation: slideDown 0.3s ease;';

        const inputStyle = `width:100%; padding:10px 14px 10px 38px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:white; font-size:0.88rem; outline:none; box-sizing:border-box; transition:0.2s;`;
        const focusPurple = `onfocus="this.style.borderColor='rgba(139,92,246,0.35)'; this.style.background='rgba(139,92,246,0.04)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.04)';" `;

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 18px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="width:24px; height:24px; border-radius:6px; background:rgba(139,92,246,0.15); display:flex; align-items:center; justify-content:center; color:var(--purple); font-size:0.75rem; font-weight:800; border:1px solid rgba(139,92,246,0.2);">${index + 1}</span>
                    <span style="color: white; font-weight: 700; font-size: 0.95rem;">Question Text</span>
                </div>
                <button style="background:rgba(239,68,68,0.1); border:none; color:var(--red); padding:6px 10px; border-radius:8px; cursor:pointer; font-size:0.8rem; transition:0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'" onclick="this.closest('.question-entry').remove()">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div style="position:relative; margin-bottom: 20px;">
                <i class="fas fa-question-circle" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(139,92,246,0.4); font-size:0.9rem;"></i>
                <input type="text" class="q-text" style="${inputStyle}" placeholder="Enter the question for the students..." value="" ${focusPurple}>
            </div>
            
            <p style="color: rgba(255,255,255,0.5); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Options (Select the correct one)</p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                ${[0, 1, 2, 3].map(optIdx => `
                    <div style="display:flex; gap: 10px; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                        <input type="radio" name="correct_${index}" ${optIdx === 0 ? 'checked' : ''} class="q-correct" value="${optIdx}" style="accent-color:var(--purple); width:16px; height:16px;">
                        <input type="text" class="q-opt" style="width:100%; background:transparent; border:none; color:white; font-size:0.85rem; outline:none;" placeholder="Option ${optIdx + 1}" value="">
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(div);
    },

    scrapeQuestions() {
        const entries = document.querySelectorAll('.question-entry');
        const questions = [];
        entries.forEach((entry, idx) => {
            const text = entry.querySelector('.q-text').value.trim();
            const opts = Array.from(entry.querySelectorAll('.q-opt')).map(i => i.value.trim());
            const correct = parseInt(entry.querySelector('input[type="radio"]:checked')?.value || 0);
            if (text) {
                questions.push({ text, options: opts, correct });
            }
        });
        return questions;
    },

    async submitEditQuiz() {
        const quizId = document.getElementById('quizId').value;
        const title = document.getElementById('quizTitle').value.trim();
        const questionsList = this.scrapeQuestions();
        const timeLimit = parseInt(document.getElementById('quizTime').value);
        const totalMarks = parseInt(document.getElementById('quizMarks').value);

        if (!title) return this.showToast('Please enter a title', 'error');
        if (questionsList.length === 0) return this.showToast('Add at least one question', 'error');

        try {
            await updateQuiz(quizId, { title, questionsList, timeLimit, totalMarks });
            this.showToast('Quiz updated successfully', 'success');
            this.closeQuizModal();
            this.loadQuizzes().then(() => this.render());
        } catch (error) {
            this.showToast('Failed to update quiz', 'error');
        }
    },

    async submitCreateQuiz() {
        const title = document.getElementById('quizTitle').value.trim();
        const questionsList = this.scrapeQuestions();
        const timeLimit = parseInt(document.getElementById('quizTime').value);
        const totalMarks = parseInt(document.getElementById('quizMarks').value);

        if (!title) return this.showToast('Please enter a title', 'error');
        if (questionsList.length === 0) return this.showToast('Add at least one question', 'error');

        try {
            await createQuiz({ title, questionsList, timeLimit, totalMarks });
            this.showToast('Quiz created successfully', 'success');
            this.closeQuizModal();
            this.loadQuizzes().then(() => this.render());
        } catch (error) {
            this.showToast('Failed to create quiz', 'error');
        }
    },

    closeQuizModal() {
        const m = document.getElementById('quizModal');
        if (m) m.remove();
    },

    viewDrillDetails(drillId) {
        const drill = this.state.drills.find(d => d._id === drillId);
        if (!drill) return;

        const modal = document.createElement('div');
        modal.id = 'drillDetailsModal';
        modal.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(15px); z-index:2500; display:flex; justify-content:center; align-items:center; padding:20px;`;

        modal.innerHTML = `
            <div class="glass" style="width:500px; padding:40px; position:relative; border:1px solid var(--cyan);">
                <button style="position:absolute; top:20px; right:20px; background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;" onclick="document.getElementById('drillDetailsModal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <h3 style="margin-bottom:20px; color:var(--cyan);">${drill.title}</h3>
                <div style="display:grid; gap:15px; margin-bottom:30px;">
                    <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px;">
                        <span style="color:var(--text-secondary);">Type</span>
                        <span style="font-weight:600;">${drill.disasterType}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px;">
                        <span style="color:var(--text-secondary);">Date</span>
                        <span style="font-weight:600;">${new Date(drill.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px;">
                        <span style="color:var(--text-secondary);">Time</span>
                        <span style="font-weight:600;">${new Date(drill.scheduledDate).toLocaleTimeString()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px;">
                        <span style="color:var(--text-secondary);">Status</span>
                        <span style="color:var(--cyan); font-weight:600;">${drill.status}</span>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="document.getElementById('drillDetailsModal').remove()">Close Details</button>
            </div>`;
        document.body.appendChild(modal);
    },


    // Render drill reminder notification banners for students
    renderDrillReminders() {
        const reminders = (this.state.drillReminders || []).filter(r => !r.isRead);
        if (reminders.length === 0) return '';

        return `
        <div id="drill-reminders-panel" style="margin-bottom: 25px; display: grid; gap: 12px;">
            ${reminders.map(r => `
                <div id="reminder-${r._id}" style="
                    display: flex; align-items: flex-start; justify-content: space-between; gap: 15px;
                    padding: 16px 22px;
                    background: linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(139,92,246,0.12) 100%);
                    border: 1px solid rgba(139,92,246,0.35);
                    border-left: 4px solid var(--indigo);
                    border-radius: 14px;
                    box-shadow: 0 4px 20px rgba(79,70,229,0.15);
                    animation: slideDown 0.4s ease-out;
                ">
                    <div style="display: flex; align-items: flex-start; gap: 14px; flex: 1;">
                        <div style="
                            width: 42px; height: 42px; flex-shrink: 0;
                            background: rgba(139,92,246,0.2); border-radius: 11px;
                            display: flex; align-items: center; justify-content: center;
                            border: 1px solid rgba(139,92,246,0.35);
                            animation: pulse 2s infinite;
                        ">
                            <i class="fas fa-bell" style="color: #a78bfa; font-size: 1rem;"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap;">
                                <span style="
                                    font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;
                                    padding: 3px 10px; border-radius: 20px;
                                    background: rgba(139,92,246,0.25); color: #a78bfa;
                                    border: 1px solid rgba(139,92,246,0.35);
                                ">📣 Drill Reminder</span>
                                <span style="font-size: 0.72rem; color: var(--text-secondary);">
                                    <i class="far fa-clock" style="margin-right: 4px;"></i>
                                    ${new Date(r.sentAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                                </span>
                                ${r.sentBy ? `<span style="font-size: 0.72rem; color: var(--text-secondary);"><i class="fas fa-chalkboard-teacher" style="margin-right:4px;"></i>from ${r.sentBy.name}</span>` : ''}
                            </div>
                            <p style="color: white; font-size: 0.9rem; font-weight: 500; line-height: 1.6; margin: 0 0 8px;">${r.message}</p>
                            ${r.drill ? `
                            <div style="display: flex; gap: 14px; flex-wrap: wrap; padding: 8px 12px; background: rgba(0,0,0,0.15); border-radius: 8px; margin-top: 6px;">
                                <span style="font-size: 0.78rem; color: #a78bfa; font-weight: 600;">
                                    <i class="fas fa-vr-cardboard" style="margin-right: 5px;"></i>${r.drill.title}
                                </span>
                                <span style="font-size: 0.78rem; color: var(--text-secondary);">
                                    <i class="fas fa-calendar-alt" style="margin-right: 5px;"></i>${new Date(r.drill.scheduledDate).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'long' })}
                                </span>
                                <span style="font-size: 0.78rem; color: ${r.drill.status === 'Active' ? '#22c55e' : 'var(--cyan)'}; font-weight:600;">
                                    ● ${r.drill.status}
                                </span>
                            </div>` : ''}
                        </div>
                    </div>
                    <button
                        onclick="App.dismissDrillReminder('${r._id}')"
                        title="Dismiss reminder"
                        style="
                            flex-shrink: 0; width: 28px; height: 28px;
                            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
                            border-radius: 8px; color: var(--text-secondary); cursor: pointer;
                            display: flex; align-items: center; justify-content: center;
                            transition: 0.2s; font-size: 0.8rem;
                        "
                        onmouseover="this.style.background='rgba(239,68,68,0.15)'; this.style.borderColor='rgba(239,68,68,0.3)'; this.style.color='var(--red)';"
                        onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='rgba(255,255,255,0.1)'; this.style.color='var(--text-secondary)';"
                    ><i class="fas fa-times"></i></button>
                </div>
            `).join('')}
        </div>`;
    },

    async dismissDrillReminder(reminderId) {
        // Animate card out
        const card = document.getElementById(`reminder-${reminderId}`);
        if (card) {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateX(20px)';
            card.style.maxHeight = card.offsetHeight + 'px';
            setTimeout(() => {
                card.style.maxHeight = '0';
                card.style.padding = '0';
                card.style.margin = '0';
                setTimeout(() => card.remove(), 200);
            }, 300);
        }
        // Mark as read in local state
        if (this.state.drillReminders) {
            const rem = this.state.drillReminders.find(x => x._id === reminderId);
            if (rem) rem.isRead = true;
        }
        // Persist read status to backend
        try { await markDrillReminderRead(reminderId); } catch(e) { /* silent fail */ }
    },

    // --- STUDENT VIEWS ---

    renderStudentViews(section) {
        if (section === 'Dashboard') return this.renderDrillReminders() + this.getStudentOverview();

        if (section === 'Learning Modules') {
            const modules = this.state.uploadedModules || [];
            const isLoading = this.state.isLoadingModules;

            // Loading state
            if (isLoading) {
                return `
                    <div class="glass" style="padding: 40px; text-align: center;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                            <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <p style="color: var(--text-secondary);">Loading modules...</p>
                        </div>
                    </div>`;
            }

            // Empty state
            if (modules.length === 0) {
                return `
                    <div class="glass" style="padding: 40px; text-align: center;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                            <i class="fas fa-book-open" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.5;"></i>
                            <div>
                                <h3 style="margin-bottom: 8px;">No Modules Available</h3>
                                <p style="color: var(--text-secondary);">Teachers haven't uploaded any modules yet. Check back soon!</p>
                            </div>
                        </div>
                    </div>`;
            }

            // Modules grid
            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <div>
                            <h3 style="margin-bottom:5px;">Learning Modules</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem;">Enhance your preparedness with these interactive modules</p>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">
                        ${modules.map((m, i) => {
                const progressRecord = (this.state.studentStats?.progress || []).find(p => p.module?._id === m._id || p.module === m._id);
                const isCompleted = progressRecord?.status === 'Completed';
                const percent = progressRecord?.percentComplete || 0;

                return `
                                <div class="glass glass-card" style="padding:25px; border:1px solid ${isCompleted ? 'rgba(34,197,94,0.3)' : 'rgba(0,245,255,0.15)'}; position:relative;">
                                    ${isCompleted ? `<div style="position:absolute; top:10px; right:10px; color:#22c55e;"><i class="fas fa-check-circle"></i></div>` : ''}
                                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:15px;">
                                        <div style="width:45px; height:45px; border-radius:12px; background:${isCompleted ? 'rgba(34,197,94,0.1)' : 'rgba(0,245,255,0.1)'}; display:flex; align-items:center; justify-content:center;">
                                            <i class="fas fa-book-open" style="color:${isCompleted ? '#22c55e' : 'var(--cyan)'}; font-size:1.2rem;"></i>
                                        </div>
                                        <span style="font-size:0.75rem; font-weight:600; color:var(--text-secondary);">${m.fileName ? m.fileName.substring(0, 15) + '...' : 'Module'}</span>
                                    </div>
                                    <h4 style="margin-bottom:12px; line-height:1.4; display:flex; align-items:center; gap:8px;">
                                        ${m.title}
                                        ${m.fileData ? `<span title="PDF Attached" style="background:rgba(0,245,255,0.1); color:var(--cyan); font-size:0.6rem; padding:2px 6px; border-radius:4px; border:1px solid rgba(0,245,255,0.2);"><i class="fas fa-file-pdf"></i> PDF</span>` : ''}
                                    </h4>
                                    <p style="font-size:0.8rem; color: var(--text-secondary); margin-bottom: 15px;">
                                        <i class="fas fa-user" style="margin-right: 5px;"></i>
                                        By: ${m.createdBy?.name || 'Teacher'}
                                    </p>
                                    
                                    <div style="margin-bottom:15px; background:rgba(255,255,255,0.03); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                            <div style="display:flex; align-items:center; gap:6px;">
                                                <i class="fas ${isCompleted ? 'fa-check-double' : 'fa-spinner fa-spin'}" style="color:${isCompleted ? '#22c55e' : 'var(--cyan)'}; font-size:0.7rem;"></i>
                                                <span style="color:var(--text-secondary); font-size:0.7rem; font-weight:600; text-transform:uppercase;">${isCompleted ? 'Completed' : 'In Progress'}</span>
                                            </div>
                                            <span style="color:white; font-size:0.85rem; font-weight:800;">${percent}%</span>
                                        </div>
                                        <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden; position:relative;">
                                            <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, ${isCompleted ? '#22c55e, #10b981' : 'var(--cyan), #0077ff'}); transition:1s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px ${isCompleted ? '#22c55e' : 'var(--cyan)'};"></div>
                                        </div>
                                    </div>

                                    <button class="btn ${isCompleted ? '' : 'btn-primary'}" 
                                            style="width:100%; padding:10px; font-size:0.85rem; ${isCompleted ? 'background:rgba(34,197,94,0.1); color:#22c55e; border:1px solid rgba(34,197,94,0.2);' : ''}" 
                                            onclick="App.startModule('${m._id}')">
                                        ${isCompleted ? '<i class="fas fa-redo-alt" style="margin-right:8px;"></i>Review' : '<i class="fas fa-play" style="margin-right:8px;"></i>Start'}
                                    </button>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>`;
        }

        if (section === 'Virtual Drills') {
            const drills = this.state.drills || [];
            const isLoading = this.state.isLoading;

            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <div>
                            <h3 style="margin-bottom:5px;">Virtual Drills</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem;">Participate in scheduled simulations to earn preparedness points</p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                        ${isLoading ? `
                            <div style="text-align:center; padding:30px; grid-column: 1/-1;">
                                <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                                <p style="color: var(--text-secondary);">Loading drills...</p>
                            </div>
                        ` : drills.length === 0 ? `
                            <div style="text-align:center; padding:30px; grid-column: 1/-1;">
                                <i class="fas fa-vr-cardboard" style="font-size:2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                                <p style="color: var(--text-secondary);">No drills scheduled at the moment</p>
                            </div>
                        ` : drills.map((d, i) => `
                            <div class="glass glass-card" style="padding: 25px; border-left: 4px solid var(--indigo);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                    <div style="width: 45px; height: 45px; border-radius: 12px; background: rgba(79, 70, 229, 0.1); display: flex; align-items: center; justify-content: center; color: var(--indigo);">
                                        <i class="fas fa-vr-cardboard"></i>
                                    </div>
                                    <div style="background: rgba(79, 70, 229, 0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; color: var(--indigo); font-weight: bold;">
                                        ${d.disasterType}
                                    </div>
                                </div>
                                <h4 style="margin-bottom: 15px;">${d.title}</h4>
                                <div style="display: flex; gap: 15px; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px;">
                                    <span><i class="fas fa-calendar" style="margin-right: 5px;"></i>${new Date(d.scheduledDate).toLocaleDateString()}</span>
                                    <span><i class="fas fa-clock" style="margin-right: 5px;"></i>${new Date(d.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                ${d.userStatus?.registered ? `
                                    <button class="btn" style="width: 100%; background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); cursor: default;">
                                        <i class="fas fa-check-circle" style="margin-right: 8px;"></i>Registered
                                    </button>
                                ` : `
                                    <button class="btn btn-primary" style="width: 100%; background: linear-gradient(135deg, var(--indigo), var(--purple)); border: none;" onclick="App.registerForDrill('${d._id}')">
                                        Register Now
                                    </button>
                                `}
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }

        if (section === 'Quizzes') {
            const quizzes = this.state.quizzes || [];
            const isLoading = this.state.isLoading;

            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <div>
                            <h3 style="margin-bottom:5px;">Knowledge Assessments</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem;">Test your knowledge and earn readiness points</p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                        ${isLoading ? `
                            <div style="text-align:center; padding:30px; grid-column: 1/-1;">
                                <div style="width: 50px; height: 50px; border: 4px solid rgba(0, 245, 255, 0.2); border-top: 4px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                                <p style="color: var(--text-secondary);">Loading quizzes...</p>
                            </div>
                        ` : quizzes.length === 0 ? `
                            <div style="text-align:center; padding:30px; grid-column: 1/-1;">
                                <i class="fas fa-tasks" style="font-size:2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                                <p style="color: var(--text-secondary);">No quizzes available at the moment</p>
                            </div>
                        ` : quizzes.map((q, i) => {
                const results = this.state.quizResults || [];
                // quizId is populated on backend, so we check ._id
                const result = results.find(r => (r.quizId?._id || r.quizId) === q._id);
                const isDone = !!result;
                return `
                                <div class="glass glass-card" style="padding: 25px; border-left: 4px solid ${isDone ? 'var(--cyan)' : 'var(--purple)'};">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                        <div style="width: 45px; height: 45px; border-radius: 12px; background: ${isDone ? 'rgba(0, 245, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)'}; display: flex; align-items: center; justify-content: center; color: ${isDone ? 'var(--cyan)' : 'var(--purple)'};">
                                            <i class="fas ${isDone ? 'fa-check-double' : 'fa-pen-nib'}"></i>
                                        </div>
                                        <div style="background: rgba(139, 92, 246, 0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; color: var(--purple); font-weight: bold;">
                                            ${q.timeLimit} MIN
                                        </div>
                                    </div>
                                    <h4 style="margin-bottom: 15px;">${q.title}</h4>
                                    <div style="display: flex; gap: 15px; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px;">
                                        <span><i class="fas fa-question-circle" style="margin-right: 5px;"></i>${q.questionsList.length} Qs</span>
                                        <span><i class="fas fa-star" style="margin-right: 5px;"></i>${q.totalMarks} Pts</span>
                                    </div>
                                    <button class="btn btn-primary" 
                                            style="width: 100%; background: ${isDone ? 'rgba(0, 245, 255, 0.1)' : 'linear-gradient(135deg, var(--purple), var(--indigo))'}; border: ${isDone ? '1px solid var(--cyan)' : 'none'}; color: ${isDone ? 'var(--cyan)' : 'white'}; font-weight: ${isDone ? 'bold' : 'normal'};" 
                                            onclick="${isDone ? `App.showReviewQuizModal('${q._id}')` : `App.showTakeQuizModal('${q._id}')`}"
                                    >
                                        ${isDone ? `Review Result (${result.score}/${result.totalMarks})` : 'Start Assessment'}
                                    </button>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>`;
        }

        if (section === 'Achievements') {
            const achievements = this.state.achievements || [];
            const isLoading = this.state.isLoading;

            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                        <div>
                            <h3 style="margin-bottom:5px;">Achievements & Badges</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem;">Recognizing your commitment to disaster preparedness</p>
                        </div>
                        <div style="display: flex; gap: 15px; align-items: center;">
                            <div style="background: rgba(0,245,255,0.1); padding: 8px 18px; border-radius: 10px; border: 1px solid rgba(0,245,255,0.3); color: var(--cyan); font-weight: bold; font-size: 0.9rem;">
                                ${achievements.filter(a => a.unlocked).length} / ${achievements.length} UNLOCKED
                            </div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                        ${isLoading ? `<div style="grid-column: 1/-1; text-align:center;">Loading badges...</div>` : achievements.length === 0 ? `
                            <div style="grid-column: 1/-1; text-align:center; padding:40px;">
                                <i class="fas fa-award" style="font-size:3rem; color:var(--text-secondary); opacity:0.3; margin-bottom:15px; display:block;"></i>
                                <p style="color:var(--text-secondary);">Complete quizzes and drills to earn your first badge!</p>
                            </div>
                        ` : achievements.map(a => `
                            <div class="glass" style="padding: 25px; text-align: center; border: 1px solid ${a.unlocked ? 'rgba(0,245,255,0.2)' : 'rgba(255,255,255,0.05)'}; background: ${a.unlocked ? 'linear-gradient(135deg, rgba(0,245,255,0.05), transparent)' : 'rgba(255,255,255,0.02)'}; border-radius: 20px; ${!a.unlocked ? 'filter: grayscale(0.8); opacity: 0.6;' : ''} transition: 0.3s;">
                                <div style="width: 80px; height: 80px; background: ${a.unlocked ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.05)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 15px; border: 2px solid ${a.unlocked ? 'var(--cyan)' : 'rgba(255,255,255,0.2)'}; box-shadow: ${a.unlocked ? '0 0 15px rgba(0,245,255,0.1)' : 'none'};">
                                    <i class="fas ${a.badgeIcon || 'fa-medal'}" style="color: ${a.unlocked ? 'var(--cyan)' : 'var(--text-secondary)'};"></i>
                                </div>
                                <h4 style="margin-bottom: 8px; color: ${a.unlocked ? 'white' : 'var(--text-secondary)'};">${a.name || 'Achievement'}</h4>
                                <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; min-height: 32px;">${a.description}</p>
                                <p style="font-size: 0.7rem; color: ${a.unlocked ? 'var(--cyan)' : 'var(--text-secondary)'}; margin-top: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                    ${a.unlocked ? `Earned ${new Date(a.unlockedAt).toLocaleDateString()}` : '<i class="fas fa-lock" style="margin-right: 5px;"></i> LOCKED'}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }

        if (section === 'Leaderboard') {
            const leaderboard = this.state.leaderboard || [];
            const isLoading = this.state.isLoading;

            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <div>
                            <h3 style="margin-bottom: 5px;">Global Leaderboard</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem;">Top performers in CrisisCraft preparedness</p>
                        </div>
                    </div>
                    <div style="display: grid; gap: 12px;">
                        ${isLoading ? `<div style="text-align:center; padding:20px;">Loading leaderboard...</div>` : leaderboard.length === 0 ? `<div style="text-align:center; padding:20px;">No rankings available yet.</div>` : leaderboard.map((entry, idx) => `
                            <div class="glass glass-card" style="padding: 15px 25px; display: flex; align-items: center; justify-content: space-between; ${entry.isCurrentUser ? 'border: 1px solid var(--cyan); background: rgba(0,245,255,0.05);' : ''}">
                                <div style="display: flex; align-items: center; gap: 20px;">
                                    <div style="width: 35px; height: 35px; border-radius: 50%; background: ${idx === 0 ? 'var(--yellow)' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(255,255,255,0.05)'}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${idx < 3 ? 'black' : 'white'};">
                                        ${idx + 1}
                                    </div>
                                    <div>
                                        <p style="font-weight: 600; color: white;">${entry.name} ${entry.isCurrentUser ? '<span style="color:var(--cyan); font-size:0.7rem; margin-left:5px;">(YOU)</span>' : ''}</p>
                                        <p style="color: var(--text-secondary); font-size: 0.75rem;">${entry.institution || 'CrisisCraft Academy'}</p>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <p style="font-weight: 700; color: var(--cyan); font-size: 1.1rem;">${entry.score.toLocaleString()}</p>
                                    <p style="color: var(--text-secondary); font-size: 0.75rem;">points</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }
        return `<h2>${section}</h2>`;
    },

    getStudentOverview() {
        const stats = this.state.studentStats || { modulesCompleted: 0, nextDrill: 'None', avgQuizScore: 0, totalScore: 0, progress: [] };
        const userName = localStorage.getItem('crisis_craft_user') || 'Student';

        return `
            <div class="glass" style="padding: 20px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid var(--cyan);">
                 <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(0,245,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--cyan); border: 2px solid rgba(0,245,255,0.2);">
                        <i class="fas fa-university"></i>
                    </div>
                    <div>
                        <h4 style="font-size: 1.1rem; margin-bottom: 4px;">Welcome back, ${userName}!</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            <i class="fas fa-award" style="margin-right: 8px;"></i>Ready for today's training?
                        </p>
                    </div>
                 </div>
                 <div style="text-align: right;">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">SYSTEM READINESS</p>
                    <p style="font-weight: 700; color: var(--cyan);">${stats.totalScore > 1000 ? '98%' : '75%'}</p>
                 </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                ${this.renderStatCard("Modules Done", stats.modulesCompleted, "fa-check-circle", "var(--cyan)")}
                ${this.renderStatCard("Next Drill", !stats.nextDrill ? 'TBD' : new Date(stats.nextDrill.scheduledDate).toLocaleDateString(), "fa-calendar-alt", "var(--indigo)")}
                ${this.renderStatCard("Quiz Average", stats.avgQuizScore + "%", "fa-pen-alt", "var(--purple)")}
                ${this.renderStatCard("Total Points", stats.totalScore || 0, "fa-fire", "var(--cyan)")}
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:25px;">
                <div class="glass" style="padding: 30px;">
                    <h3>Your Learning Progress</h3>
                    <div style="margin-top: 25px;">
                        ${(stats.progress || []).length === 0 ? `<p style="color:var(--text-secondary); text-align:center;">Start your first module to see progress!</p>` : stats.progress.map(p => `
                            <div style="margin-bottom:20px;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                    <span style="font-size:0.9rem;">${p.module?.title || 'Module'}</span>
                                    <span style="color:var(--cyan); font-size:0.85rem;">${p.percentComplete}%</span>
                                </div>
                                <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
                                    <div style="width:${p.percentComplete}%; height:100%; background:var(--cyan); transition:0.3s;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="glass" style="padding: 30px; background: linear-gradient(135deg, rgba(0, 245, 255, 0.05), transparent);">
                    <h3>Next Virtual Drill</h3>
                    ${!stats.nextDrill ? `
                        <p style="margin-top: 20px; color: var(--text-secondary);">No drills scheduled yet.</p>
                        <button class="btn btn-primary" style="width: auto; padding: 10px 30px; margin-top: 25px;" onclick="App.changeSection('Virtual Drills')">Browse Drills</button>
                    ` : `
                        <p style="margin-top: 15px; color: var(--text-secondary);">Upcoming Simulation</p>
                        <p style="color: var(--cyan); font-size:0.9rem; margin-top:5px;">Scheduled for ${new Date(stats.nextDrill.scheduledDate).toLocaleString()}</p>
                        <div id="drill-countdown" style="font-size: 1.5rem; font-weight: 700; color: var(--cyan); margin-top:10px;">--:--:--</div>
                        <button class="btn btn-primary" style="width: auto; padding: 10px 30px; margin-top: 20px;" onclick="App.changeSection('Virtual Drills')">View Details</button>
                    `}
                </div>
            </div>
        `;
    },

    async removeUser(userId) {
        if (!confirm('Are you sure you want to remove this user?')) return;
        try {
            await adminDeleteUser(userId);
            this.showToast('User removed successfully', 'success');
            this.loadAllUserData().then(() => this.render());
        } catch (error) {
            this.showToast('Failed to remove user', 'error');
        }
    },

    showAddUserModal() {
        if (document.getElementById('addUserModal')) return;
        const modal = document.createElement('div');
        modal.id = 'addUserModal';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(5,10,30,0.75); backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center; z-index: 1000;
        `;

        const inputStyle = `width:100%; padding:12px 14px 12px 38px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; transition:0.2s;`;
        const labelStyle = `color:rgba(255,255,255,0.6); font-size:0.8rem; font-weight:600; letter-spacing:0.5px; display:block; margin-bottom:8px; text-transform:uppercase;`;
        const focusCyan = `onfocus="this.style.borderColor='rgba(0,245,255,0.45)'; this.style.background='rgba(0,245,255,0.05)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.05)';" `;

        modal.innerHTML = `
            <div style="
                padding: 35px 40px;
                width: 480px;
                border-radius: 20px;
                border: 1px solid rgba(0,245,255,0.18);
                background: linear-gradient(135deg, rgba(14,24,55,0.97) 0%, rgba(20,30,65,0.97) 50%, rgba(10,20,48,0.97) 100%);
                box-shadow: 0 30px 60px -12px rgba(0,0,0,0.7), 0 0 40px rgba(0,245,255,0.06);
                position: relative; overflow: hidden; max-height: 90vh; overflow-y: auto;
            ">
                <div style="position:absolute; top:-40px; right:-40px; width:160px; height:160px; background:radial-gradient(circle, rgba(0,245,255,0.12), transparent 70%); pointer-events:none;"></div>
                <div style="position:absolute; bottom:-30px; left:-30px; width:120px; height:120px; background:radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%); pointer-events:none;"></div>

                <!-- Header -->
                <div style="display:flex; align-items:center; gap:14px; margin-bottom:24px;">
                    <div style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,rgba(0,245,255,0.2),rgba(0,245,255,0.05)); display:flex; align-items:center; justify-content:center; border:1px solid rgba(0,245,255,0.25);">
                        <i class="fas fa-user-plus" style="color:var(--cyan); font-size:1.1rem;"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; color:white; font-size:1.2rem;">Add New User</h3>
                        <p style="margin:0; color:var(--text-secondary); font-size:0.78rem; margin-top:2px;">Create a teacher or student account</p>
                    </div>
                </div>

                <!-- Full Name -->
                <div style="margin-bottom:15px;">
                    <label style="${labelStyle}">Full Name</label>
                    <div style="position:relative;">
                        <i class="fas fa-user" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.85rem;"></i>
                        <input type="text" id="newUserName" placeholder="e.g. John Doe" style="${inputStyle}" ${focusCyan}>
                    </div>
                </div>

                <!-- Email -->
                <div style="margin-bottom:15px;">
                    <label style="${labelStyle}">Email Address</label>
                    <div style="position:relative;">
                        <i class="fas fa-envelope" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.85rem;"></i>
                        <input type="email" id="newUserEmail" placeholder="email@example.com" style="${inputStyle}" ${focusCyan}>
                    </div>
                </div>

                <!-- Role -->
                <div style="margin-bottom:15px;">
                    <label style="${labelStyle}">System Role</label>
                    <div style="position:relative;">
                        <i class="fas fa-id-badge" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.85rem; z-index:1;"></i>
                        <select id="newUserRole"
                            style="width:100%; padding:12px 14px 12px 38px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; appearance:none; box-sizing:border-box; cursor:pointer; transition:0.2s;"
                            onfocus="this.style.borderColor='rgba(0,245,255,0.45)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)';"
                        >
                            <option value="student">🎓  Student</option>
                            <option value="teacher">📚  Teacher</option>
                        </select>
                        <i class="fas fa-chevron-down" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.8rem; pointer-events:none;"></i>
                    </div>
                </div>

                <!-- Standard & Section (side by side) -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px;">
                    <!-- Standard -->
                    <div>
                        <label style="${labelStyle}">Standard / Class</label>
                        <div style="position:relative;">
                            <i class="fas fa-graduation-cap" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.85rem;"></i>
                            <select id="newUserStandard"
                                style="width:100%; padding:12px 14px 12px 38px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; appearance:none; box-sizing:border-box; cursor:pointer; transition:0.2s;"
                                onfocus="this.style.borderColor='rgba(0,245,255,0.45)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)';"
                            >
                                <option value="">-- Select --</option>
                                ${[6, 7, 8, 9, 10, 11, 12].map(s => `<option value="${s}">${s}th Standard</option>`).join('')}
                            </select>
                            <i class="fas fa-chevron-down" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.75rem; pointer-events:none;"></i>
                        </div>
                    </div>
                    <!-- Section -->
                    <div>
                        <label style="${labelStyle}">Section</label>
                        <div style="position:relative;">
                            <i class="fas fa-layer-group" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.85rem;"></i>
                            <select id="newUserSection"
                                style="width:100%; padding:12px 14px 12px 38px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; appearance:none; box-sizing:border-box; cursor:pointer; transition:0.2s;"
                                onfocus="this.style.borderColor='rgba(0,245,255,0.45)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)';"
                            >
                                <option value="">-- Select --</option>
                                ${['A', 'B', 'C', 'D', 'E', 'F'].map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                            <i class="fas fa-chevron-down" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.75rem; pointer-events:none;"></i>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display:flex; gap:12px; justify-content:flex-end;">
                    <button onclick="App.closeAddUserModal()"
                        style="padding:11px 22px; border-radius:12px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.7); font-size:0.9rem; cursor:pointer; transition:0.2s;"
                        onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'"
                    >Cancel</button>
                    <button onclick="App.submitAddUser()"
                        style="padding:11px 28px; border-radius:12px; border:none; background:linear-gradient(135deg, #00c9e0, #0077ff); color:white; font-size:0.9rem; font-weight:600; cursor:pointer; transition:0.2s; box-shadow: 0 4px 15px rgba(0,200,255,0.3);"
                        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(0,200,255,0.45)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,200,255,0.3)';"
                    ><i class="fas fa-user-plus" style="margin-right:8px;"></i>Add User</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeAddUserModal() {
        const modal = document.getElementById('addUserModal');
        if (modal) modal.remove();
    },

    async submitAddUser() {
        const name = document.getElementById('newUserName').value.trim();
        const email = document.getElementById('newUserEmail').value.trim();
        const role = document.getElementById('newUserRole').value;
        const standard = document.getElementById('newUserStandard').value;
        const section = document.getElementById('newUserSection').value;

        if (!name || !email) return this.showToast('Please fill in name and email', 'error');
        if (!standard || !section) return this.showToast('Please select a standard and section', 'error');

        try {
            console.log('🚀 Admin creating user:', { name, email, role, standard, section });
            await adminCreateUser({ name, email, role, standard, section });
            this.showToast(`${role === 'teacher' ? 'Teacher' : 'Student'} added to Class ${standard}-${section}`, 'success');
            this.closeAddUserModal();

            // Refresh all relevant data
            await this.loadAllUserData();
            await this.loadDetailedReports();
            this.render();
        } catch (error) {
            this.showToast(error.message || 'Failed to create user', 'error');
        }
    },

    showEditUserModal(userId) {
        const user = (this.state.allUsers || []).find(u => u._id === userId);
        if (!user) return this.showToast('User not found', 'error');

        if (document.getElementById('editUserModal')) return;
        const modal = document.createElement('div');
        modal.id = 'editUserModal';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(5,10,30,0.75); backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center; z-index: 1000;
        `;

        const inputStyle = `width:100%; padding:12px 14px 12px 38px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; transition:0.2s;`;
        const labelStyle = `color:rgba(255,255,255,0.6); font-size:0.8rem; font-weight:600; letter-spacing:0.5px; display:block; margin-bottom:8px; text-transform:uppercase;`;
        const focusCyan = `onfocus="this.style.borderColor='rgba(0,245,255,0.45)'; this.style.background='rgba(0,245,255,0.05)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.05)';" `;

        modal.innerHTML = `
            <div class="glass" style="
                padding: 35px 40px;
                width: 480px;
                border-radius: 20px;
                border: 1px solid rgba(139,92,246,0.3);
                background: linear-gradient(135deg, rgba(20,15,45,0.98) 0%, rgba(10,10,30,0.98) 100%);
                box-shadow: 0 30px 60px -12px rgba(0,0,0,0.8), 0 0 40px rgba(139,92,246,0.1);
                position: relative; overflow: hidden; max-height: 90vh; overflow-y: auto;
            ">
                <!-- Header -->
                <div style="display:flex; align-items:center; gap:14px; margin-bottom:24px;">
                    <div style="width:42px; height:42px; border-radius:12px; background:rgba(139,92,246,0.15); display:flex; align-items:center; justify-content:center; border:1px solid rgba(139,92,246,0.3);">
                        <i class="fas fa-user-edit" style="color:var(--purple); font-size:1.1rem;"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; color:white; font-size:1.2rem;">Edit User Details</h3>
                        <p style="margin:0; color:var(--text-secondary); font-size:0.78rem; margin-top:2px;">Modify information for ${user.name}</p>
                    </div>
                </div>

                <!-- Full Name -->
                <div style="margin-bottom:15px;">
                    <label style="${labelStyle}">Full Name</label>
                    <div style="position:relative;">
                        <i class="fas fa-user" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(139,92,246,0.6); font-size:0.85rem;"></i>
                        <input type="text" id="editUserName" value="${user.name}" style="${inputStyle}" ${focusCyan}>
                    </div>
                </div>

                <!-- Email -->
                <div style="margin-bottom:15px;">
                    <label style="${labelStyle}">Email Address</label>
                    <div style="position:relative;">
                        <i class="fas fa-envelope" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(139,92,246,0.6); font-size:0.85rem;"></i>
                        <input type="email" id="editUserEmail" value="${user.email}" style="${inputStyle}" ${focusCyan}>
                    </div>
                </div>

                <!-- Role -->
                <div style="margin-bottom:15px;">
                    <label style="${labelStyle}">System Role</label>
                    <div style="position:relative;">
                        <i class="fas fa-id-badge" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(139,92,246,0.6); font-size:0.85rem; z-index:1;"></i>
                        <select id="editUserRole"
                            style="width:100%; padding:12px 14px 12px 38px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; appearance:none; box-sizing:border-box; cursor:pointer;"
                        >
                            <option value="student" ${user.role === 'student' ? 'selected' : ''}>🎓  Student</option>
                            <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>📚  Teacher</option>
                        </select>
                        <i class="fas fa-chevron-down" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); color:rgba(139,92,246,0.4); font-size:0.8rem; pointer-events:none;"></i>
                    </div>
                </div>

                <!-- Standard & Section -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px;">
                    <div>
                        <label style="${labelStyle}">Standard</label>
                        <select id="editUserStandard" style="width:100%; padding:12px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem;">
                            <option value="">-- Select --</option>
                            ${[6, 7, 8, 9, 10, 11, 12].map(s => `<option value="${s}" ${user.standard == s ? 'selected' : ''}>${s}th Standard</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="${labelStyle}">Section</label>
                        <select id="editUserSection" style="width:100%; padding:12px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem;">
                            <option value="">-- Select --</option>
                            ${['A', 'B', 'C', 'D', 'E', 'F'].map(s => `<option value="${s}" ${user.section === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="display:flex; gap:12px; justify-content:flex-end;">
                    <button onclick="App.closeEditUserModal()" style="padding:11px 22px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:white; cursor:pointer;">Cancel</button>
                    <button onclick="App.submitEditUser('${user._id}')" style="padding:11px 28px; border-radius:12px; border:none; background:linear-gradient(135deg, #8b5cf6, #6d28d9); color:white; font-weight:600; cursor:pointer;">Save Changes</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeEditUserModal() {
        const modal = document.getElementById('editUserModal');
        if (modal) modal.remove();
    },

    async submitEditUser(userId) {
        const name = document.getElementById('editUserName').value.trim();
        const email = document.getElementById('editUserEmail').value.trim();
        const role = document.getElementById('editUserRole').value;
        const standard = document.getElementById('editUserStandard').value;
        const section = document.getElementById('editUserSection').value;

        if (!name || !email) return this.showToast('Name and Email are required', 'error');

        try {
            await adminUpdateUser(userId, { name, email, role, standard, section });
            this.showToast('User updated successfully', 'success');
            this.closeEditUserModal();
            await this.loadAllUserData();
            await this.loadDetailedReports();
            this.render();
        } catch (error) {
            this.showToast(error.message || 'Failed to update user', 'error');
        }
    },

    async removeDrill(drillId) {
        if (!confirm('Delete this virtual drill?')) return;
        try {
            await deleteDrill(drillId);
            this.showToast('Drill deleted successfully', 'success');
            this.loadDrills().then(() => this.render());
        } catch (error) {
            this.showToast('Failed to delete drill', 'error');
        }
    },

    showAddDrillModal() {
        if (document.getElementById('addDrillModal')) return;
        const modal = document.createElement('div');
        modal.id = 'addDrillModal';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(5,10,30,0.75); backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center; z-index: 1000;
        `;

        const inputStyle = `width:100%; padding:12px 14px 12px 38px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; transition:0.2s;`;
        const labelStyle = `color:rgba(255,255,255,0.6); font-size:0.8rem; font-weight:600; letter-spacing:0.5px; display:block; margin-bottom:8px; text-transform:uppercase;`;
        const focusCyan = `onfocus="this.style.borderColor='rgba(0,245,255,0.45)'; this.style.background='rgba(0,245,255,0.05)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.05)';" `;

        modal.innerHTML = `
            <div style="
                padding: 35px 40px;
                width: 500px;
                border-radius: 20px;
                border: 1px solid rgba(0,245,255,0.18);
                background: linear-gradient(135deg, rgba(14,24,55,0.97) 0%, rgba(20,30,65,0.97) 50%, rgba(10,20,48,0.97) 100%);
                box-shadow: 0 30px 60px -12px rgba(0,0,0,0.7), 0 0 40px rgba(0,245,255,0.06);
                position: relative; overflow: hidden; max-height: 90vh; overflow-y: auto;
            ">
                <div style="position:absolute; top:-40px; right:-40px; width:160px; height:160px; background:radial-gradient(circle, rgba(0,245,255,0.12), transparent 70%); pointer-events:none;"></div>
                <div style="position:absolute; bottom:-30px; left:-30px; width:120px; height:120px; background:radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%); pointer-events:none;"></div>

                <!-- Header -->
                <div style="display:flex; align-items:center; gap:14px; margin-bottom:24px;">
                    <div style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,rgba(0,245,255,0.2),rgba(0,245,255,0.05)); display:flex; align-items:center; justify-content:center; border:1px solid rgba(0,245,255,0.25);">
                        <i class="fas fa-vr-cardboard" style="color:var(--cyan); font-size:1.1rem;"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; color:white; font-size:1.2rem;">Schedule Virtual Drill</h3>
                        <p style="margin:0; color:var(--text-secondary); font-size:0.78rem; margin-top:2px;">Plan an emergency simulation exercise</p>
                    </div>
                </div>

                <!-- Drill Title -->
                <div style="margin-bottom:15px;">
                    <label style="${labelStyle}">Drill Title</label>
                    <div style="position:relative;">
                        <i class="fas fa-heading" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.85rem;"></i>
                        <input type="text" id="newDrillTitle" placeholder="e.g. Earthquake Evacuation" style="${inputStyle}" ${focusCyan}>
                    </div>
                </div>

                <!-- Disaster Type -->
                <div style="margin-bottom:15px;">
                    <label style="${labelStyle}">Disaster Type</label>
                    <div style="position:relative;">
                        <i class="fas fa-exclamation-triangle" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.85rem; z-index:1;"></i>
                        <select id="newDrillType" style="width:100%; padding:12px 14px 12px 38px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; appearance:none; box-sizing:border-box; cursor:pointer;" onfocus="this.style.borderColor='rgba(0,245,255,0.45)';" onblur="this.style.borderColor='rgba(255,255,255,0.1)';">
                            <option value="Earthquake">Earthquake</option>
                            <option value="Fire">Fire</option>
                            <option value="Flood">Flood</option>
                            <option value="Tornado">Tornado</option>
                            <option value="Chemical">Chemical Spill</option>
                        </select>
                        <i class="fas fa-chevron-down" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.8rem; pointer-events:none;"></i>
                    </div>
                </div>

                <!-- Date & Time -->
                <div style="margin-bottom:15px;">
                    <label style="${labelStyle}">Date & Time</label>
                    <div style="position:relative;">
                        <i class="fas fa-calendar-alt" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:rgba(0,245,255,0.4); font-size:0.85rem;"></i>
                        <input type="datetime-local" id="newDrillDate" style="${inputStyle}" ${focusCyan}>
                    </div>
                </div>

                <!-- Standard & Section -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:15px;">
                    <div>
                        <label style="${labelStyle}">Target Class (Standard)</label>
                        <select id="newDrillStandard" style="width:100%; padding:12px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem;">
                            <option value="">All Standards</option>
                            ${[6, 7, 8, 9, 10, 11, 12].map(s => `<option value="${s}">${s}th Standard</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="${labelStyle}">Target Section</label>
                        <select id="newDrillSection" style="width:100%; padding:12px; background:rgba(15,23,50,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem;">
                            <option value="">All Sections</option>
                            ${['A', 'B', 'C', 'D', 'E', 'F'].map(s => `<option value="${s}">Section ${s}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Description -->
                <div style="margin-bottom:25px;">
                    <label style="${labelStyle}">Description</label>
                    <div style="position:relative;">
                        <i class="fas fa-align-left" style="position:absolute; left:14px; top:15px; color:rgba(0,245,255,0.4); font-size:0.85rem;"></i>
                        <textarea id="newDrillDesc" style="width:100%; padding:12px 14px 12px 38px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; transition:0.2s; min-height:80px; resize:none;" placeholder="Details about the drill scenario..." ${focusCyan}></textarea>
                    </div>
                </div>

                <div style="display:flex; gap:12px; justify-content:flex-end;">
                    <button onclick="App.closeAddDrillModal()" style="padding:11px 22px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:white; cursor:pointer;">Cancel</button>
                    <button onclick="App.submitAddDrill()" style="padding:11px 28px; border-radius:12px; border:none; background:linear-gradient(135deg, #00f5ff, #00bfff); color:#000; font-weight:700; cursor:pointer;">Schedule</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeAddDrillModal() {
        const modal = document.getElementById('addDrillModal');
        if (modal) modal.remove();
    },

    async submitAddDrill() {
        const title = document.getElementById('newDrillTitle').value.trim();
        const type = document.getElementById('newDrillType').value;
        const date = document.getElementById('newDrillDate').value;
        const desc = document.getElementById('newDrillDesc').value.trim();
        const targetStandard = document.getElementById('newDrillStandard').value;
        const targetSection = document.getElementById('newDrillSection').value;

        if (!title || !date || !desc) return this.showToast('Please fill all required fields', 'error');

        try {
            await createDrill({ title, disasterType: type, scheduledDate: date, description: desc, targetStandard, targetSection });
            this.showToast('Drill scheduled successfully', 'success');
            this.closeAddDrillModal();
            this.loadDrills().then(() => this.render());
        } catch (error) {
            this.showToast('Failed to schedule drill', 'error');
        }
    },

    async registerForDrill(drillId) {
        try {
            await registerForDrill(drillId);
            this.showToast('Successfully registered for drill!', 'success');
            this.loadDrills().then(() => this.render());
        } catch (error) {
            this.showToast(error.message || 'Registration failed', 'error');
        }
    },

    initCharts() {
        const role = this.state.role;
        const section = this.state.activeSection;

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#00f5ff', padding: 10, cornerRadius: 8 } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } } }
            }
        };

        if (role === 'admin' && section === 'Dashboard') {
            const dCtx = document.getElementById('drillChart');
            if (dCtx) {
                const ctx = dCtx.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(0, 245, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 245, 255, 0.1)');

                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Participation %',
                            data: [65, 78, 92, 85, 88, 95],
                            backgroundColor: gradient,
                            borderRadius: 6,
                            barThickness: 20
                        }]
                    },
                    options: commonOptions
                });
            }
            const aCtx = document.getElementById('awarenessChart');
            if (aCtx) {
                const ctx = aCtx.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
                gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Awareness Score',
                            data: [45, 52, 68, 74, 82, 88],
                            borderColor: '#8b5cf6',
                            tension: 0.4,
                            fill: true,
                            backgroundColor: gradient,
                            pointBackgroundColor: '#8b5cf6',
                            pointBorderColor: '#fff',
                            pointRadius: 4
                        }]
                    },
                    options: commonOptions
                });
            }
        }

        if (role === 'admin' && section === 'Reports & Analytics') {
            const rCtx = document.getElementById('reportsChart');
            if (rCtx) {
                const ctx = rCtx.getContext('2d');
                // Adjusting the canvas container size explicitly
                rCtx.parentElement.style.height = '400px';

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        datasets: [{
                            label: 'Platform Usage (Hours)',
                            data: [120, 150, 200, 180, 220, 250, 240, 280, 310, 290, 330, 350],
                            borderColor: '#e11d48',
                            tension: 0.4,
                            fill: true,
                            backgroundColor: 'rgba(225, 29, 72, 0.1)',
                            pointBackgroundColor: '#e11d48',
                            pointRadius: 3
                        }]
                    },
                    options: {
                        ...commonOptions,
                        plugins: { legend: { display: true, labels: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } } } }
                    }
                });
            }
        }
    },

    initCountdown() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);

        const stats = this.state.studentStats;
        if (!stats || !stats.nextDrill) return;

        const drillTime = new Date(stats.nextDrill.scheduledDate).getTime();

        const updateTimer = () => {
            const timerEl = document.getElementById('drill-countdown');
            if (!timerEl) {
                clearInterval(this.countdownInterval);
                return;
            }

            const now = Date.now();
            const diff = drillTime - now;

            if (diff <= 0) {
                timerEl.textContent = "LIVE NOW";
                timerEl.style.color = "var(--red)";
                clearInterval(this.countdownInterval);
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            timerEl.textContent = `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        };

        updateTimer();
        this.countdownInterval = setInterval(updateTimer, 1000);
    },

    // --- Student Interaction Methods ---
    async startModule(moduleId) {
        try {
            await startModuleProgress(moduleId);
            this.showModuleViewer(moduleId);
            await this.loadStudentStats(); // Refresh progress stats
            this.render(); // Update UI to show 'In Progress'
        } catch (error) {
            console.error('Error starting module:', error);
            this.showModuleViewer(moduleId); // Still show viewer even if progress fails
        }
    },

    triggerConfetti() {
        const colors = ['#00f5ff', '#8b5cf6', '#22c55e', '#ffffff'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position:fixed; 
                width:10px; height:10px; 
                background:${colors[Math.floor(Math.random() * colors.length)]};
                top:-10px;
                left:${Math.random() * 100}vw;
                border-radius:50%;
                z-index:3000;
                pointer-events:none;
                animation: fall ${2 + Math.random() * 3}s linear forwards;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }

        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes fall {
                    to { transform: translateY(110vh) rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    },

    async updateModuleProgress(moduleId, percent) {
        try {
            await trackModuleProgress(moduleId, percent);

            if (percent === 100) {
                this.showToast('Module completed successfully', 'success');
            } else {
                this.showToast(`Progress: ${percent}%`, 'info');
            }

            await this.loadStudentStats();
            this.render();

            if (percent === 100) {
                const modal = document.getElementById('moduleViewerModal');
                if (modal) setTimeout(() => modal.remove(), 1000);
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            this.showToast('Failed to save progress', 'error');
        }
    },

    async completeModule(moduleId) {
        return this.updateModuleProgress(moduleId, 100);
    },

    showModuleViewer(moduleId) {
        const modules = this.state.uploadedModules || [];
        const mod = modules.find(m => m._id === moduleId);
        if (!mod) return;

        const progressRecord = (this.state.studentStats?.progress || []).find(p => p.module?._id === moduleId || p.module === moduleId);
        const currentPercent = progressRecord?.percentComplete || 0;

        const modal = document.createElement('div');
        modal.id = 'moduleViewerModal';
        modal.style.cssText = `position:fixed; inset:0; background:rgba(2,6,23,0.95); backdrop-filter:blur(15px); z-index:2500; display:flex; justify-content:center; align-items:center; padding:20px;`;

        let pdfViewerHtml = '';
        if (mod.fileData) {
            pdfViewerHtml = `<embed src="${mod.fileData}" type="application/pdf" width="100%" height="650px" style="border-radius:12px; border:1px solid rgba(0,245,255,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">`;
        }

        let moduleSummary = `Welcome to the <strong>${mod.title}</strong> module! Dive into this comprehensive guide to understand the essential protocols and life-saving strategies for this specific scenario. Pay close attention to the details, as your quick thinking could make all the difference during an actual emergency.`;

        const titleLower = (mod.title || '').toLowerCase();
        const type = mod.disasterType || '';

        if (type === 'Earthquake' || titleLower.includes('earthquake')) {
            moduleSummary = `The <strong>${mod.title}</strong> module prepares you for sudden seismic events. Learn the critical "Drop, Cover, and Hold On" techniques, understand structural safety, and discover how to secure your environment before the shaking starts. Your readiness is your best defense!`;
        } else if (type === 'Fire' || titleLower.includes('fire')) {
            moduleSummary = `Welcome to the <strong>${mod.title}</strong> module. Fire emergencies require split-second decisions. This guide will walk you through evacuation routes, extinguisher usage (PASS method), and hazard prevention. Master these skills to protect yourself and those around you.`;
        } else if (type === 'Flood' || titleLower.includes('flood')) {
            moduleSummary = `In the <strong>${mod.title}</strong> module, you'll learn how to respond to rising waters. From identifying high ground to understanding emergency kits and avoiding contaminated water, this training ensures you stay afloat and secure during severe water-related crises.`;
        } else if (type === 'Tornado' || titleLower.includes('tornado') || type === 'Hurricane' || titleLower.includes('hurricane')) {
            moduleSummary = `Welcome to the <strong>${mod.title}</strong> module. Severe weather strikes fast. Explore how to find safe shelter, monitor weather alerts, and prepare an emergency go-bag. Stay informed and stay safe during extreme winds and storms.`;
        }

        const isTeacher = this.state.role === 'teacher';

        modal.innerHTML = `
            <div class="glass" style="width:1000px; max-height:95vh; overflow-y:auto; padding:40px; position:relative; border:1px solid rgba(0,245,255,0.3); box-shadow: 0 0 50px rgba(0,245,255,0.1);">
                <button style="position:absolute; top:20px; right:20px; background:rgba(255,255,255,0.05); border:none; color:white; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;" onclick="document.getElementById('moduleViewerModal').remove(); App.render();">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:20px;">
                        <div style="width:60px; height:60px; background:linear-gradient(135deg, var(--cyan), #0077ff); border-radius:15px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; box-shadow: 0 0 20px rgba(0,245,255,0.3);">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div>
                            <h2 style="color:white; font-size:1.8rem; margin:0;">${mod.title}</h2>
                            <p style="color:var(--cyan); font-size:0.9rem; margin-top:5px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Module Learning Path</p>
                        </div>
                    </div>
                    ${!isTeacher ? `
                    <div style="text-align:right;">
                        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:5px;">OVERALL COMPLETION</div>
                        <div style="font-size:1.5rem; font-weight:800; color:var(--cyan);">${currentPercent}%</div>
                    </div>
                    ` : ''}
                </div>

                <div style="display:grid; grid-template-columns: ${isTeacher ? '1fr' : '1fr 300px'}; gap:30px;">
                    <div class="content-area">
                        ${pdfViewerHtml || `
                            <div style="background:rgba(255,255,255,0.03); padding:30px; border-radius:15px; border:1px solid rgba(255,255,255,0.05); line-height:1.8; color:rgba(255,255,255,0.9); font-size:1.05rem; min-height:400px;">
                                ${mod.content ? mod.content.replace(/\n/g, '<br>') : 'Exploring the foundations of disaster preparedness...'}
                            </div>
                        `}
                    </div>

                    ${!isTeacher ? `
                    <div class="sidebar-area">
                        <div class="glass" style="padding:25px; border-radius:20px; background:rgba(255,255,255,0.02); display:flex; flex-direction:column; height:100%;">
                            <h4 style="margin-bottom:20px; font-size:1.1rem; display:flex; align-items:center; gap:10px; color:white;">
                                <i class="fas fa-info-circle" style="color:var(--cyan);"></i> Module Overview
                            </h4>
                            
                            <div style="flex:1; line-height:1.7; color:rgba(255,255,255,0.8); font-size:0.95rem; font-family: 'Inter', sans-serif;">
                                ${moduleSummary}
                            </div>

                            <div style="margin-top:30px; text-align:center;">
                                ${currentPercent >= 100 ?
                    `<button class="btn" style="width:100%; padding:15px; font-size:1rem; background:rgba(34,197,94,0.1); color:#22c55e; border:1px solid rgba(34,197,94,0.3); border-radius:12px; cursor:default; display:flex; justify-content:center; align-items:center;">
                                        <i class="fas fa-check-circle" style="margin-right:8px;"></i> Completed
                                    </button>` :
                    `<button class="btn btn-primary" style="width:100%; padding:15px; font-size:1rem; background:linear-gradient(135deg, var(--cyan), #0077ff); border:none; border-radius:12px; font-weight:700; box-shadow:0 10px 20px rgba(0,245,255,0.2); transition:transform 0.2s, box-shadow 0.2s; display:flex; justify-content:center; align-items:center; color:white; cursor:pointer;" 
                                        onclick="App.updateModuleProgress('${mod._id}', 100)" 
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 25px rgba(0,245,255,0.3)';" 
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 20px rgba(0,245,255,0.2)';">
                                        <i class="fas fa-flag-checkered" style="margin-right:8px;"></i> Submit & Complete
                                    </button>`
                }
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>`;
        document.body.appendChild(modal);
    },

    interactDrill(index) {
        // TODO: Implement with API call to GET /api/drills/{id} or POST /api/drills/{id}/simulate
        this.showToast('Drill interaction requires API integration', 'info');
    },

    findNextDrillIndex() {
        // TODO: Get next drill from API GET /api/drills/next
        return -1;
    },

    showDrillReport(index) {
        // TODO: Implement with API call to GET /api/drills/{id}/report
        this.showToast('Drill report requires API integration', 'info');
        return;
        const modal = document.createElement('div');
        modal.id = 'drillReportModal';
        modal.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); z-index:2500; display:flex; justify-content:center; align-items:center; padding:20px;`;

        modal.innerHTML = `
            <div class="glass" style="width:550px; padding:40px; border:1px solid rgba(255,255,255,0.1); position:relative;">
                <button style="position:absolute; top:20px; right:20px; background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;" onclick="document.getElementById('drillReportModal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <h3 style="margin-bottom:25px;">Performance Report</h3>
                <div style="text-align:center; padding:30px; background:rgba(255,255,255,0.03); border-radius:20px; margin-bottom:30px;">
                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:10px;">SAFETY SCORE</p>
                    <p style="font-size:3.5rem; font-weight:800; color:var(--cyan);">${drill.score}%</p>
                    <p style="color:#22c55e; font-weight:600; margin-top:10px;"><i class="fas fa-arrow-up"></i> Top 5% Performance</p>
                </div>
                <div style="display:grid; gap:15px;">
                    <div style="display:flex; justify-content:space-between; padding:15px; background:rgba(255,255,255,0.02); border-radius:10px;">
                        <span style="color:var(--text-secondary);">Response Time</span>
                        <span style="font-weight:600;">1m 42s</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:15px; background:rgba(255,255,255,0.02); border-radius:10px;">
                        <span style="color:var(--text-secondary);">Correct Protocol Usage</span>
                        <span style="font-weight:600;">9/10</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:15px; background:rgba(255,255,255,0.02); border-radius:10px;">
                        <span style="color:var(--text-secondary);">Critical Decisions</span>
                        <span style="font-weight:600; color:#22c55e;">PASSED</span>
                    </div>
                </div>
                <button class="btn btn-primary" style="margin-top:30px;" onclick="document.getElementById('drillReportModal').remove()">Close Report</button>
            </div>`;
        document.body.appendChild(modal);
    },

    async showTakeQuizModal(quizId) {
        try {
            const quiz = await getQuiz(quizId);
            if (!quiz) return this.showToast('Quiz not found', 'error');

            const modal = document.createElement('div');
            modal.id = 'takeQuizModal';
            modal.style.cssText = `
                position: fixed; inset: 0; background: rgba(5,10,30,0.85); backdrop-filter: blur(18px); 
                display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 20px;
            `;

            const questions = quiz.questionsList || [];
            this.state.currentQuiz = quiz;
            this.state.quizStartTime = Date.now();

            modal.innerHTML = `
                <div class="glass" style="
                    padding: 50px; width: 750px; max-height: 90vh; overflow-y: auto; position: relative; 
                    border-radius: 28px; border: 1px solid rgba(139,92,246,0.3); 
                    background: linear-gradient(135deg, rgba(20,15,45,0.98) 0%, rgba(10,10,30,0.98) 100%);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.8), 0 0 50px rgba(139,92,246,0.1);
                ">
                    <!-- Glow Accents -->
                    <div style="position:absolute; top:-50px; right:-50px; width:180px; height:180px; background:radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%); pointer-events:none;"></div>
                    <div style="position:absolute; bottom:-40px; left:-40px; width:150px; height:150px; background:radial-gradient(circle, rgba(0,245,255,0.12), transparent 70%); pointer-events:none;"></div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 40px; position:relative;">
                        <div>
                            <h2 style="color:white; margin-bottom:5px; font-size:1.8rem;">${quiz.title}</h2>
                            <p style="color:var(--text-secondary); font-size:0.9rem;">Total Marks: ${quiz.totalMarks} • ${questions.length} Questions</p>
                        </div>
                        <div id="quiz-timer" style="background:rgba(139,92,246,0.15); padding:10px 20px; border-radius:15px; color:var(--purple); font-weight:800; font-size:1.2rem; border:1px solid rgba(139,92,246,0.3); box-shadow:0 0 15px rgba(139,92,246,0.15);">
                            <i class="fas fa-clock" style="margin-right:10px;"></i>${quiz.timeLimit}:00
                        </div>
                    </div>

                    <div id="studentQuestions">
                        ${questions.map((q, qIdx) => `
                            <div style="margin-bottom:40px; background:rgba(255,255,255,0.02); padding:30px; border-radius:20px; border: 1px solid rgba(255,255,255,0.05);">
                                <p style="font-size:1.15rem; font-weight:700; margin-bottom:25px; color:white; line-height:1.4;">
                                    <span style="color:var(--purple); margin-right:10px;">Q${qIdx + 1}.</span>${q.text}
                                </p>
                                <div style="display:grid; gap:14px;">
                                    ${q.options.map((opt, optIdx) => `
                                        <label style="display:flex; align-items:center; gap:15px; background:rgba(255,255,255,0.03); padding:18px 22px; border-radius:14px; cursor:pointer; border: 1px solid rgba(255,255,255,0.06); transition:0.2s;" 
                                               onmouseover="this.style.background='rgba(255,255,255,0.07)'; this.style.borderColor='rgba(139,92,246,0.3)';" 
                                               onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.06)';"
                                        >
                                            <input type="radio" name="student_q_${qIdx}" value="${optIdx}" style="accent-color:var(--purple); width:20px; height:20px;">
                                            <span style="font-size:1rem; color:rgba(255,255,255,0.85);">${opt}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 40px; position:relative;">
                        <button class="btn" style="background: rgba(255,255,255,0.05); width: auto; padding: 12px 35px; border:1px solid rgba(255,255,255,0.1);" onclick="App.confirmQuitQuiz()">Quit Assessment</button>
                        <button class="btn btn-primary" style="width: auto; padding: 14px 50px; background:linear-gradient(135deg, var(--purple), var(--indigo)); font-weight:700; font-size:1rem;" onclick="App.submitStudentQuiz()">Finish & Submit</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);

            // Start Timer
            let timeLeft = quiz.timeLimit * 60;
            const timerInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    this.submitStudentQuiz();
                } else {
                    const m = Math.floor(timeLeft / 60);
                    const s = timeLeft % 60;
                    const timerEl = document.getElementById('quiz-timer');
                    if (timerEl) {
                        timerEl.innerHTML = `<i class="fas fa-clock" style="margin-right:10px;"></i>${m}:${s < 10 ? '0' : ''}${s}`;
                        if (timeLeft < 60) timerEl.style.color = 'var(--red)';
                    }
                }
            }, 1000);
            this.state.quizTimer = timerInterval;

        } catch (error) {
            console.error('Quiz load error:', error);
            this.showToast('Failed to load quiz content', 'error');
        }
    },

    confirmQuitQuiz() {
        if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
            if (this.state.quizTimer) clearInterval(this.state.quizTimer);
            document.getElementById('takeQuizModal')?.remove();
        }
    },

    async submitStudentQuiz() {
        const quiz = this.state.currentQuiz;
        if (!quiz) return;

        // Clear timer
        if (this.state.quizTimer) {
            clearInterval(this.state.quizTimer);
            this.state.quizTimer = null;
        }

        // Collect answers
        const answers = [];
        const questions = quiz.questionsList || [];
        questions.forEach((q, idx) => {
            const selected = document.querySelector(`input[name="student_q_${idx}"]:checked`);
            answers.push({
                questionIndex: idx,
                selectedOption: selected ? parseInt(selected.value) : -1
            });
        });

        try {
            const oldAchievements = [...(this.state.achievements || [])];
            this.showToast('Evaluating assessment...', 'info');
            const result = await submitQuiz(quiz._id, answers);

            // Show result modal
            const modal = document.getElementById('takeQuizModal');
            if (modal) {
                modal.innerHTML = `
                    <div class="glass" style="
                        padding: 60px 50px; width: 550px; text-align: center; 
                        border-radius: 30px; border: 1px solid rgba(139,92,246,0.3);
                        background: linear-gradient(135deg, rgba(20,15,45,0.98) 0%, rgba(10,10,30,0.98) 100%);
                        animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    ">
                        <div style="width: 100px; height: 100px; background: rgba(139,92,246,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--purple); margin: 0 auto 30px; border: 3px solid var(--purple); box-shadow: 0 0 30px rgba(139,92,246,0.2);">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <h2 style="margin-bottom: 12px; color:white; font-size:2rem;">Assessment Completed!</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 40px; font-size:1.1rem;">You've taken a step closer to being disaster-ready.</p>
                        
                        <div style="background: rgba(255,255,255,0.03); padding: 30px; border-radius: 24px; margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.05); text-align: left;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:20px; align-items:center;">
                                <span style="color:var(--text-secondary); font-size:0.95rem;">Correct Answers</span>
                                <span style="font-weight:700; color:white; font-size:1.2rem;">${result.score} / ${result.totalMarks}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:20px; align-items:center;">
                                <span style="color:var(--text-secondary); font-size:0.95rem;">Readiness Score</span>
                                <span style="font-weight:700; color:var(--purple); font-size:1.2rem;">${result.readinessScore}%</span>
                            </div>
                            <div style="height:1px; background:rgba(255,255,255,0.05); margin-bottom:20px;"></div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="color:var(--text-secondary); font-size:0.95rem;">Points Earned</span>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <i class="fas fa-fire" style="color:var(--cyan);"></i>
                                    <span style="font-weight:800; color:var(--cyan); font-size:1.4rem;">+${Math.round(result.readinessScore)}</span>
                                </div>
                            </div>
                        </div>

                        <button class="btn btn-primary" style="width: 100%; padding: 16px; font-weight:700; font-size:1.1rem; background: linear-gradient(135deg, var(--purple), var(--indigo));" onclick="document.getElementById('takeQuizModal').remove(); App.init();">
                            Return to Dashboard
                        </button>
                    </div>
                `;
            }

            this.showToast('Points generated successfully!', 'success');

            // Sync background data
            await Promise.all([
                this.loadStudentStats(),
                this.loadQuizResults(),
                this.loadAchievements(),
                this.loadLeaderboard()
            ]);

            const newAchievements = this.state.achievements || [];
            if (newAchievements.length > oldAchievements.length) {
                // Find the new ones
                const unlocked = newAchievements.filter(na => !oldAchievements.some(oa => oa._id === na._id));
                unlocked.forEach((badge, idx) => {
                    setTimeout(() => this.showBadgeCelebration(badge), idx * 4000);
                });
            }

            this.render();

        } catch (error) {
            console.error('Submission failed:', error);
            this.showToast('Could not save results', 'error');
        }
    },

    // ─── Notification Panel ───────────────────────────────────────────────
    toggleNotificationPanel() {
        if (document.getElementById('notif-panel')) {
            this.closeNotificationPanel();
        } else {
            this.closeProfilePanel();
            this.showNotificationPanel();
        }
    },

    showNotificationPanel() {
        const role = this.state.role || 'admin';
        const alerts = this.state.activeAlerts || [];

        // Role-specific static notifications
        const roleNotifs = {
            admin: [
                { icon: 'fa-users', color: 'var(--cyan)', title: 'New user registered', time: 'Just now' },
                { icon: 'fa-shield-alt', color: 'var(--indigo)', title: 'System health: Optimal', time: '2 min ago' },
                { icon: 'fa-file-alt', color: 'var(--purple)', title: 'Analytics report ready', time: '1 hr ago' },
            ],
            teacher: [
                { icon: 'fa-user-graduate', color: 'var(--cyan)', title: 'Student submitted a quiz', time: 'Just now' },
                { icon: 'fa-book', color: 'var(--indigo)', title: 'Module viewed 12 times today', time: '30 min ago' },
                { icon: 'fa-vr-cardboard', color: 'var(--purple)', title: 'Drill participation updated', time: '2 hr ago' },
            ],
            student: [
                { icon: 'fa-trophy', color: 'var(--yellow)', title: 'New badge unlocked!', time: 'Just now' },
                { icon: 'fa-pen-nib', color: 'var(--purple)', title: 'New quiz available', time: '15 min ago' },
                { icon: 'fa-vr-cardboard', color: 'var(--cyan)', title: 'Drill scheduled tomorrow', time: '1 hr ago' },
            ]
        };

        const notifs = roleNotifs[role] || [];
        const btnEl = document.getElementById('notif-btn');
        const rect = btnEl ? btnEl.getBoundingClientRect() : { right: 100, bottom: 80 };

        const panel = document.createElement('div');
        panel.id = 'notif-panel';
        panel.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 10}px;
            right: ${window.innerWidth - rect.right}px;
            width: 340px;
            border-radius: 16px;
            border: 1px solid rgba(0,245,255,0.2);
            background: linear-gradient(135deg, rgba(12,20,50,0.98) 0%, rgba(18,28,62,0.98) 100%);
            box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(0,245,255,0.06);
            z-index: 5000;
            overflow: hidden;
            animation: slideDown 0.2s ease;
        `;

        const broadcastItems = alerts.map(a => `
            <div style="display:flex; align-items:flex-start; gap:12px; padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.04); background: rgba(239,68,68,0.06);">
                <div style="width:34px; height:34px; border-radius:10px; background:rgba(239,68,68,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="fas fa-bullhorn" style="color:var(--red); font-size:0.85rem;"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <p style="font-size:0.85rem; font-weight:600; color:white; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.message || a}</p>
                    <p style="font-size:0.75rem; color:var(--red); font-weight:500;">System Broadcast</p>
                </div>
            </div>
        `).join('');

        const notifItems = notifs.map(n => `
            <div style="display:flex; align-items:flex-start; gap:12px; padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.04); transition:0.2s; cursor:default;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                <div style="width:34px; height:34px; border-radius:10px; background:${n.color}18; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="fas ${n.icon}" style="color:${n.color}; font-size:0.85rem;"></i>
                </div>
                <div style="flex:1;">
                    <p style="font-size:0.85rem; font-weight:500; color:white; margin-bottom:3px;">${n.title}</p>
                    <p style="font-size:0.75rem; color:var(--text-secondary);">${n.time}</p>
                </div>
            </div>
        `).join('');

        panel.innerHTML = `
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 18px; border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-bell" style="color:var(--cyan); font-size:0.95rem;"></i>
                    <span style="font-weight:700; color:white; font-size:0.95rem;">Notifications</span>
                    ${(alerts.length + notifs.length) > 0 ? `<span style="background:var(--red); color:white; font-size:0.7rem; font-weight:700; padding:2px 7px; border-radius:10px;">${alerts.length + notifs.length}</span>` : ''}
                </div>
                <button onclick="App.closeNotificationPanel()" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:1rem; line-height:1; padding:2px 6px; border-radius:6px; transition:0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='var(--text-secondary)'"><i class="fas fa-times"></i></button>
            </div>
            <!-- Broadcasts -->
            ${alerts.length > 0 ? `<div style="padding:8px 18px 4px; font-size:0.7rem; color:var(--red); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Live Broadcasts</div>${broadcastItems}` : ''}
            <!-- Role notifications -->
            <div style="padding:8px 18px 4px; font-size:0.7rem; color:var(--text-secondary); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Recent Activity</div>
            ${notifItems}
            <!-- Footer -->
            <div style="padding:12px 18px; text-align:center; border-top:1px solid rgba(255,255,255,0.06);">
                <button onclick="App.closeNotificationPanel(); App.changeSection('${role === 'admin' ? 'Emergency Alerts' : 'Dashboard'}');" style="background:none; border:none; color:var(--cyan); font-size:0.82rem; cursor:pointer; font-weight:600;">View all notifications →</button>
            </div>
        `;

        document.body.appendChild(panel);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', this._notifOutsideClick = (e) => {
                if (!panel.contains(e.target) && e.target.id !== 'notif-btn' && !e.target.closest('#notif-btn')) {
                    this.closeNotificationPanel();
                }
            });
        }, 0);
    },

    closeNotificationPanel() {
        const panel = document.getElementById('notif-panel');
        if (panel) panel.remove();
        if (this._notifOutsideClick) {
            document.removeEventListener('click', this._notifOutsideClick);
            this._notifOutsideClick = null;
        }
    },

    // ─── Profile Panel ────────────────────────────────────────────────────
    toggleProfilePanel() {
        if (document.getElementById('profile-panel')) {
            this.closeProfilePanel();
        } else {
            this.closeNotificationPanel();
            this.showProfilePanel();
        }
    },

    showProfilePanel() {
        const role = this.state.role || 'admin';
        const fullName = localStorage.getItem('crisis_craft_user') || this.state.profiles[role]?.name || 'User';
        const email = this.state.profiles[role]?.email || '';
        const title = this.state.profiles[role]?.title || '';
        const avatar = this.state.profiles[role]?.avatar || 'Felix';
        const standard = this.state.profiles[role]?.standard || '';
        const section = this.state.profiles[role]?.section || '';
        const roleColors = { admin: 'var(--cyan)', teacher: 'var(--indigo)', student: 'var(--purple)' };
        const roleIcons = { admin: 'fa-user-shield', teacher: 'fa-chalkboard-teacher', student: 'fa-user-graduate' };
        const color = roleColors[role];

        const btnEl = document.getElementById('profile-btn');
        const rect = btnEl ? btnEl.getBoundingClientRect() : { right: 60, bottom: 80 };

        const panel = document.createElement('div');
        panel.id = 'profile-panel';
        panel.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 10}px;
            right: ${window.innerWidth - rect.right}px;
            width: 280px;
            border-radius: 16px;
            border: 1px solid ${color}30;
            background: linear-gradient(135deg, rgba(12,20,50,0.98) 0%, rgba(18,28,62,0.98) 100%);
            box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${color}0d;
            z-index: 5000;
            overflow: hidden;
            animation: slideDown 0.2s ease;
        `;

        const menuItems = [
            { icon: 'fa-th-large', label: 'Dashboard', action: `App.closeProfilePanel(); App.changeSection('Dashboard');` },
            { icon: 'fa-cog', label: 'Settings', action: `App.closeProfilePanel(); App.changeSection('Settings');` },
        ];

        panel.innerHTML = `
            <!-- Profile Header -->
            <div style="padding:22px 20px 18px; border-bottom:1px solid rgba(255,255,255,0.07); background: linear-gradient(135deg, ${color}10, transparent);">
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:52px; height:52px; border-radius:14px; overflow:hidden; border:2px solid ${color}40; flex-shrink:0;">
                        <img src="${this.getAvatar(avatar)}" alt="avatar" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div style="flex:1; min-width:0;">
                        <p style="font-weight:700; color:white; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fullName}</p>
                        <p style="font-size:0.75rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">${email}</p>
                        <div style="display:inline-flex; align-items:center; gap:5px; background:${color}15; padding:3px 9px; border-radius:8px; margin-top:6px;">
                            <i class="fas ${roleIcons[role]}" style="color:${color}; font-size:0.7rem;"></i>
                            <span style="color:${color}; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">${role}</span>
                        </div>
                        ${(role === 'teacher' && standard) ? `<div style="margin-top:6px;"><span style="font-size:0.75rem; color:var(--text-secondary);"><i class="fas fa-graduation-cap" style="margin-right:5px; color:${color};"></i>Standard: ${standard}${section ? ' | Section: ' + section : ''}</span></div>` : ''}
                    </div>
                </div>
                ${title ? `<p style="font-size:0.75rem; color:var(--text-secondary); margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">${title}</p>` : ''}
            </div>

            <!-- Menu Items -->
            <div style="padding:8px 0;">
                ${menuItems.map(item => `
                    <button onclick="${item.action}" style="width:100%; display:flex; align-items:center; gap:12px; padding:11px 20px; background:none; border:none; color:rgba(255,255,255,0.8); font-size:0.87rem; cursor:pointer; text-align:left; transition:0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.color='white';" onmouseout="this.style.background='none'; this.style.color='rgba(255,255,255,0.8)';">
                        <i class="fas ${item.icon}" style="width:18px; color:${color}; opacity:0.8;"></i>
                        ${item.label}
                    </button>
                `).join('')}
            </div>

            <!-- Divider -->
            <div style="height:1px; background:rgba(255,255,255,0.07);"></div>

            <!-- Logout -->
            <div style="padding:8px 0 10px;">
                <button onclick="App.closeProfilePanel(); App.logout();" style="width:100%; display:flex; align-items:center; gap:12px; padding:11px 20px; background:none; border:none; color:rgba(239,68,68,0.85); font-size:0.87rem; cursor:pointer; text-align:left; transition:0.15s;" onmouseover="this.style.background='rgba(239,68,68,0.08)'; this.style.color='var(--red)';" onmouseout="this.style.background='none'; this.style.color='rgba(239,68,68,0.85)';">
                    <i class="fas fa-sign-out-alt" style="width:18px;"></i>
                    Sign Out
                </button>
            </div>
        `;

        document.body.appendChild(panel);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', this._profileOutsideClick = (e) => {
                if (!panel.contains(e.target) && e.target.id !== 'profile-btn' && !e.target.closest('#profile-btn')) {
                    this.closeProfilePanel();
                }
            });
        }, 0);
    },

    async showReviewQuizModal(quizId) {
        try {
            const quiz = await getQuiz(quizId);
            const results = this.state.quizResults || [];
            const result = results.find(r => (r.quizId?._id || r.quizId) === quizId);
            if (!quiz || !result) return this.showToast('Review data not available', 'error');

            const modal = document.createElement('div');
            modal.id = 'reviewQuizModal';
            modal.style.cssText = `position:fixed; inset:0; background:rgba(5,10,30,0.85); backdrop-filter:blur(15px); display:flex; justify-content:center; align-items:center; z-index:5000; padding:20px;`;

            modal.innerHTML = `
                <div class="glass" style="padding:45px; width:750px; max-height:90vh; overflow-y:auto; border-radius:28px; border:1px solid rgba(0,245,255,0.3); background: linear-gradient(135deg, rgba(15,20,45,0.98) 0%, rgba(10,10,30,0.98) 100%);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:35px;">
                        <div>
                            <h2 style="color:white; margin-bottom:5px;">Assessment Review</h2>
                            <p style="color:var(--cyan); font-size:0.9rem; font-weight:bold;">${quiz.title}</p>
                        </div>
                        <button class="btn" style="width:auto; padding:10px 25px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);" onclick="document.getElementById('reviewQuizModal').remove()">Close Review</button>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:40px;">
                        <div class="glass" style="padding:20px; text-align:center; border:1px solid rgba(255,255,255,0.05);">
                            <p style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:5px;">FINAL SCORE</p>
                            <p style="font-size:1.8rem; font-weight:800; color:white;">${result.score} <span style="font-size:1rem; color:var(--text-secondary);">/ ${result.totalMarks}</span></p>
                        </div>
                        <div class="glass" style="padding:20px; text-align:center; border:1px solid rgba(255,255,255,0.05);">
                            <p style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:5px;">READINESS LEVEL</p>
                            <p style="font-size:1.8rem; font-weight:800; color:var(--cyan);">${result.readinessScore}%</p>
                        </div>
                    </div>

                    <div style="display:grid; gap:25px;">
                        ${quiz.questionsList.map((q, qIdx) => {
                const studentAns = result.answers.find(a => a.questionIndex === qIdx);
                const isCorrect = studentAns ? studentAns.isCorrect : false;

                return `
                                <div style="padding:30px; border-radius:20px; background:rgba(255,255,255,0.02); border:1px solid ${isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}; position:relative; overflow:hidden;">
                                    <div style="position:absolute; top:0; left:0; width:6px; height:100%; background:${isCorrect ? '#22c55e' : '#ef4444'};"></div>
                                    <p style="font-size:1.1rem; font-weight:700; margin-bottom:20px; color:white;">
                                        <span style="color:${isCorrect ? '#22c55e' : '#ef4444'}; margin-right:10px;">Q${qIdx + 1}.</span>${q.text}
                                    </p>
                                    <div style="display:grid; gap:12px;">
                                        ${q.options.map((opt, optIdx) => {
                    const isSelected = studentAns && studentAns.selectedOption === optIdx;
                    const isActualCorrect = optIdx === q.correct;

                    let border = '1px solid rgba(255,255,255,0.05)';
                    let bg = 'rgba(255,255,255,0.02)';
                    let badge = '';

                    if (isActualCorrect) {
                        border = '1px solid #22c55e';
                        bg = 'rgba(34,197,94,0.1)';
                        badge = '<span style="margin-left:auto; color:#22c55e; font-size:0.75rem; font-weight:bold;"><i class="fas fa-check-circle"></i> CORRECT ANSWER</span>';
                    } else if (isSelected && !isCorrect) {
                        border = '1px solid #ef4444';
                        bg = 'rgba(239,68,68,0.1)';
                        badge = '<span style="margin-left:auto; color:#ef4444; font-size:0.75rem; font-weight:bold;"><i class="fas fa-times-circle"></i> YOUR ANSWER</span>';
                    } else if (isSelected && isCorrect) {
                        badge = '<span style="margin-left:auto; color:#22c55e; font-size:0.75rem; font-weight:bold;"><i class="fas fa-user-check"></i> YOUR CHOICE</span>';
                    }

                    return `
                                                <div style="display:flex; align-items:center; padding:15px 20px; border-radius:12px; background:${bg}; border:${border}; color:rgba(255,255,255,0.8); font-size:0.95rem;">
                                                    <span style="margin-right:15px; width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:bold;">${String.fromCharCode(65 + optIdx)}</span>
                                                    ${opt}
                                                    ${badge}
                                                </div>
                                            `;
                }).join('')}
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Review load error:', error);
            this.showToast('Could not load review data', 'error');
        }
    },

    showBadgeCelebration(badge) {
        // Remove existing celebration if any
        const old = document.getElementById('badge-celebration');
        if (old) old.remove();

        const celebration = document.createElement('div');
        celebration.id = 'badge-celebration';
        celebration.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(5,10,30,0.9);
            backdrop-filter: blur(15px);
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            animation: fadeIn 0.4s ease;
        `;

        celebration.innerHTML = `
            <canvas id="confetti-canvas" style="position:absolute; inset:0; pointer-events:none;"></canvas>
            <div style="
                background: linear-gradient(135deg, rgba(20,25,60,0.98) 0%, rgba(10,10,30,0.98) 100%);
                padding: 60px; border-radius: 40px; border: 2px solid var(--cyan);
                text-align: center; max-width: 500px; width: 90%; position: relative;
                box-shadow: 0 0 100px rgba(0,245,255,0.2);
                animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            ">
                <div style="width: 120px; height: 120px; background: rgba(0,245,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: var(--cyan); margin: 0 auto 30px; border: 4px solid var(--cyan); box-shadow: 0 0 40px rgba(0,245,255,0.3);">
                    <i class="fas ${badge.badgeIcon || 'fa-medal'}"></i>
                </div>
                <h1 style="color:white; margin-bottom:10px; font-size:2.5rem; letter-spacing: 2px;">CONGRATS!</h1>
                <h2 style="color:var(--cyan); margin-bottom:20px; font-size: 1.2rem; text-transform: uppercase;">New Badge Unlocked</h2>
                <div style="background:rgba(255,255,255,0.05); padding:25px; border-radius:20px; border:1px solid rgba(255,255,255,0.05); margin-bottom:35px;">
                    <h3 style="color:white; margin-bottom:10px; font-size: 1.4rem;">${badge.name}</h3>
                    <p style="color:var(--text-secondary); font-size:1rem; line-height: 1.5;">${badge.description}</p>
                </div>
                <button class="btn btn-primary" style="width:100%; padding:18px; font-weight:bold; font-size:1.1rem; background: var(--cyan); color: black;" onclick="document.getElementById('badge-celebration').remove()">AWESOME!</button>
            </div>
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            </style>
        `;

        document.body.appendChild(celebration);
        this.runConfetti();
    },

    runConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#00F5FF', '#8B5CF6', '#FFFFFF', '#4F46E5', '#F59E0B'];

        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 5 + 3,
                angle: Math.random() * 360,
                rotation: Math.random() * 10 - 5
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                p.y += p.speed;
                p.angle += p.rotation;
                if (p.y > canvas.height) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });
            if (document.getElementById('badge-celebration')) requestAnimationFrame(animate);
        };
        animate();
    },

    closeProfilePanel() {
        const panel = document.getElementById('profile-panel');
        if (panel) panel.remove();
        if (this._profileOutsideClick) {
            document.removeEventListener('click', this._profileOutsideClick);
            this._profileOutsideClick = null;
        }
    },

};

// Inject slideDown animation
const _styleEl = document.createElement('style');
_styleEl.textContent = `@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`;
document.head.appendChild(_styleEl);

document.addEventListener('DOMContentLoaded', () => App.init());
