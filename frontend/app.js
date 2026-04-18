const App = {
    state: {
        role: null,
        activeSection: 'Dashboard',
        isLoggedIn: false,
        profiles: {
            admin: { name: 'Sarah Connor', email: 'admin@crisiscraft.edu', title: 'System Administrator', avatar: 'Felix' },
            teacher: { name: 'Diana Prince', email: 'teacher@crisiscraft.edu', title: 'Emergency Response Teacher', avatar: 'Aneka' },
            student: { name: 'Kavya Menon', email: 'student@crisiscraft.edu', title: 'Student, Grade 10B', avatar: 'Aneka' }
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
        }
    },

    init() {
        this.loadState();
        this.render();
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
        const passVal = document.getElementById('login-pass').value.trim();
        const errorEl = document.getElementById('login-error');

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
            const response = await fetch('http://localhost:5000/api/modules', {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const modules = await response.json();
                console.log('✅ Modules loaded:', modules);
                // Format modules to match UI expectations
                this.state.uploadedModules = modules.map(m => ({
                    ...m,
                    students: m.students || 0,
                    completion: m.completion || 0,
                    status: m.status || 'Not Started'
                }));
            } else {
                console.error('❌ Failed to load modules');
                this.state.uploadedModules = [];
            }
        } catch (error) {
            console.error('❌ Error loading modules:', error);
            this.state.uploadedModules = [];
        }
    },

    changeSection(section) {
        this.state.activeSection = section;
        // Load modules when switching to relevant sections
        if ((section === 'Upload Modules' || section === 'Learning Modules')) {
            this.state.isLoadingModules = true;
            this.render();
            this.loadModules().then(() => {
                this.state.isLoadingModules = false;
                this.render();
            }).catch(() => {
                this.state.isLoadingModules = false;
                this.render();
            });
        } else {
            this.render();
        }
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
        return `
            <div class="login-container">
                <div class="glass login-card">
                    ${this.getLogo('large', true)}
                    <p style="color: var(--text-secondary); margin-bottom: 40px;">Empowering Preparedness Through Education</p>
                <div class="input-group">
                    <label>Email</label>
                    <input type="text" id="login-user" class="input-style" placeholder="Enter your email">
                </div>
                <div class="input-group">
                    <label>Password</label>
                    <input type="password" id="login-pass" class="input-style" placeholder="••••••••">
                </div>
                <div id="login-error" style="display:none; color:var(--red); background:rgba(239, 68, 68, 0.1); padding:10px; border-radius:8px; font-size:0.85rem; margin-bottom:20px; border:1px solid rgba(239, 68, 68, 0.2);"></div>
                
                <button onclick="App.submitLogin()" class="btn btn-primary" style="margin-top: 10px;">Login Now</button>
                </div>
            </div>
        `;
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

        return `
            <header style="display: flex; justify-content: flex-end; align-items: center; gap: 20px; margin-bottom: 40px; padding: 0 20px;">
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(0, 245, 255, 0.05); padding: 8px 15px; border-radius: 20px; border: 1px solid var(--glass-border);">
                    <div style="width: 8px; height: 8px; background: var(--cyan); border-radius: 50%; box-shadow: 0 0 10px var(--cyan);"></div>
                    <span style="font-size: 0.85rem; color: var(--cyan); font-weight: 600;">System Status: Active</span>
                </div>
                <div style="margin-right: auto; margin-left: 20px;">
                    <h2 style="font-size: 1.2rem; color: white;">Welcome back, <span style="color: var(--cyan);">${fullName}</span></h2>
                </div>
                <div class="glass" style="width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; border-radius: 12px; position: relative; cursor: pointer;">
                    <i class="fas fa-bell"></i>
                    <div style="position: absolute; top: 12px; right: 12px; width: 6px; height: 6px; background: var(--red); border-radius: 50%;"></div>
                </div>
                <div class="glass" style="width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; border-radius: 12px; overflow: hidden;">
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
                                    <input id="profileTitle" type="text" class="input-style" value="${p.title}" style="padding:10px 14px;">
                                </div>
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

        if (nameInput) this.state.profiles[this.state.role].name = nameInput.value.trim();
        if (emailInput) this.state.profiles[this.state.role].email = emailInput.value.trim();
        if (titleInput) this.state.profiles[this.state.role].title = titleInput.value.trim();

        this.showToast('Profile updated!', 'success');
        this.render();
    },

    exportCSV(type) {
        let csv = '', filename = '';
        
        // These would need backend API implementation
        this.showToast('CSV export requires backend API integration', 'error');
        
        // TODO: Replace with API calls to:
        // - GET /api/admin/users (for roster)
        // - GET /api/quizzes (for grades)
        // - GET /api/drills (for drill report)
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
            <div style="background: rgba(239, 68, 68, 0.2); border-left: 4px solid var(--red); padding: 15px 20px; margin-bottom: 20px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <i class="fas fa-solid fa-bullhorn pulse" style="color: var(--red);"></i>
                    <span style="color: white; font-weight: 500;">SYSTEM BROADCAST: ${alert}</span>
                </div>
                <i class="fas fa-times" style="color: var(--text-secondary); cursor: pointer;" onclick="App.dismissAlert(${index})"></i>
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

        this.showToast('Broadcast sent successfully', 'success');
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
        if (section === 'Reports & Analytics') {
            return `
            <div style="display: grid; gap: 30px;">
                <div class="glass" style="padding: 40px; max-width: 900px;">
                    <h2 style="margin-bottom: 30px;">Platform Usage Analytics</h2>
                    <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 15px;"><canvas id="reportsChart"></canvas></div>
                </div>
                <div class="glass" style="padding: 40px; max-width: 900px;">
                    <h2 style="margin-bottom: 25px;">Student Drill Activity Reports</h2>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="color: var(--text-secondary); border-bottom: 1px solid var(--glass-border);">
                                <th style="padding: 15px 0;">DRILL NAME</th><th style="padding: 15px 0;">PARTICIPATION</th><th style="padding: 15px 0;">AVG SCORE</th><th style="padding: 15px 0;">STATUS</th><th style="padding: 15px 0;">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${CrisisData.drills.map(drill => `
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 15px 0; font-weight: 500;">${drill.title}</td>
                                    <td style="padding: 15px 0; color: var(--cyan);">${drill.participation}%</td>
                                    <td style="padding: 15px 0; color: ${drill.score > 85 ? '#22c55e' : '#eab308'};">${drill.score}%</td>
                                    <td style="padding: 15px 0;">
                                        <span style="background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px; font-size: 0.8rem;">${drill.status}</span>
                                    </td>
                                    <td style="padding: 15px 0;">
                                        <button class="btn" onclick="App.exportCSV('drill')" style="padding: 5px 15px; font-size: 0.8rem; height: auto; background: rgba(0, 245, 255, 0.1); color: var(--cyan); border: 1px solid rgba(0, 245, 255, 0.3);"><i class="fas fa-download" style="margin-right:6px;"></i>Export Report</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        }
        if (section === 'Emergency Alerts') return this.getAlertPanel();
        return `<h2>${section}</h2>`;
    },

    getAdminOverview() {
        // TODO: Replace with API calls to GET /api/statistics (admin stats)
        return `
            <div class="glass" style="padding: 40px; text-align: center;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                    <i class="fas fa-database" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.5;"></i>
                    <div>
                        <h3 style="margin-bottom: 8px;">Admin Dashboard</h3>
                        <p style="color: var(--text-secondary);">Loading admin statistics from API...</p>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 15px;">
                            <i class="fas fa-code" style="margin-right: 8px;"></i>
                            Requires: GET /api/statistics
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    getManageUsers() {
        // TODO: Replace with API call to GET /api/admin/users
        return `
            <div class="glass" style="padding: 40px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h3>Manage Users</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">Loading users from API...</p>
                    </div>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" onclick="App.showToast('Requires: POST /api/admin/users', 'error')">+ Add User</button>
                </div>
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">
                        <i class="fas fa-code" style="margin-right: 8px;"></i>
                        Requires: GET /api/admin/users
                    </p>
                </div>
            </div>
        `;
    },

    getManageDrills() {
        // TODO: Replace with API call to GET /api/admin/drills or GET /api/drills
        return `
            <div class="glass" style="padding: 40px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h3>Manage Virtual Drills</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">Loading drills from API...</p>
                    </div>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" onclick="App.showToast('Requires: POST /api/admin/drills', 'error')">+ Schedule Drill</button>
                </div>
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-vr-cardboard" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">
                        <i class="fas fa-code" style="margin-right: 8px;"></i>
                        Requires: GET /api/admin/drills
                    </p>
                </div>
            </div>
        `;
    },

    getAlertPanel() {
        return `
            <div class="glass pulse" style="padding: 30px; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05);">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle" style="color: var(--red); font-size: 1.5rem;"></i>
                    <h3>Emergency Broadcast Panel</h3>
                </div>
                <div style="display: flex; gap: 20px; align-items: flex-end;">
                    <input type="text" id="alertInput" class="input-style" style="flex: 1;" placeholder="Type emergency alert message here...">
                    <button class="btn" style="background: var(--red); color: white; width: 140px;" onclick="App.sendAlert()">Send Broadcast</button>
                </div>
            </div>
        `;
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
        // Load modules from state (populated by loadModules)
        const mods = this.state.uploadedModules || [];
        const isLoading = this.state.isLoadingModules;

        return `
            <div style="display:grid; gap:25px;">
                <div class="glass" style="padding:35px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <div>
                            <h3 style="margin-bottom:5px;">Upload New Module</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem;">Upload PDF files for disaster preparedness training</p>
                        </div>
                    </div>
                    <div id="dropZone" onclick="document.getElementById('pdfInput').click()"
                         style="padding:50px; border:2px dashed rgba(0,245,255,0.3); border-radius:15px; text-align:center; cursor:pointer; transition:0.3s; background:rgba(0,245,255,0.02);"
                         onmouseover="this.style.borderColor='var(--cyan)'; this.style.background='rgba(0,245,255,0.06)'"
                         onmouseout="this.style.borderColor='rgba(0,245,255,0.3)'; this.style.background='rgba(0,245,255,0.02)'">
                        <i class="fas fa-file-pdf" style="font-size:3rem; color:var(--cyan); margin-bottom:15px; display:block;"></i>
                        <p style="font-size:1.1rem; margin-bottom:8px;">Click to select or drag & drop PDF files</p>
                        <p style="color:var(--text-secondary); font-size:0.82rem;">Supported: PDF up to 50 MB</p>
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
                            <button class="btn btn-primary" style="width:auto; padding:12px 30px;" onclick="App.postModule(); return false;">
                                <i class="fas fa-upload" style="margin-right:8px;"></i>Post Module
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
                                    <div style="display:flex; align-items:center; gap:15px; flex:1;">
                                        <div style="width:40px; height:40px; border-radius:10px; background:rgba(239,68,68,0.1); display:flex; align-items:center; justify-content:center;">
                                            <i class="fas fa-file-pdf" style="color:#ef4444;"></i>
                                        </div>
                                        <div style="flex:1;">
                                            <p style="font-weight:500; margin-bottom:3px;">${m.title}</p>
                                            <div style="display:flex; gap:15px; font-size:0.8rem; color:var(--text-secondary);">
                                                <span><i class="fas fa-file" style="margin-right:4px;"></i>${m.fileName}</span>
                                                <span><i class="fas fa-calendar" style="margin-right:4px;"></i>${new Date(m.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="display:flex; gap:10px; align-items:center;">
                                        <i class="fas fa-trash" style="color:var(--red); cursor:pointer; opacity:0.6; transition:0.2s; font-size:0.85rem;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" onclick="App.removeModule('${m._id}')"></i>
                                    </div>
                                </div>
                            `).join('')}
                        `}
                    </div>
                </div>
            </div>`;
    },
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
    },

    clearFileSelection() {
        document.getElementById('pdfInput').value = '';
        document.getElementById('selectedFileInfo').style.display = 'none';
    },

    async postModule() {
        const title = document.getElementById('moduleTitle')?.value.trim();
        const file = document.getElementById('pdfInput')?.files[0];
        if (!title) { this.showToast('Please enter a module title', 'error'); return; }
        if (!file) { this.showToast('Please select a PDF file', 'error'); return; }
        
        console.log('🚀 postModule triggered');
        console.log('Title:', title);
        console.log('File:', file.name);
        console.log('Sending fetch to http://localhost:5000/api/modules');
        
        try {
            const response = await fetch('http://localhost:5000/api/modules', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    title: title,
                    fileName: file.name
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

    removeModule(moduleId) {
        if (!confirm('Remove this module?')) return;
        // Remove from state
        if (this.state.uploadedModules) {
            this.state.uploadedModules = this.state.uploadedModules.filter(m => m._id !== moduleId);
        }
        this.showToast('Module removed', 'success');
        this.render();
    },

    // --- Manage Quizzes ---
    getManageQuizzes() {
        // TODO: Replace with API call to GET /api/quizzes
        return `
            <div class="glass" style="padding:40px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                    <div>
                        <h3 style="margin-bottom:5px;">Manage Quizzes</h3>
                        <p style="color:var(--text-secondary); font-size:0.85rem;">Loading quizzes from API...</p>
                    </div>
                    <button class="btn btn-primary" style="width:auto; padding:10px 22px;" onclick="App.showToast('Requires: POST /api/quizzes', 'error')">
                        <i class="fas fa-plus" style="margin-right:8px;"></i>Create Quiz
                    </button>
                </div>
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-question-circle" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">
                        <i class="fas fa-code" style="margin-right: 8px;"></i>
                        Requires: GET /api/quizzes
                    </p>
                </div>
            </div>`;
    },

    toggleQuizStatus(index) {
        if (!this.state.quizStatuses) this.state.quizStatuses = CrisisData.quizzes.map(() => 'Active');
        this.state.quizStatuses[index] = this.state.quizStatuses[index] === 'Active' ? 'Draft' : 'Active';
        const quiz = CrisisData.quizzes[index];
        this.showToast(`"${quiz.title}" set to ${this.state.quizStatuses[index]}`, 'success');
        this.render();
    },

    deleteQuiz(index) {
        if (!confirm('Delete this quiz permanently?')) return;
        const title = CrisisData.quizzes[index].title;
        CrisisData.quizzes.splice(index, 1);
        if (this.state.quizStatuses) this.state.quizStatuses.splice(index, 1);
        this.showToast(`"${title}" deleted`, 'success');
        this.render();
    },

    // --- Drill Participation ---
    getDrillParticipation() {
        return `
            <div class="glass" style="padding:35px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                    <div>
                        <h3 style="margin-bottom:5px;">Drill Participation Overview</h3>
                        <p style="color:var(--text-secondary); font-size:0.85rem;">Track your class's performance across all drills</p>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <div class="glass" style="padding:10px 18px; text-align:center; border:1px solid rgba(0,245,255,0.2);">
                            <p style="font-size:0.75rem; color:var(--text-secondary);">Avg Participation</p>
                            <p style="font-size:1.2rem; font-weight:700; color:var(--cyan);">${Math.round(CrisisData.drills.reduce((a, d) => a + d.participation, 0) / CrisisData.drills.length)}%</p>
                        </div>
                        <div class="glass" style="padding:10px 18px; text-align:center; border:1px solid rgba(139,92,246,0.2);">
                            <p style="font-size:0.75rem; color:var(--text-secondary);">Avg Score</p>
                            <p style="font-size:1.2rem; font-weight:700; color:var(--purple);">${Math.round(CrisisData.drills.reduce((a, d) => a + d.score, 0) / CrisisData.drills.length)}%</p>
                        </div>
                    </div>
                </div>
                <div style="display:grid; gap:15px;">
                    ${CrisisData.drills.map((drill, index) => {
            const isCompleted = drill.status === 'Completed';
            const isUpcoming = drill.status === 'Registered';
            const borderColor = isCompleted ? 'rgba(34,197,94,0.25)' : isUpcoming ? 'rgba(0,245,255,0.25)' : 'rgba(255,255,255,0.05)';
            const statusColor = isCompleted ? '#22c55e' : isUpcoming ? 'var(--cyan)' : 'var(--text-secondary)';
            const statusBg = isCompleted ? 'rgba(34,197,94,0.1)' : isUpcoming ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.05)';
            const statusLabel = isUpcoming ? 'Upcoming' : drill.status;
            const studentsJoined = isCompleted ? Math.round(154 * drill.participation / 100) : 0;
            return `
                        <div class="glass" style="padding:22px; border:1px solid ${borderColor}; transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                                <div>
                                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                                        <h4 style="font-size:1.05rem;">${drill.title}</h4>
                                        <span style="background:${statusBg}; padding:3px 10px; border-radius:10px; font-size:0.72rem; font-weight:600; color:${statusColor};">${statusLabel}</span>
                                    </div>
                                    <p style="font-size:0.82rem; color:var(--text-secondary);"><i class="fas fa-calendar-alt" style="margin-right:5px;"></i>${drill.date}</p>
                                </div>
                                ${isCompleted ? `<div style="text-align:right;">
                                    <p style="font-size:0.75rem; color:var(--text-secondary);">Class Score</p>
                                    <p style="font-size:1.3rem; font-weight:700; color:${drill.score >= 85 ? '#22c55e' : '#eab308'};">${drill.score}%</p>
                                </div>` : ''}
                            </div>
                            <div style="display:flex; gap:25px; font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;">
                                ${isCompleted ? `
                                    <span><i class="fas fa-user-check" style="margin-right:5px; color:#22c55e;"></i>${studentsJoined} / 154 students attended</span>
                                    <span><i class="fas fa-percentage" style="margin-right:5px; color:var(--cyan);"></i>${drill.participation}% participation</span>
                                ` : `
                                    <span><i class="fas fa-user-clock" style="margin-right:5px; color:var(--cyan);"></i>154 students enrolled</span>
                                    <span><i class="fas fa-hourglass-half" style="margin-right:5px; color:var(--cyan);"></i>Starts ${drill.date}</span>
                                `}
                            </div>
                            ${isCompleted ? `
                                <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
                                    <div style="width:${drill.participation}%; height:100%; background:linear-gradient(90deg, #22c55e, var(--cyan)); border-radius:3px; transition:width 0.5s;"></div>
                                </div>
                            ` : `
                                <div style="display:flex; gap:8px; margin-top:5px;">
                                    <button class="btn" style="background:rgba(0,245,255,0.1); color:var(--cyan); border:1px solid rgba(0,245,255,0.3); width:auto; padding:8px 16px; font-size:0.8rem;" onclick="App.sendDrillReminder(${index})">
                                        <i class="fas fa-bell" style="margin-right:6px;"></i>Send Reminder
                                    </button>
                                    <button class="btn" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); width:auto; padding:8px 16px; font-size:0.8rem; color:white;" onclick="App.viewDrillDetails(${index})">
                                        <i class="fas fa-eye" style="margin-right:6px;"></i>View Details
                                    </button>
                                </div>
                            `}
                        </div>`;
        }).join('')}
                </div>
            </div>`;
    },


    getTeacherOverview() {
        const stats = CrisisData.statistics.teacher;
        const modules = this.state.uploadedModules || [];
        return `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                ${this.renderStatCard("Students Assigned", stats.studentsAssigned, "fa-users", "var(--cyan)")}
                ${this.renderStatCard("Modules Uploaded", modules.length, "fa-book", "var(--indigo)")}
                ${this.renderStatCard("Active Quizzes", stats.activeQuizzes, "fa-pen-nib", "var(--purple)")}
                ${this.renderStatCard("Average Score", stats.averageScore + "%", "fa-graduation-cap", "var(--cyan)")}
            </div>
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px;">
                <div class="glass" style="padding: 30px;">
                    <h3 style="margin-bottom:20px;">Module Progress</h3>
                    ${modules.map(mod => `
                        <div style="margin-bottom:15px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>${mod.title}</span><span style="color:var(--cyan);">${mod.completion || 0}%</span></div>
                            <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;"><div style="width:${mod.completion || 0}%; height:100%; background:var(--cyan);"></div></div>
                        </div>
                    `).join('')}
                </div>
                <div class="glass" style="padding: 30px;"><h3>Student Highlights</h3>${this.getStudentPerformanceTable()}</div>
            </div>
        `;
    },

    getStudentPerformanceTable() {
        const students = CrisisData.users.filter(u => u.role === 'Student');
        const displayStudents = students.slice(0, 12);

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
                    ${displayStudents.map(s => {
            const modAvg = Math.floor(Math.random() * 30) + 70;
            const quizScore = Math.floor(Math.random() * 5) + 15;
            const drillReady = Math.floor(Math.random() * 40) + 60;
            const scoreColor = quizScore >= 18 ? '#22c55e' : quizScore >= 15 ? 'var(--cyan)' : '#ef4444';
            const readyColor = drillReady >= 90 ? '#22c55e' : drillReady >= 75 ? 'var(--cyan)' : '#ef4444';

            return `
                        <tr style="border-bottom: 1px solid var(--glass-border);">
                            <td style="padding: 10px 0;">${s.u_name.fname} ${s.u_name.lname}</td>
                            <td style="padding: 10px 0;">${modAvg}%</td>
                            <td style="padding: 10px 0; color:${scoreColor}">${quizScore}/20</td>
                            <td style="padding: 10px 0; color:${readyColor}">${drillReady}%</td>
                        </tr>
                    `;
        }).join('')}
                </tbody>
            </table>
        `;
    },

    showEditQuizModal(index) {
        const quiz = CrisisData.quizzes[index];
        if (document.getElementById('quizModal')) return;
        const modal = document.createElement('div');
        modal.id = 'quizModal';
        modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 1000; overflow-y: auto; padding: 40px 0;`;

        const qList = quiz.questionsList || [];

        modal.innerHTML = `
            <div class="glass" style="padding: 35px; width: 600px; border-radius: 20px; max-height: 90vh; overflow-y: auto; margin: auto;">
                <h3 style="margin-bottom: 25px;">Edit Quiz: ${quiz.title}</h3>
                
                <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:15px; margin-bottom: 25px;">
                    <div class="input-group" style="margin-bottom:0;">
                        <label style="color:var(--text-secondary); font-size:0.8rem;">Quiz Title</label>
                        <input type="text" id="editQuizTitle" class="input-style" value="${quiz.title}">
                    </div>
                    <div class="input-group" style="margin-bottom:0;">
                        <label style="color:var(--text-secondary); font-size:0.8rem;">Questions</label>
                        <input type="number" id="editQuizQuestions" class="input-style" value="${quiz.questions || qList.length}">
                    </div>
                    <div class="input-group" style="margin-bottom:0;">
                        <label style="color:var(--text-secondary); font-size:0.8rem;">Time (min)</label>
                        <input type="number" id="editQuizTime" class="input-style" value="${quiz.timeLimit || 30}">
                    </div>
                </div>

                <div style="border-top: 1px solid var(--glass-border); padding-top: 20px; margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                        <h4 style="font-size:1.1rem;">Questions List</h4>
                        <button class="btn" style="width: auto; padding: 6px 15px; font-size: 0.8rem; background: rgba(0,245,255,0.1); color: var(--cyan); border: 1px solid var(--cyan);" onclick="App.addQuestionEntry()">+ Add Question</button>
                    </div>
                    <div id="questionsContainer" style="display:grid; gap:15px;">
                        ${this.renderQuestionEditor(qList)}
                    </div>
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid var(--glass-border); padding-top: 20px;">
                    <button class="btn" style="background: rgba(255,255,255,0.1); color: white; width: auto; padding: 12px 25px;" onclick="App.closeQuizModal()">Cancel</button>
                    <button class="btn btn-primary" style="width: auto; padding: 12px 25px;" onclick="App.submitEditQuiz(${index})">Save Changes</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    },

    showCreateQuizModal() {
        if (document.getElementById('quizModal')) return;
        const modal = document.createElement('div');
        modal.id = 'quizModal';
        modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 1000; overflow-y: auto; padding: 40px 0;`;

        modal.innerHTML = `
            <div class="glass" style="padding: 35px; width: 600px; border-radius: 20px; max-height: 90vh; overflow-y: auto; margin: auto;">
                <h3 style="margin-bottom: 25px;">Create New Quiz</h3>
                
                <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:15px; margin-bottom: 25px;">
                    <div class="input-group" style="margin-bottom:0;">
                        <label style="color:var(--text-secondary); font-size:0.8rem;">Quiz Title</label>
                        <input type="text" id="newQuizTitle" class="input-style" placeholder="e.g. Seismic Safety Level 1">
                    </div>
                    <div class="input-group" style="margin-bottom:0;">
                        <label style="color:var(--text-secondary); font-size:0.8rem;">Questions</label>
                        <input type="number" id="newQuizQuestions" class="input-style" value="10">
                    </div>
                    <div class="input-group" style="margin-bottom:0;">
                        <label style="color:var(--text-secondary); font-size:0.8rem;">Time (min)</label>
                        <input type="number" id="newQuizTime" class="input-style" value="20">
                    </div>
                </div>

                <div style="border-top: 1px solid var(--glass-border); padding-top: 20px; margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                        <h4 style="font-size:1.1rem;">Questions List</h4>
                        <button class="btn" style="width: auto; padding: 6px 15px; font-size: 0.8rem; background: rgba(0,245,255,0.1); color: var(--cyan); border: 1px solid var(--cyan);" onclick="App.addQuestionEntry()">+ Add Question</button>
                    </div>
                    <div id="questionsContainer" style="display:grid; gap:15px;">
                        ${this.renderQuestionEditor([{ text: '', options: ['', '', '', ''], correct: 0 }])}
                    </div>
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid var(--glass-border); padding-top: 20px;">
                    <button class="btn" style="background: rgba(255,255,255,0.1); color: white; width: auto; padding: 12px 25px;" onclick="App.closeQuizModal()">Cancel</button>
                    <button class="btn btn-primary" style="width: auto; padding: 12px 25px;" onclick="App.submitCreateQuiz()">Create Quiz</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    },

    renderQuestionEditor(questions) {
        return questions.map((q, i) => `
            <div class="question-entry" style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid var(--glass-border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <span style="color: var(--cyan); font-weight: bold; font-size: 0.9rem;">Question ${i + 1}</span>
                    <i class="fas fa-trash" style="color: var(--red); cursor: pointer; font-size: 0.8rem;" onclick="this.closest('.question-entry').remove()"></i>
                </div>
                <input type="text" class="input-style q-text" style="margin-bottom: 15px;" placeholder="Enter question text..." value="${q.text}">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${[0, 1, 2, 3].map(optIdx => `
                        <div style="display:flex; gap: 8px; align-items:center;">
                            <input type="radio" name="correct_${i}" ${q.correct === optIdx ? 'checked' : ''} class="q-correct" value="${optIdx}">
                            <input type="text" class="input-style q-opt" style="padding: 8px 12px; font-size: 0.85rem;" placeholder="Option ${optIdx + 1}" value="${q.options[optIdx] || ''}">
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
        div.style.cssText = 'background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid var(--glass-border);';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                <span style="color: var(--cyan); font-weight: bold; font-size: 0.9rem;">Question ${index + 1}</span>
                <i class="fas fa-trash" style="color: var(--red); cursor: pointer; font-size: 0.8rem;" onclick="this.closest('.question-entry').remove()"></i>
            </div>
            <input type="text" class="input-style q-text" style="margin-bottom: 15px;" placeholder="Enter question text..." value="">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                ${[0, 1, 2, 3].map(optIdx => `
                    <div style="display:flex; gap: 8px; align-items:center;">
                        <input type="radio" name="correct_${index}" ${optIdx === 0 ? 'checked' : ''} class="q-correct" value="${optIdx}">
                        <input type="text" class="input-style q-opt" style="padding: 8px 12px; font-size: 0.85rem;" placeholder="Option ${optIdx + 1}" value="">
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

    submitEditQuiz(index) {
        const title = document.getElementById('editQuizTitle').value.trim();
        const questionsList = this.scrapeQuestions();
        const timeLimit = parseInt(document.getElementById('editQuizTime').value);

        if (!title) return this.showToast('Please enter a title', 'error');

        CrisisData.quizzes[index].title = title;
        CrisisData.quizzes[index].questionsList = questionsList;
        CrisisData.quizzes[index].questions = questionsList.length;
        CrisisData.quizzes[index].timeLimit = timeLimit;

        this.closeQuizModal();
        this.showToast('Quiz updated successfully', 'success');
        this.render();
    },

    submitCreateQuiz() {
        const title = document.getElementById('newQuizTitle').value.trim();
        const questionsList = this.scrapeQuestions();
        const timeLimit = parseInt(document.getElementById('newQuizTime').value);

        if (!title) return this.showToast('Please enter a title', 'error');

        CrisisData.quizzes.push({
            title,
            averageScore: "N/A",
            studentScore: null,
            status: "Not Attempted",
            questions: questionsList.length,
            questionsList: questionsList,
            timeLimit
        });

        CrisisData.statistics.teacher.activeQuizzes = CrisisData.quizzes.length;
        this.closeQuizModal();
        this.showToast('Quiz created successfully', 'success');
        this.render();
    },

    closeQuizModal() {
        const m = document.getElementById('quizModal');
        if (m) m.remove();
    },

    viewDrillDetails(index) {
        const drill = CrisisData.drills[index];
        this.showToast(`Analytics: participation has increased by 5% for ${drill.title}`, 'success');
    },

    sendDrillReminder(index) {
        const drill = CrisisData.drills[index];
        const msg = `REMINDER: "${drill.title}" is scheduled for ${drill.date}. Please ensure you are prepared.`;
        this.sendAlert(msg);
        this.showToast(`Batch notification sent to ${CrisisData.statistics.teacher.studentsAssigned} students for "${drill.title}"`, 'success');
    },

    // --- STUDENT VIEWS ---
    renderStudentViews(section) {
        if (section === 'Dashboard') return this.getStudentOverview();

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
                        ${modules.map((m, i) => `
                            <div class="glass glass-card" style="padding:25px; border:1px solid rgba(0,245,255,0.15);">
                                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:15px;">
                                    <div style="width:45px; height:45px; border-radius:12px; background:rgba(0,245,255,0.1); display:flex; align-items:center; justify-content:center;">
                                        <i class="fas fa-book-open" style="color:var(--cyan); font-size:1.2rem;"></i>
                                    </div>
                                    <span style="font-size:0.8rem; font-weight:600; color:var(--cyan);">${m.fileName ? m.fileName.substring(0, 15) + '...' : 'Module'}</span>
                                </div>
                                <h4 style="margin-bottom:12px; line-height:1.4;">${m.title}</h4>
                                <p style="font-size:0.8rem; color: var(--text-secondary); margin-bottom: 15px;">
                                    <i class="fas fa-user" style="margin-right: 5px;"></i>
                                    By: ${m.createdBy?.name || 'Teacher'}
                                </p>
                                <button class="btn btn-primary" style="width:100%; padding:10px; font-size:0.85rem;" onclick="App.startModule('${m._id}')">
                                    View Module
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }
        }

        if (section === 'Virtual Drills') {
            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <div>
                            <h3 style="margin-bottom:5px;">Virtual Drills</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem;">Practice your response in simulated emergency scenarios</p>
                        </div>
                    </div>
                    <div style="display:grid; gap:15px;">
                        ${CrisisData.drills.map((d, i) => {
                const isUpcoming = d.status === 'Registered';
                return `
                                <div class="glass" style="padding:22px 30px; border:1px solid ${isUpcoming ? 'rgba(0,245,255,0.2)' : 'rgba(255,255,255,0.05)'}; display:flex; align-items:center; justify-content:space-between;">
                                    <div style="display:flex; align-items:center; gap:20px;">
                                        <div style="width:50px; height:50px; border-radius:50%; background:${isUpcoming ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.03)'}; display:flex; align-items:center; justify-content:center;">
                                            <i class="fas ${isUpcoming ? 'fa-vr-cardboard' : 'fa-history'}" style="color:${isUpcoming ? 'var(--cyan)' : 'var(--text-secondary)'};"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin-bottom:4px;">${d.title}</h4>
                                            <p style="font-size:0.85rem; color:${isUpcoming ? 'var(--cyan)' : 'var(--text-secondary)'};">
                                                <i class="fas fa-calendar-alt" style="margin-right:6px;"></i>${d.scheduled_date} ${isUpcoming ? '• UPCOMING' : '• COMPLETED'}
                                            </p>
                                        </div>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:25px;">
                                        ${!isUpcoming ? `<div style="text-align:right;"><p style="font-size:0.75rem; color:var(--text-secondary);">Score</p><p style="font-weight:700; color:#22c55e;">${d.score}%</p></div>` : ''}
                                        <button class="btn ${isUpcoming ? 'btn-primary' : ''}" style="width:auto; padding:10px 25px; font-size:0.85rem; background:${!isUpcoming ? 'rgba(255,255,255,0.05)' : ''};" onclick="App.interactDrill(${i})">
                                            ${isUpcoming ? 'Join Simulation' : 'Review Performance'}
                                        </button>
                                    </div>
                                </div>`;
            }).join('')}
                    </div>
                </div>`;
        }

        if (section === 'Quizzes') {
            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <div>
                            <h3 style="margin-bottom:5px;">Knowledge Assessments</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem;">Test your knowledge and earn points</p>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                        ${CrisisData.quizzes.map((q, i) => {
                const isDone = q.studentScore !== null;
                return `
                                <div class="glass glass-card" style="padding:25px; border:1px solid ${isDone ? 'rgba(139,92,246,0.2)' : 'rgba(0,245,255,0.15)'};">
                                    <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                                        <div style="width:40px; height:40px; border-radius:10px; background:rgba(139,92,246,0.1); display:flex; align-items:center; justify-content:center;">
                                            <i class="fas fa-pen-nib" style="color:var(--purple);"></i>
                                        </div>
                                        <span style="font-size:0.75rem; font-weight:700; color:${isDone ? 'var(--purple)' : 'var(--cyan)'}; background:${isDone ? 'rgba(139,92,246,0.1)' : 'rgba(0,245,255,0.1)'}; padding:4px 10px; border-radius:8px;">
                                            ${isDone ? 'SCORE: ' + q.studentScore : 'OPEN'}
                                        </span>
                                    </div>
                                    <h4 style="margin-bottom:15px; min-height:48px;">${q.title}</h4>
                                    <div style="display:flex; gap:15px; font-size:0.8rem; color:var(--text-secondary); margin-bottom:20px;">
                                        <span><i class="fas fa-clock" style="margin-right:5px;"></i>${q.timeLimit} min</span>
                                        <span><i class="fas fa-list" style="margin-right:5px;"></i>${q.questions} Questions</span>
                                    </div>
                                    <button class="btn ${isDone ? '' : 'btn-primary'}" style="width:100%; padding:10px; background:${isDone ? 'rgba(255,255,255,0.05)' : ''};" onclick="App.showTakeQuizModal(${i})">
                                        ${isDone ? 'Retake Quiz' : 'Start Assessment'}
                                    </button>
                                </div>`;
            }).join('')}
                    </div>
                </div>`;
        }

        if (section === 'Achievements') {
            const modsDone = CrisisData.modules.filter(m => m.studentProgress === 100).length;
            const topScore = CrisisData.quizzes.some(q => q.studentScore && q.studentScore.startsWith(q.questions.toString()));
            const drlDone = CrisisData.drills.filter(d => d.status === 'Completed').length;

            return `<div class="glass" style="padding: 40px;">
                <h3>Achievements & Badges</h3>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Earn badges by completing modules, scoring high in quizzes, and participating in drills.</p>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:20px;">
                    <div class="glass" style="padding:25px; text-align:center; border: 1px solid ${modsDone >= 5 ? 'rgba(0, 245, 255, 0.4)' : 'rgba(255,255,255,0.05)'}; background: ${modsDone >= 5 ? 'rgba(0, 245, 255, 0.05)' : 'transparent'}; opacity: ${modsDone >= 5 ? '1' : '0.5'};">
                        <i class="fas fa-shield-alt" style="font-size:2.8rem; color:${modsDone >= 5 ? 'var(--cyan)' : 'var(--text-secondary)'}; margin-bottom:15px;"></i>
                        <h4 style="margin-bottom:8px;">Safety Star</h4>
                        <span style="font-size:0.75rem; color: ${modsDone >= 5 ? '#22c55e' : 'var(--text-secondary)'}; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 12px;">${modsDone >= 5 ? 'EARNED' : 'LOCKED'}</span>
                        <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:12px;">Requirement: Complete all 5 Learning Modules (${modsDone}/5)</p>
                    </div>
                    <div class="glass" style="padding:25px; text-align:center; border: 1px solid ${topScore ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.05)'}; background: ${topScore ? 'rgba(139, 92, 246, 0.05)' : 'transparent'}; opacity: ${topScore ? '1' : '0.5'};">
                        <i class="fas fa-fire-extinguisher" style="font-size:2.8rem; color:${topScore ? 'var(--purple)' : 'var(--text-secondary)'}; margin-bottom:15px;"></i>
                        <h4 style="margin-bottom:8px;">Ace Responder</h4>
                        <span style="font-size:0.75rem; color: ${topScore ? '#22c55e' : 'var(--text-secondary)'}; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 12px;">${topScore ? 'EARNED' : 'LOCKED'}</span>
                        <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:12px;">Requirement: Score 100% in any Quiz</p>
                    </div>
                    <div class="glass" style="padding:25px; text-align:center; border: 1px solid ${drlDone >= 1 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.05)'}; background: ${drlDone >= 1 ? 'rgba(34, 197, 94, 0.05)' : 'transparent'}; opacity: ${drlDone >= 1 ? '1' : '0.5'};">
                        <i class="fas fa-heartbeat" style="font-size:2.8rem; color:${drlDone >= 1 ? '#22c55e' : 'var(--text-secondary)'}; margin-bottom:15px;"></i>
                        <h4 style="margin-bottom:8px;">Drill Pro</h4>
                        <span style="font-size:0.75rem; color: ${drlDone >= 1 ? '#22c55e' : 'var(--text-secondary)'}; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 12px;">${drlDone >= 1 ? 'EARNED' : 'LOCKED'}</span>
                        <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:12px;">Requirement: Complete a Virtual Drill (${drlDone} done)</p>
                    </div>
                </div>
            </div>`;
        }

        if (section === 'Leaderboard') return `<div class="glass" style="padding: 40px;"><h3>Leaderboard</h3><div style="margin-top:20px;">${CrisisData.leaderboard.map((u, i) => `<div style="display:flex; justify-content:space-between; padding:15px 20px; background:${u.isUser ? 'rgba(0, 245, 255, 0.1)' : 'rgba(255,255,255,0.02)'}; border-radius:12px; margin-bottom:8px; border:${u.isUser ? '1px solid var(--cyan)' : '1px solid transparent'};"><span style="font-size:1.1rem; color:${i < 3 ? 'var(--cyan)' : 'inherit'};"><strong style="display:inline-block; width:30px;">#${i + 1}</strong> ${u.name}</span><span style="font-weight:bold; color:var(--cyan);">${u.score} pts</span></div>`).join('')}</div></div>`;
        return `<h2>${section}</h2>`;
    },

    getStudentOverview() {
        const stats = CrisisData.statistics.student;
        const student = CrisisData.users.find(u => u.role === 'Student' && u.user_id === 'U003');
        const inst = CrisisData.institutions.find(i => i.i_id === student.i_id);
        return `
            <div class="glass" style="padding: 20px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid var(--cyan);">
                 <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(0,245,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--cyan); border: 2px solid rgba(0,245,255,0.2);">
                        <i class="fas fa-university"></i>
                    </div>
                    <div>
                        <h4 style="font-size: 1.1rem; margin-bottom: 4px;">${inst.i_name}</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            <i class="fas fa-map-marker-alt" style="margin-right: 8px;"></i>${inst.location.city}, ${inst.location.state}
                        </p>
                    </div>
                 </div>
                 <div style="text-align: right;">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">ENROLLED SINCE</p>
                    <p style="font-weight: 700; color: var(--cyan);">SEPT 2025</p>
                 </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                ${this.renderStatCard("Modules Done", stats.modulesCompleted + "/" + stats.totalModules, "fa-check-circle", "var(--cyan)")}
                ${this.renderStatCard("Next Drill", stats.upcomingDrillDate, "fa-calendar-alt", "var(--indigo)")}
                ${this.renderStatCard("Quiz Average", stats.averageQuizScore + "%", "fa-pen-alt", "var(--purple)")}
                ${this.renderStatCard("Total Points", stats.totalPoints, "fa-fire", "var(--cyan)")}
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:25px;">
                <div class="glass" style="padding: 30px;">
                    <h3>Progress</h3>
                    ${CrisisData.modules.slice(0, 2).map(m => `<div style="margin-top:15px;"><span>${m.title}</span><div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; margin-top:5px; overflow:hidden;"><div style="width:${m.studentProgress}%; height:100%; background:var(--indigo);"></div></div></div>`).join('')}
                </div>
                <div class="glass" style="padding: 30px; background: linear-gradient(135deg, rgba(0, 245, 255, 0.05), transparent);">
                    <h3>Next Virtual Drill</h3>
                    <p style="margin-top: 15px; color: var(--text-secondary);">${CrisisData.drills.find(d => d.status === 'Registered')?.title || 'No upcoming drills'}</p>
                    <p style="color: var(--cyan); font-size:0.9rem; margin-top:5px;">${CrisisData.drills.find(d => d.status === 'Registered')?.scheduled_date || ''}</p>
                    <div id="drill-countdown" style="font-size: 1.5rem; font-weight: 700; color: var(--cyan); margin-top:10px;">--:--:--</div>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 30px; margin-top: 20px;" onclick="App.interactDrill(App.findNextDrillIndex())">Enter</button>
                </div>
            </div>
        `;
    },

    removeUser(index) {
        if (CrisisData.users[index].role === 'Admin') {
            this.showToast('Admins cannot be removed for security.', 'error');
            return;
        }
        if (confirm('Are you sure you want to remove this user?')) {
            CrisisData.users.splice(index, 1);
            this.saveState();
            this.render();
        }
    },

    showAddUserModal() {
        if (document.getElementById('addUserModal')) return;
        const modal = document.createElement('div');
        modal.id = 'addUserModal';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
            display: flex; justify-content: center; align-items: center; z-index: 1000;
        `;
        modal.innerHTML = `
            <div class="glass" style="padding: 30px; width: 400px; border-radius: 15px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <h3 style="margin-bottom: 20px; color: white;">Add New User</h3>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="color: var(--text-secondary); margin-bottom: 8px; display: block;">Full Name</label>
                    <input type="text" id="newUserName" class="input-style" placeholder="e.g. John Doe">
                </div>
                <div class="input-group" style="margin-bottom: 25px;">
                    <label style="color: var(--text-secondary); margin-bottom: 8px; display: block;">System Role</label>
                    <select id="newUserRole" class="input-style" style="background: rgba(15, 23, 42, 0.9); color: white;">
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn" style="background: rgba(255,255,255,0.05); width: auto; padding: 10px 20px; border: 1px solid var(--glass-border);" onclick="App.closeAddUserModal()">Cancel</button>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" onclick="App.submitAddUser()">Add User</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeAddUserModal() {
        const modal = document.getElementById('addUserModal');
        if (modal) modal.remove();
    },

    submitAddUser() {
        const nameInput = document.getElementById('newUserName');
        const roleInput = document.getElementById('newUserRole');
        const name = nameInput.value.trim();
        if (!name) {
            nameInput.style.border = '1px solid var(--red)';
            return;
        }
        CrisisData.users.push({
            user_id: "U" + (CrisisData.users.length + 1).toString().padStart(3, '0'),
            u_name: { fname: name.split(' ')[0], mname: "", lname: name.split(' ')[1] || "" },
            role: roleInput.value,
            status: 'Active',
            i_id: CrisisData.institutions[0].i_id,
            score: 0,
            password: 'password123'
        });
        this.closeAddUserModal();
        this.saveState();
        this.render();
    },

    removeDrill(index) {
        if (confirm('Are you sure you want to delete this virtual drill?')) {
            CrisisData.drills.splice(index, 1);
            this.saveState();
            this.render();
        }
    },

    showAddDrillModal() {
        if (document.getElementById('addDrillModal')) return;
        const modal = document.createElement('div');
        modal.id = 'addDrillModal';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
            display: flex; justify-content: center; align-items: center; z-index: 1000;
        `;
        modal.innerHTML = `
            <div class="glass" style="padding: 30px; width: 450px; border-radius: 15px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                <h3 style="margin-bottom: 20px; color: white;">Schedule New Virtual Drill</h3>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="color: var(--text-secondary); margin-bottom: 8px; display: block;">Drill Title</label>
                    <input type="text" id="newDrillTitle" class="input-style" placeholder="e.g. Earthquake Simulation 2026">
                </div>
                <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                    <div class="input-group" style="flex: 1;">
                        <label style="color: var(--text-secondary); margin-bottom: 8px; display: block;">Date</label>
                        <input type="text" id="newDrillDate" class="input-style" placeholder="e.g. 12 May 2026">
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn" style="background: rgba(255,255,255,0.05); width: auto; padding: 10px 20px; border: 1px solid var(--glass-border);" onclick="App.closeAddDrillModal()">Cancel</button>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" onclick="App.submitAddDrill()">Schedule Drill</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeAddDrillModal() {
        const modal = document.getElementById('addDrillModal');
        if (modal) modal.remove();
    },

    submitAddDrill() {
        const titleInput = document.getElementById('newDrillTitle');
        const dateInput = document.getElementById('newDrillDate');
        const title = titleInput.value.trim();
        const date = dateInput.value.trim();
        if (!title) {
            titleInput.style.border = '1px solid var(--red)';
            return;
        }
        CrisisData.drills.push({
            title: title,
            participation: 0,
            score: 0,
            status: 'Registered',
            date: date || 'TBD'
        });
        this.closeAddDrillModal();
        this.saveState();
        this.render();
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

        const updateTimer = () => {
            const timerEl = document.getElementById('drill-countdown');
            if (!timerEl) {
                clearInterval(this.countdownInterval);
                return;
            }

            const nextDrill = CrisisData.drills.find(d => d.status === 'Registered');
            if (!nextDrill) {
                timerEl.textContent = "No Drills";
                return;
            }

            // Parse date "15 April 2026"
            const drillDate = new Date(nextDrill.scheduled_date + " 09:00:00"); // Assuming 9 AM start
            const now = new Date();
            const diff = drillDate - now;

            if (diff <= 0) {
                timerEl.textContent = "00:00:00";
                clearInterval(this.countdownInterval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            const parts = [];
            if (days > 0) parts.push(`${days} Days`);
            parts.push(hours.toString().padStart(2, '0'));
            parts.push(mins.toString().padStart(2, '0'));
            parts.push(secs.toString().padStart(2, '0'));

            timerEl.textContent = parts.join(':');
        };

        updateTimer();
        this.countdownInterval = setInterval(updateTimer, 1000);
    },

    // --- Student Interaction Methods ---
    startModule(index) {
        const mod = CrisisData.modules[index];
        this.showModuleViewer(index);

        if (mod.studentProgress < 100) {
            mod.studentProgress = Math.min(100, mod.studentProgress + 25);
            if (mod.studentProgress === 100) mod.status = 'Completed';
            else mod.status = 'In Progress';
            this.saveState();
            // We update state but don't re-render entire page to keep the modal open
        }
    },

    showModuleViewer(index) {
        const modules = this.state.uploadedModules || [];
        const mod = modules[index];
        
        if (!mod) {
            this.showToast('Module not found', 'error');
            return;
        }
        modal.id = 'moduleViewerModal';
        modal.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:2500; display:flex; justify-content:center; align-items:center; padding:20px;`;

        modal.innerHTML = `
            <div class="glass" style="width:800px; max-height:85vh; overflow-y:auto; padding:50px; position:relative; border:1px solid var(--cyan);">
                <button style="position:absolute; top:20px; right:20px; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;" onclick="document.getElementById('moduleViewerModal').remove(); App.render();">
                    <i class="fas fa-times"></i>
                </button>
                <div style="display:flex; align-items:center; gap:20px; margin-bottom:30px;">
                    <div style="width:60px; height:60px; background:rgba(0,245,255,0.1); border-radius:15px; display:flex; align-items:center; justify-content:center; color:var(--cyan); font-size:1.5rem;">
                        <i class="fas fa-book-reader"></i>
                    </div>
                    <div>
                        <h2 style="color:var(--cyan);">${mod.title}</h2>
                        <p style="color:var(--text-secondary); font-size:0.9rem;">Course Content • 10 min read</p>
                    </div>
                </div>
                <div class="module-body" style="line-height:1.8; color:rgba(255,255,255,0.9); font-size:1.05rem;">
                    <p style="margin-bottom:20px;">${mod.content || 'No content available for this module yet.'}</p>
                    <h3 style="margin:30px 0 15px; color:white;">Key Safety Protocol</h3>
                    <ul style="margin-left:20px; margin-bottom:30px;">
                        <li style="margin-bottom:10px;">Stay calm and alert everyone nearby.</li>
                        <li style="margin-bottom:10px;">Follow designated evacuation routes.</li>
                        <li style="margin-bottom:10px;">Assist others if possible without risking yourself.</li>
                        <li style="margin-bottom:10px;">Gather at the pre-determined meeting point.</li>
                    </ul>
                    <div class="glass" style="padding:20px; background:rgba(0,245,255,0.05); border-radius:12px; border:1px dashed var(--cyan);">
                        <p style="font-weight:600; color:var(--cyan);"><i class="fas fa-info-circle" style="margin-right:10px;"></i>Pro Tip</p>
                        <p style="font-size:0.9rem; margin-top:5px;">Always keep your emergency contact info updated in your profile settings. Knowledge is the first step to safety!</p>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
    },

    interactDrill(index) {
        if (index === -1) {
            this.showToast('No drills available right now.', 'info');
            return;
        }
        const drill = CrisisData.drills[index];
        if (drill.status === 'Registered') {
            this.showDrillSimulator(index);
        } else {
            this.showDrillReport(index);
        }
    },

    findNextDrillIndex() {
        return CrisisData.drills.findIndex(d => d.status === 'Registered');
    },

    showDrillSimulator(index) {
        const drill = CrisisData.drills[index];
        const modal = document.createElement('div');
        modal.id = 'drillSimulatorModal';
        modal.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.9); backdrop-filter:blur(20px); z-index:3000; display:flex; justify-content:center; align-items:center; padding:20px;`;

        let step = 1;
        const totalSteps = 3;

        const renderStep = (s) => {
            let stepHtml = '';
            if (s === 1) {
                stepHtml = `
                    <p style="font-size:1.2rem; margin-bottom:30px;">A sudden <strong>${drill.title}</strong> alert has been triggered. The alarms are blaring. What is your first reaction?</p>
                    <div style="display:grid; gap:15px;">
                        <button class="btn" style="background:rgba(255,255,255,0.05); text-align:left; padding:20px;" onclick="App.nextDrillStep(2, true)">
                            <span style="color:var(--cyan); font-weight:700; margin-right:15px;">A</span> Stay calm, identify the nearest exit route.
                        </button>
                        <button class="btn" style="background:rgba(255,255,255,0.05); text-align:left; padding:20px;" onclick="App.nextDrillStep(2, false)">
                            <span style="color:var(--cyan); font-weight:700; margin-right:15px;">B</span> Panicked, run towards the main lobby immediately.
                        </button>
                    </div>`;
            } else if (s === 2) {
                stepHtml = `
                    <p style="font-size:1.2rem; margin-bottom:30px;">You are at the stairwell exit. Smoke is visible at the bottom. What should you do?</p>
                    <div style="display:grid; gap:15px;">
                        <button class="btn" style="background:rgba(255,255,255,0.05); text-align:left; padding:20px;" onclick="App.nextDrillStep(3, true)">
                            <span style="color:var(--cyan); font-weight:700; margin-right:15px;">A</span> Cover your nose/mouth, stay low, and proceed carefully.
                        </button>
                        <button class="btn" style="background:rgba(255,255,255,0.05); text-align:left; padding:20px;" onclick="App.nextDrillStep(3, false)">
                            <span style="color:var(--cyan); font-weight:700; margin-right:15px;">B</span> Take the elevator instead to avoid the smoke.
                        </button>
                    </div>`;
            } else {
                stepHtml = `
                    <div style="text-align:center; padding:20px;">
                        <i class="fas fa-check-circle" style="font-size:4rem; color:#22c55e; margin-bottom:20px;"></i>
                        <h2 style="margin-bottom:15px;">Simulation Complete!</h2>
                        <p style="color:var(--text-secondary); margin-bottom:30px;">You have successfully navigated the ${drill.title}. Your performance data is being processed.</p>
                        <button class="btn btn-primary" style="width:auto; padding:12px 40px;" onclick="App.completeDrillSimulation(${index})">Finish Drill</button>
                    </div>`;
            }

            modal.innerHTML = `
                <div class="glass" style="width:650px; padding:50px; border:2px solid var(--cyan);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
                        <h3 style="color:var(--cyan);">${drill.title} Simulation</h3>
                        <span style="font-size:0.9rem; color:var(--text-secondary);">Step ${s} / ${totalSteps}</span>
                    </div>
                    <div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; margin-bottom:40px; overflow:hidden;">
                        <div style="width:${(s / totalSteps) * 100}%; height:100%; background:var(--cyan); transition:0.5s;"></div>
                    </div>
                    <div id="drillStepContent">${stepHtml}</div>
                </div>`;
        };

        this.nextDrillStep = (s, correct) => {
            if (!correct) this.showToast('Incorrect action! Safety logic suggests otherwise, but continuing simulator...', 'warning');
            else this.showToast('Good decision!', 'success');
            renderStep(s);
        };

        this.completeDrillSimulation = (idx) => {
            const d = CrisisData.drills[idx];
            d.status = 'Completed';
            d.score = 95; // Default winning score for simulator
            this.showToast('Drill data saved. View your report in the history section.', 'success');
            document.getElementById('drillSimulatorModal').remove();
            this.saveState();
            this.render();
        };

        document.body.appendChild(modal);
        renderStep(1);
    },

    showDrillReport(index) {
        const drill = CrisisData.drills[index];
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

    showTakeQuizModal(index) {
        const quiz = CrisisData.quizzes[index];
        const modal = document.createElement('div');
        modal.id = 'takeQuizModal';
        modal.className = 'glass';
        modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 20px;`;

        const questions = quiz.questionsList || [];

        modal.innerHTML = `
            <div class="glass" style="padding: 40px; width: 700px; max-height: 90vh; overflow-y: auto; position: relative; border: 1px solid var(--purple);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 30px;">
                    <h3 style="color:var(--purple);">${quiz.title}</h3>
                    <div style="background:rgba(139,92,246,0.1); padding:5px 15px; border-radius:10px; color:var(--purple); font-weight:bold;">
                        <i class="fas fa-clock" style="margin-right:8px;"></i>${quiz.timeLimit}:00
                    </div>
                </div>
                <div id="studentQuestions">
                    ${questions.map((q, qIdx) => `
                        <div style="margin-bottom:35px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 25px;">
                            <p style="font-size:1.1rem; font-weight:600; margin-bottom:20px;">${qIdx + 1}. ${q.text}</p>
                            <div style="display:grid; gap:12px;">
                                ${q.options.map((opt, optIdx) => `
                                    <label style="display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; cursor:pointer; border: 1px solid transparent; transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                                        <input type="radio" name="student_q_${qIdx}" value="${optIdx}" style="accent-color:var(--purple); width:18px; height:18px;">
                                        <span style="font-size:0.95rem;">${opt}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 30px;">
                    <button class="btn" style="background: rgba(255,255,255,0.1); width: auto; padding: 12px 30px;" onclick="document.getElementById('takeQuizModal').remove()">Cancel</button>
                    <button class="btn btn-primary" style="width: auto; padding: 12px 40px; background:linear-gradient(135deg, var(--purple), var(--indigo));" onclick="App.submitStudentQuiz(${index})">Submit Assessment</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    },

    submitStudentQuiz(index) {
        const quiz = CrisisData.quizzes[index];
        const questions = quiz.questionsList || [];
        let score = 0;

        questions.forEach((q, qIdx) => {
            const selected = document.querySelector(`input[name="student_q_${qIdx}"]:checked`);
            if (selected && parseInt(selected.value) === q.correct) {
                score++;
            }
        });

        const finalScoreLabel = `${score}/${questions.length}`;
        quiz.studentScore = finalScoreLabel;
        quiz.status = 'Completed';

        // Update global stats
        const allStudentScores = CrisisData.quizzes.filter(q => q.studentScore).map(q => {
            const parts = q.studentScore.split('/');
            return (parseInt(parts[0]) / parseInt(parts[1])) * 100;
        });

        if (allStudentScores.length > 0) {
            CrisisData.statistics.student.averageQuizScore = Math.round(allStudentScores.reduce((a, b) => a + b, 0) / allStudentScores.length);
        }

        CrisisData.statistics.student.totalPoints += (score * 10);

        document.getElementById('takeQuizModal').remove();
        this.showToast(`Quiz Submitted! You scored ${finalScoreLabel}`, 'success');
        this.saveState();
        this.render();
    },

};

document.addEventListener('DOMContentLoaded', () => App.init());
