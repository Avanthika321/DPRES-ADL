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
        },
        moduleProgressState: {
            sort: 'progress_desc',
            filter: 'all'
        }
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
                    // Token is valid, auto-login user
                    this.state.role = role;
                    this.state.isLoggedIn = true;
                    this.state.activeSection = 'Dashboard';
                    this.state.isLoadingModules = false;
                    // Load modules for the user
                    await this.loadModules();
                    if (role === 'teacher') {
                        this.state.studentPerfState = { data: null, isLoading: true, error: null, search: '', sort: 'name', filter: 'All' };
                        this.render();
                        try {
                            await this.loadStudentPerformance();
                        } catch (e) {
                            this.state.studentPerfState.error = e.message;
                        }
                        this.state.studentPerfState.isLoading = false;
                    }
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
        // Always reset login state — checkAutoLogin() will re-establish it
        this.state.isLoggedIn = false;
        this.state.role = null;
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
                <span class="logo-text" style="font-size: ${fontSize}; font-weight: 700; color: white; letter-spacing: -1px;">Crisis<span style="color: var(--cyan);">Craft</span></span>
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

        if (role === 'teacher') {
            this.state.studentPerfState = { data: null, isLoading: true, error: null, search: '', sort: 'name', filter: 'All' };
            this.render();
            try {
                await this.loadStudentPerformance();
            } catch (e) {
                this.state.studentPerfState.error = e.message;
            }
            this.state.studentPerfState.isLoading = false;
        }

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

            // Load the list of permanently deleted module IDs
            const deletedIds = JSON.parse(localStorage.getItem('cc_deleted_modules') || '[]');

            if (response.ok) {
                const modules = await response.json();
                console.log('✅ Modules loaded:', modules);
                // Preserve any locally uploaded modules (blob URLs) from this session
                const localMods = (this.state.uploadedModules || []).filter(m => m.fileUrl && m.fileUrl.startsWith('blob:'));
                this.state.uploadedModules = [
                    ...localMods,
                    ...modules
                        .filter(m => !deletedIds.includes(m._id || m.id))
                        .map(m => ({
                            ...m,
                            students: m.students || 0,
                            completion: m.completion || 0,
                            status: m.status || 'Not Started'
                        }))
                ];
            } else {
                // Backend unavailable — keep any locally uploaded files, don't inject fake data
                console.warn('⚠️ Backend unavailable, keeping local uploads only');
                if (!this.state.uploadedModules) {
                    this.state.uploadedModules = [];
                } else {
                    // Only keep blob-URL modules not in the deleted list
                    this.state.uploadedModules = this.state.uploadedModules.filter(
                        m => m.fileUrl && m.fileUrl.startsWith('blob:') && !deletedIds.includes(m._id || m.id)
                    );
                }
            }
        } catch (error) {
            console.error('❌ Error loading modules:', error);
            const deletedIds = JSON.parse(localStorage.getItem('cc_deleted_modules') || '[]');
            if (!this.state.uploadedModules) {
                this.state.uploadedModules = [];
            } else {
                this.state.uploadedModules = this.state.uploadedModules.filter(
                    m => m.fileUrl && m.fileUrl.startsWith('blob:') && !deletedIds.includes(m._id || m.id)
                );
            }
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
        } else if (section === 'Student Performance' || (section === 'Dashboard' && this.state.role === 'teacher')) {
            this.state.studentPerfState = this.state.studentPerfState || {
                data: null, isLoading: true, error: null, search: '', sort: 'name', filter: 'All'
            };

            if (!this.state.studentPerfState.data) {
                this.state.studentPerfState.isLoading = true;
                this.render();
                this.loadStudentPerformance().then(() => {
                    this.state.studentPerfState.isLoading = false;
                    this.render();
                }).catch(e => {
                    this.state.studentPerfState.isLoading = false;
                    this.state.studentPerfState.error = e.message;
                    this.render();
                });
            } else {
                this.render();
            }
        } else if (section === 'Manage Quizzes') {
            this.state.manageQuizState = this.state.manageQuizState || {
                data: null, isLoading: true, error: null, search: '', filter: 'All', selectedQuizzes: []
            };

            if (!this.state.manageQuizState.data) {
                this.state.manageQuizState.isLoading = true;
                this.render();
                this.loadQuizzes().then(() => {
                    this.state.manageQuizState.isLoading = false;
                    this.render();
                }).catch(e => {
                    this.state.manageQuizState.isLoading = false;
                    this.state.manageQuizState.error = e.message;
                    this.render();
                });
            } else {
                this.render();
            }
        } else if (section === 'Drill Participation') {
            this.state.drillPartState = this.state.drillPartState || {
                data: null, isLoading: true, error: null, search: '', filter: 'All'
            };

            if (!this.state.drillPartState.data) {
                this.state.drillPartState.isLoading = true;
                this.render();
                this.loadDrillParticipation().then(() => {
                    this.state.drillPartState.isLoading = false;
                    this.render();
                }).catch(e => {
                    this.state.drillPartState.isLoading = false;
                    this.state.drillPartState.error = e.message;
                    this.render();
                });
            } else {
                this.render();
            }
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
        // Apply Global settings classes
        document.documentElement.classList.toggle('disable-animations', !this.state.settings.animations);

        const root = document.getElementById('app-root');
        if (!this.state.isLoggedIn) {
            root.innerHTML = this.renderLogin();
        } else {
            // Check for Maintenance Mode
            if (this.state.settings.maint && this.state.role !== 'admin') {
                root.innerHTML = `
                    <div class="login-container">
                        <div class="glass" style="max-width:500px; padding:60px; text-align:center;">
                            <i class="fas fa-tools" style="font-size:4rem; color:var(--cyan); margin-bottom:25px; display:block;"></i>
                            <h2 style="margin-bottom:15px;">Under Maintenance</h2>
                            <p style="color:var(--text-secondary); line-height:1.6; margin-bottom:30px;">CrisisCraft is currently undergoing scheduled updates to improve your safety training experience. Please check back later.</p>
                            <button class="btn" onclick="location.reload()" style="background:rgba(255,255,255,0.05); color:white;">Try Again</button>
                        </div>
                    </div>
                `;
                return;
            }

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
            if (this.state.role === 'teacher' && this.state.activeSection === 'Manage Quizzes') {
                // Chart removed as requested
            }
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
                
                ${this.state.settings.reg ? `
                    <div style="margin-top:30px; padding-top:20px; border-top:1px solid var(--glass-border);">
                        <p style="color:var(--text-secondary); font-size:0.9rem;">Don't have an account?</p>
                        <button class="btn" style="background:transparent; color:var(--cyan); padding:10px;" onclick="App.showToast('Registration is open! Contact your admin to get started.', 'info')">Create Account</button>
                    </div>
                ` : ''}
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

        const isCompact = this.state.settings.compactView;
        return `
            <aside class="glass sidebar ${isCompact ? 'compact' : ''}">
                ${this.getLogo('medium')}
                <nav style="flex: 1;">
                    ${menuItems[activeRole].map((item) => {
            const isActive = activeSection === item.label;
            return `
                            <div onclick="App.changeSection('${item.label}')" style="display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 12px; cursor: pointer; color: ${isActive ? 'var(--cyan)' : 'var(--text-secondary)'}; background: ${isActive ? 'rgba(0, 245, 255, 0.05)' : 'transparent'}; margin-bottom: 5px;" class="nav-item">
                                <i class="fas ${item.icon}" style="width: 20px;"></i>
                                <span class="nav-label">${item.label}</span>
                            </div>
                        `;
        }).join('')}
                    <div onclick="App.changeSection('Settings')" style="display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 12px; cursor: pointer; color: ${activeSection === 'Settings' ? 'var(--cyan)' : 'var(--text-secondary)'}; background: ${activeSection === 'Settings' ? 'rgba(0, 245, 255, 0.05)' : 'transparent'}; margin-bottom: 5px;" class="nav-item">
                        <i class="fas fa-cog" style="width: 20px;"></i>
                        <span class="nav-label">Settings</span>
                    </div>
                </nav>
                <div onclick="App.logout()" style="display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 12px; cursor: pointer; color: var(--red); margin-top: auto;" class="logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span class="logout-text">Logout</span>
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
                <div class="glass" style="width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; border-radius: 12px; position: relative; cursor: pointer;" onclick="App.showNotifications()">
                    <i class="fas fa-bell"></i>
                    <div style="position: absolute; top: 12px; right: 12px; width: 6px; height: 6px; background: var(--red); border-radius: 50%;"></div>
                </div>
                <div class="glass" style="width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; border-radius: 12px; overflow: hidden; cursor: pointer; position: relative;" onclick="App.showProfileMenu()">
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

        // Prevent double-animation by checking if the section actually changed
        const isNewSection = this.state.lastRenderedSection !== section;
        this.state.lastRenderedSection = section;
        const animationClass = isNewSection ? 'smooth-entry' : '';

        return `
            <div key="${section}" class="${animationClass}">
                ${this.renderActiveAlerts()}
                ${content}
            </div>
        `;
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
            <div style="max-width: 850px; margin: 0 auto;">
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
                                <div style="grid-column: span 2;">
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
                <div class="glass" style="padding:30px; margin-bottom:20px;">
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

        // Immediate visual response for specific settings
        if (id === 'compactView') {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.toggle('compact', checked);
        }
        if (id === 'animations') {
            document.documentElement.classList.toggle('disable-animations', !checked);
        }
        if (id === 'hideNames') {
            this.render();
        }

        this.saveState();
        // Structural changes like compactView benefit from a refresh of the layout
        if (id === 'compactView') this.render();
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
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-code" style="font-size: 2rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">
                            Requires: GET /api/drills/reports
                        </p>
                    </div>
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
        // Sample teacher data with classes
        const teachers = [
            { name: "Jane Smith", email: "jane.smith@crisiscraft.edu", class: "Grade 10B - Emergency Response", students: 28 },
            { name: "Samuel Jackson", email: "s.jackson@riverside.edu", class: "Grade 11A - Advanced Safety", students: 32 },
            { name: "Dr. Maria Rodriguez", email: "maria.rodriguez@crisiscraft.edu", class: "Grade 10A - Emergency Response", students: 26 },
            { name: "Prof. James Wilson", email: "james.wilson@crisiscraft.edu", class: "Grade 11B - Disaster Management", students: 29 },
            { name: "Ms. Lisa Chen", email: "lisa.chen@crisiscraft.edu", class: "Grade 9C - Safety Education", students: 31 }
        ];

        return `
            <div class="glass" style="padding: 40px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h3>Manage Teachers & Classes</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">${teachers.length} active teachers managing classes</p>
                    </div>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" onclick="App.showToast('Requires: POST /api/admin/users', 'error')">+ Add Teacher</button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
                    ${teachers.map(teacher => `
                        <div class="glass glass-card" style="padding: 25px; border: 1px solid rgba(0,245,255,0.15);">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(0,245,255,0.1); display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-chalkboard-teacher" style="color: var(--cyan); font-size: 1.3rem;"></i>
                                </div>
                                <span style="font-size: 0.8rem; font-weight: 600; color: var(--cyan);">${teacher.students} students</span>
                            </div>
                            <h4 style="margin-bottom: 8px; line-height: 1.3;">${teacher.name}</h4>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">${teacher.class}</p>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 15px;">${teacher.email}</p>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn" style="flex: 1; padding: 8px; font-size: 0.8rem;" onclick="App.showToast('View ${teacher.name}\'s class', 'info')">
                                    <i class="fas fa-eye"></i> View Class
                                </button>
                                <button class="btn" style="background: rgba(239,68,68,0.1); color: var(--red); padding: 8px 12px; font-size: 0.8rem;" onclick="App.showToast('Remove teacher', 'error')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
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
                                <div class="glass" style="padding:18px 22px; display:flex; align-items:center; justify-content:space-between; border:1px solid rgba(0,245,255,0.15); transition: transform 0.3s ease, box-shadow 0.3s ease;">
                                    <div style="display:flex; align-items:center; gap:15px; flex:1;">
                                        <div style="width:40px; height:40px; border-radius:10px; background:rgba(239,68,68,0.1); display:flex; align-items:center; justify-content:center;">
                                            <i class="fas fa-file-pdf" style="color:#ef4444;"></i>
                                        </div>
                                        <div style="flex:1;">
                                            <p style="font-weight:500; margin-bottom:3px;">${m.title}</p>
                                            <div style="display:flex; gap:15px; font-size:0.8rem; color:var(--text-secondary);">
                                                <span><i class="fas fa-file" style="margin-right:4px;"></i>${m.fileName}</span>
                                                <span><i class="fas fa-calendar" style="margin-right:4px;"></i>${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="display:flex; gap:12px; align-items:center;">
                                        <button class="btn" style="padding: 6px 12px; font-size: 0.75rem; width: auto; background: rgba(0, 245, 255, 0.1); color: var(--cyan); border: 1px solid rgba(0, 245, 255, 0.2);" onclick="App.showModuleViewer('${m._id || m.id}')">View</button>
                                        <i class="fas fa-trash" style="color:var(--red); cursor:pointer; opacity:0.6; transition:0.2s; font-size:0.85rem;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" onclick="App.removeModule('${m._id || m.id}')"></i>
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
        const info = document.getElementById('selectedFileInfo');
        info.style.display = 'block';
        info.style.opacity = '0';
        info.style.transform = 'translateY(10px)';
        info.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

        setTimeout(() => {
            info.style.opacity = '1';
            info.style.transform = 'translateY(0)';
        }, 10);

        document.getElementById('selectedFileName').textContent = file.name;
        document.getElementById('selectedFileSize').textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        document.getElementById('moduleTitle').value = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');
    },

    clearFileSelection() {
        const info = document.getElementById('selectedFileInfo');
        info.style.opacity = '0';
        info.style.transform = 'translateY(10px)';
        setTimeout(() => {
            info.style.display = 'none';
            document.getElementById('pdfInput').value = '';
        }, 500);
    },

    async postModule() {
        const title = document.getElementById('moduleTitle')?.value.trim();
        const file = document.getElementById('pdfInput')?.files[0];
        if (!title) { this.showToast('Please enter a module title', 'error'); return; }
        if (!file) { this.showToast('Please select a PDF file', 'error'); return; }

        // Create the blob URL immediately from the local file — this is ALWAYS the source of truth
        const fileUrl = URL.createObjectURL(file);

        try {
            const response = await fetch('http://localhost:5000/api/modules', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ title, fileName: file.name })
            });

            if (response.ok) {
                const data = await response.json();
                // Attach the blob URL to the module returned by the backend
                const newModule = {
                    ...data,
                    fileUrl: fileUrl,
                    fileName: file.name
                };
                this.state.uploadedModules = [newModule, ...(this.state.uploadedModules || [])];
                this.showToast(`"${title}" posted successfully!`, 'success');
                this.clearFileSelection();
                this.render();
            } else {
                throw new Error('Backend unavailable');
            }
        } catch (error) {
            console.warn('Backend offline — saving module locally with blob URL');
            const newModule = {
                _id: 'm' + Date.now(),
                title: title,
                fileName: file.name,
                fileUrl: fileUrl,
                createdAt: new Date().toISOString()
            };
            this.state.uploadedModules = [newModule, ...(this.state.uploadedModules || [])];
            this.showToast(`"${title}" posted successfully!`, 'success');
            this.clearFileSelection();
            this.render();
        }
    },


    async removeModule(moduleId) {
        if (!confirm('Remove this module? This cannot be undone.')) return;

        const mod = (this.state.uploadedModules || []).find(m => (m._id || m.id) === moduleId);

        // Revoke blob URL to free memory
        if (mod && mod.fileUrl && mod.fileUrl.startsWith('blob:')) {
            URL.revokeObjectURL(mod.fileUrl);
        }

        // Remove from in-memory state immediately
        if (this.state.uploadedModules) {
            this.state.uploadedModules = this.state.uploadedModules.filter(m => (m._id || m.id) !== moduleId);
        }

        // Persist deleted ID to localStorage so it never comes back after re-fetch
        const deleted = JSON.parse(localStorage.getItem('cc_deleted_modules') || '[]');
        if (!deleted.includes(moduleId)) {
            deleted.push(moduleId);
            localStorage.setItem('cc_deleted_modules', JSON.stringify(deleted));
        }

        // Try to delete from backend too
        try {
            const response = await fetch(`http://localhost:5000/api/modules/${moduleId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                console.log('✅ Module deleted from backend:', moduleId);
            }
        } catch (e) {
            console.warn('Backend delete failed (offline), deletion saved locally:', e);
        }

        this.showToast('Module permanently deleted', 'success');
        this.render();
    },

    // --- Manage Quizzes ---
    getManageQuizzes() {
        const state = this.state.manageQuizState || { isLoading: false, data: [], error: null, search: '', filter: 'All' };

        if (state.isLoading) {
            return `
                <div style="text-align: center; padding: 40px;" class="glass">
                    <div style="width: 40px; height: 40px; border: 3px solid rgba(0, 245, 255, 0.2); border-top: 3px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                    <p style="color: var(--text-secondary);">Loading quizzes data...</p>
                </div>
            `;
        }

        if (state.error) {
            return `
                <div style="text-align: center; padding: 40px;" class="glass">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: var(--red); margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--red);">${state.error}</p>
                    <button class="btn btn-primary" style="margin-top: 15px; width: auto; padding: 8px 16px;" onclick="App.state.manageQuizState.data = null; App.changeSection('Manage Quizzes')">Retry</button>
                </div>
            `;
        }

        let data = state.data || [];

        // Apply search
        if (state.search) {
            data = data.filter(q => q.title.toLowerCase().includes(state.search.toLowerCase()));
        }

        // Apply filter
        if (state.filter !== 'All') {
            data = data.filter(q => q.status === state.filter);
        }

        const tableControls = `
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 25px;">
                <div>
                    <h3 style="margin-bottom: 5px;">Manage Quizzes</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">Create and manage quizzes for your modules</p>
                </div>
                <button class="btn btn-primary" style="width:auto; padding:10px 22px;" onclick="App.showCreateQuizModal()">
                    <i class="fas fa-plus" style="margin-right:8px;"></i>Create Quiz
                </button>
            </div>
            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid var(--glass-border);">
                <!-- Search & Filter Controls -->
                <div style="flex: 1; min-width: 200px; position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 12px; top: 12px; color: var(--text-secondary);"></i>
                    <input type="text" class="input-style" style="padding-left: 35px;" placeholder="Search quizzes by title..." value="${state.search}" oninput="App.updateQuizState('search', this.value)">
                </div>
                <div>
                    <select class="input-style" style="padding: 10px; width: auto; cursor: pointer;" onchange="App.updateQuizState('filter', this.value)">
                        <option value="All" ${state.filter === 'All' ? 'selected' : ''}>Status: All</option>
                        <option value="Published" ${state.filter === 'Published' ? 'selected' : ''}>Status: Published</option>
                        <option value="Draft" ${state.filter === 'Draft' ? 'selected' : ''}>Status: Draft</option>
                    </select>
                </div>
            </div>
        `;

        if (data.length === 0) {
            return `
                <div class="glass" style="padding: 40px;">
                    ${tableControls}
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-pen-nib" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                        <p style="color: var(--text-secondary);">No quizzes found matching criteria.</p>
                    </div>
                </div>
            `;
        }

        const rows = data.map((quiz) => {
            const isPublished = quiz.status === 'Published';
            const statusColor = isPublished ? 'var(--green)' : 'var(--text-secondary)';

            return `
                <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 15px 10px; color: white;">
                        <div style="font-weight: 500; margin-bottom: 4px;">${quiz.title}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);"><i class="fas fa-book" style="margin-right: 6px;"></i>${quiz.module}</div>
                    </td>
                    <td style="padding: 15px 10px;">
                        <span style="color: var(--text-secondary); font-size: 0.85rem;">${quiz.questions} Qs</span>
                    </td>
                    <td style="padding: 15px 10px; color: var(--text-secondary); font-size: 0.85rem;">
                        ${quiz.date}
                    </td>
                    <td style="padding: 15px 10px;">
                        <span style="color: ${statusColor}; font-size: 0.85rem; font-weight: 600; background: ${statusColor}20; padding: 4px 10px; border-radius: 12px; border: 1px solid ${statusColor}40;">
                            ${quiz.status}
                        </span>
                    </td>
                    <td style="padding: 15px 10px; text-align: right;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            ${isPublished ? `
                            <button class="btn" style="padding: 6px; font-size: 0.8rem; width: auto; background: rgba(0, 245, 255, 0.1); color: var(--cyan); border: 1px solid rgba(0, 245, 255, 0.3);" onclick="App.showQuizResultsModal('${quiz.id}')" title="View Submissions">
                                <i class="fas fa-list-check"></i>
                            </button>` : `<div style="width: 28px;"></div>`}
                            <button class="btn" style="padding: 6px; font-size: 0.8rem; width: auto; background: rgba(255,255,255,0.05); color: var(--text-secondary); border: 1px solid var(--glass-border);" onclick="App.toggleQuizStatus('${quiz.id}')" title="Toggle Status">
                                <i class="fas ${isPublished ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                            <button class="btn" style="padding: 6px; font-size: 0.8rem; width: auto; background: rgba(0, 245, 255, 0.1); color: var(--cyan); border: 1px solid rgba(0, 245, 255, 0.3);" onclick="App.showEditQuizModal('${quiz.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn" style="padding: 6px; font-size: 0.8rem; width: auto; background: rgba(239, 68, 68, 0.1); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.3);" onclick="App.deleteQuiz('${quiz.id}')" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div>
                <div class="glass" style="padding: 40px;">
                ${tableControls}
                <div style="overflow-x: auto; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid var(--glass-border);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
                        <thead>
                            <tr style="color: var(--text-secondary); border-bottom: 1px solid var(--glass-border); background: rgba(255,255,255,0.02);">
                                <th style="padding: 15px 10px; font-weight: 600;">QUIZ INFO</th>
                                <th style="padding: 15px 10px; font-weight: 600;">QUESTIONS</th>
                                <th style="padding: 15px 10px; font-weight: 600;">DATE CREATED</th>
                                <th style="padding: 15px 10px; font-weight: 600;">STATUS</th>
                                <th style="padding: 15px 10px; text-align: right; font-weight: 600;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        `;
    },

    updateQuizState(key, value) {
        if (!this.state.manageQuizState) return;
        this.state.manageQuizState[key] = value;
        this.render();

        if (key === 'search') {
            setTimeout(() => {
                const searchInput = document.querySelector('input[placeholder="Search quizzes by title..."]');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
                }
            }, 0);
        }
    },

    async loadQuizzes() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const mockData = [
                    { id: 'q1', title: "Earthquake Preparedness", module: "Natural Disasters", questions: 1, date: "Oct 15, 2023", status: "Published", questionsData: [{ text: "What to do during an earthquake?", options: ["Run outside", "Drop, Cover, Hold on", "Hide in a closet", "Use elevator"], correct: 1 }] },
                    { id: 'q2', title: "Fire Safety Protocol", module: "Fire Safety 101", questions: 1, date: "Nov 08, 2023", status: "Published", questionsData: [{ text: "Which fire extinguisher for electrical fires?", options: ["Water", "Foam", "CO2", "Wet Chemical"], correct: 2 }] },
                    { id: 'q3', title: "Flood Response Training", module: "Natural Disasters", questions: 1, date: "Dec 12, 2023", status: "Published", questionsData: [{ text: "What to do if driving through flood waters?", options: ["Speed up", "Turn around, don't drown", "Honk horn", "Open windows"], correct: 1 }] },
                    { id: 'q4', title: "Hurricane Survival Guide", module: "Natural Disasters", questions: 1, date: "Jan 05, 2024", status: "Draft", questionsData: [{ text: "What should be in an emergency hurricane kit?", options: ["Video games", "Water, food, flashlight", "Jewelry", "Extra clothes only"], correct: 1 }] },
                    { id: 'q5', title: "Tornado Safety Essentials", module: "Tornado Response", questions: 1, date: "Feb 20, 2024", status: "Draft", questionsData: [{ text: "Best place to hide during a tornado?", options: ["Window", "Basement/Interior room", "Car", "Top floor"], correct: 1 }] },
                    { id: 'q6', title: "Chemical Spill Management", module: "Hazardous Materials", questions: 1, date: "Mar 10, 2024", status: "Draft", questionsData: [{ text: "First step in a chemical spill?", options: ["Touch it", "Smell it", "Evacuate & Isolate", "Clean it with water"], correct: 2 }] },
                    { id: 'q7', title: "First Aid Basics", module: "Emergency Care", questions: 1, date: "Apr 02, 2024", status: "Published", questionsData: [{ text: "Correct ratio of chest compressions in CPR?", options: ["10:1", "30:2", "50:5", "15:2"], correct: 1 }] }
                ];
                this.state.manageQuizState.data = mockData;
                resolve();
            }, 1000);
        });
    },

    toggleQuizStatus(quizId) {
        if (!this.state.manageQuizState || !this.state.manageQuizState.data) return;

        const quiz = this.state.manageQuizState.data.find(q => q.id === quizId);
        if (quiz) {
            if (quiz.status === 'Published') {
                this.showToast('Published quizzes cannot be reverted to Draft status', 'info');
                return;
            }
            quiz.status = 'Published';
            quiz.date = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            this.showToast(`Quiz '${quiz.title}' is now Published`, 'success');
            this.render();
        }
    },

    deleteQuiz(quizId) {
        if (!this.state.manageQuizState || !this.state.manageQuizState.data) return;

        const quiz = this.state.manageQuizState.data.find(q => q.id === quizId);
        if (!quiz) return;

        if (!confirm(`Are you sure you want to delete the quiz "${quiz.title}"?`)) return;

        this.state.manageQuizState.data = this.state.manageQuizState.data.filter(q => q.id !== quizId);
        this.showToast('Quiz deleted successfully', 'success');
        this.render();
    },

    toggleQuizSelection(quizId) {
        if (!this.state.manageQuizState) return;
        const state = this.state.manageQuizState;
        if (!state.selectedQuizzes) state.selectedQuizzes = [];

        if (state.selectedQuizzes.includes(quizId)) {
            state.selectedQuizzes = state.selectedQuizzes.filter(id => id !== quizId);
        } else {
            state.selectedQuizzes.push(quizId);
        }
        this.render();
    },

    toggleAllQuizSelection() {
        if (!this.state.manageQuizState || !this.state.manageQuizState.data) return;
        const state = this.state.manageQuizState;
        if (!state.selectedQuizzes) state.selectedQuizzes = [];

        const data = state.data;
        let visibleData = data;
        if (state.filter !== 'All') {
            visibleData = data.filter(q => q.status === state.filter);
        }

        if (state.selectedQuizzes.length === visibleData.length && visibleData.length > 0) {
            state.selectedQuizzes = [];
        } else {
            state.selectedQuizzes = visibleData.map(q => q.id);
        }
        this.render();
    },

    executeBulkAction(action) {
        if (!this.state.manageQuizState || !this.state.manageQuizState.data || !this.state.manageQuizState.selectedQuizzes) return;
        const state = this.state.manageQuizState;

        if (action === 'Delete') {
            if (!confirm(`Delete ${state.selectedQuizzes.length} quizzes?`)) return;
            state.data = state.data.filter(q => !state.selectedQuizzes.includes(q.id));
        } else if (action === 'Publish') {
            state.data.forEach(q => { if (state.selectedQuizzes.includes(q.id)) q.status = 'Published'; });
        } else if (action === 'Draft') {
            state.data.forEach(q => { if (state.selectedQuizzes.includes(q.id)) q.status = 'Draft'; });
        }

        state.selectedQuizzes = [];
        this.showToast(`Bulk ${action} successful`, 'success');
        this.render();
    },

    initQuizChart() {
        const canvas = document.getElementById('manageQuizChart');
        if (!canvas) return;

        if (!this.state.manageQuizState || !this.state.manageQuizState.data) return;

        const data = this.state.manageQuizState.data;
        const published = data.filter(q => q.status === 'Published').length;
        const draft = data.filter(q => q.status === 'Draft').length;

        // Destroy existing chart instance if any to prevent memory leaks
        if (this.quizChartInstance) {
            this.quizChartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        // @ts-ignore
        this.quizChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Published', 'Draft'],
                datasets: [{
                    data: [published, draft],
                    backgroundColor: ['#22c55e', 'rgba(255,255,255,0.2)'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return ' ' + context.label + ': ' + context.raw;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                afterDraw: (chart) => {
                    const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
                    ctx.save();
                    ctx.font = 'bold 1.2rem sans-serif';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.fillText(published, left + width / 2, top + height / 2 - 5);
                    ctx.font = '600 0.6rem sans-serif';
                    ctx.fillStyle = 'var(--text-secondary)';
                    ctx.fillText('PUBLISHED', left + width / 2, top + height / 2 + 15);
                    ctx.restore();
                }
            }]
        });
    },

    // --- Drill Participation ---
    // --- Drill Participation ---
    getDrillParticipation() {
        const state = this.state.drillPartState || { isLoading: false, data: [], error: null, search: '', filter: 'All' };

        if (state.isLoading) {
            return `
                <div style="text-align: center; padding: 40px;" class="glass">
                    <div style="width: 40px; height: 40px; border: 3px solid rgba(0, 245, 255, 0.2); border-top: 3px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                    <p style="color: var(--text-secondary);">Loading drill participation data...</p>
                </div>
            `;
        }

        if (state.error) {
            return `
                <div style="text-align: center; padding: 40px;" class="glass">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: var(--red); margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--red);">${state.error}</p>
                    <button class="btn btn-primary" style="margin-top: 15px; width: auto; padding: 8px 16px;" onclick="App.state.drillPartState.data = null; App.changeSection('Drill Participation')">Retry</button>
                </div>
            `;
        }

        let data = state.data || [];

        // Apply search
        if (state.search) {
            data = data.filter(d => d.name.toLowerCase().includes(state.search.toLowerCase()));
        }

        // Apply filter
        if (state.filter !== 'All') {
            data = data.filter(d => d.status === state.filter);
        }

        const tableControls = `
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 25px;">
                <div>
                    <h3 style="margin-bottom: 5px;">Drill Participation</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">Monitor real-time drill metrics and safety compliance</p>
                </div>
            </div>
            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid var(--glass-border);">
                <div style="flex: 1; min-width: 200px; position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 12px; top: 12px; color: var(--text-secondary);"></i>
                    <input type="text" class="input-style" style="padding-left: 35px;" placeholder="Search drills by name..." value="${state.search}" oninput="App.updateDrillPartState('search', this.value)">
                </div>
                <div>
                    <select class="input-style" style="padding: 10px; width: auto; cursor: pointer;" onchange="App.updateDrillPartState('filter', this.value)">
                        <option value="All" ${state.filter === 'All' ? 'selected' : ''}>Status: All</option>
                        <option value="Upcoming" ${state.filter === 'Upcoming' ? 'selected' : ''}>Status: Upcoming</option>
                        <option value="Completed" ${state.filter === 'Completed' ? 'selected' : ''}>Status: Completed</option>
                        <option value="In Progress" ${state.filter === 'In Progress' ? 'selected' : ''}>Status: In Progress</option>
                    </select>
                </div>
            </div>
        `;

        if (data.length === 0) {
            return `
                <div class="glass" style="padding: 40px;">
                    ${tableControls}
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-vr-cardboard" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                        <p style="color: var(--text-secondary);">No drills found matching criteria.</p>
                    </div>
                </div>
            `;
        }

        const rows = data.map((drill, index) => {
            const isCompleted = drill.status === 'Completed';
            const statusColor = isCompleted ? 'var(--green)' : (drill.status === 'In Progress' ? 'var(--cyan)' : 'var(--text-secondary)');
            const barColor = isCompleted ? '#22c55e' : '#ef4444';

            return `
                <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 15px 10px; color: white;">
                        <div style="font-weight: 500; margin-bottom: 4px;">${drill.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);"><i class="fas fa-calendar-alt" style="margin-right: 6px;"></i>${drill.date}</div>
                    </td>
                    <td style="padding: 15px 10px;">
                        <span style="color: ${statusColor}; font-size: 0.85rem; font-weight: 600; background: ${statusColor}20; padding: 4px 10px; border-radius: 12px; border: 1px solid ${statusColor}40;">
                            ${drill.status}
                        </span>
                    </td>
                    <td style="padding: 15px 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 100px; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; min-width: 80px; border: 1px solid rgba(255,255,255,0.05);">
                                <div style="width: 100%; height: 100%; background: ${barColor};"></div>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 15px 10px; color: white;">
                        ${drill.avgScore > 0 ? drill.avgScore + '%' : '-'}
                    </td>
                    <td style="padding: 15px 10px; text-align: right;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            ${drill.status === 'Upcoming' ? `
                                <button class="btn" style="padding: 6px 12px; font-size: 0.8rem; width: auto; background: rgba(0, 245, 255, 0.1); color: var(--cyan); border: 1px solid rgba(0, 245, 255, 0.3);" onclick="App.sendDrillReminder(${index})">Remind</button>
                            ` : `
                                <button class="btn" style="padding: 6px 12px; font-size: 0.8rem; width: auto; background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid var(--glass-border);" onclick="App.showDrillReport(${index})">Report</button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="glass" style="padding: 40px;">
                ${tableControls}
                <div style="overflow-x: auto; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid var(--glass-border);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
                        <thead>
                            <tr style="color: var(--text-secondary); border-bottom: 1px solid var(--glass-border); background: rgba(255,255,255,0.02);">
                                <th style="padding: 15px 10px; font-weight: 600;">DRILL INFO</th>
                                <th style="padding: 15px 10px; font-weight: 600;">STATUS</th>
                                <th style="padding: 15px 10px; font-weight: 600;">PROGRESS</th>
                                <th style="padding: 15px 10px; font-weight: 600;">AVG SCORE</th>
                                <th style="padding: 15px 10px; text-align: right; font-weight: 600;">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    showDrillReport(index) {
        if (!this.state.drillPartState || !this.state.drillPartState.data) return;
        const drill = this.state.drillPartState.data[index];
        if (!drill) return;

        const modal = document.createElement('div');
        modal.id = 'drillDetailModal';
        modal.style.cssText = `position:fixed; inset:0; background:rgba(10, 17, 40, 0.8); backdrop-filter:blur(12px); z-index:2500; display:flex; justify-content:center; align-items:center; padding:20px;`;

        modal.innerHTML = `
            <div class="glass" style="width:380px; padding:25px; border:1px solid var(--glass-border); position:relative; text-align:center; background:var(--bg-navy) !important; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
                <button style="position:absolute; top:15px; right:15px; background:none; border:none; color:var(--text-secondary); font-size:1.2rem; cursor:pointer; transition:all 0.3s;" onmouseover="this.style.color='white'; this.style.transform='scale(1.1)';" onmouseout="this.style.color='var(--text-secondary)'; this.style.transform='scale(1)';" onclick="this.closest('#drillDetailModal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div style="width:50px; height:50px; background:rgba(255,255,255,0.02); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--text-secondary); font-size:1.3rem; margin:0 auto 15px; border:1px solid var(--glass-border);">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h2 style="color:white; margin-bottom:4px; font-size:1.3rem; letter-spacing:-0.5px;">${drill.name}</h2>
                <p style="color:var(--text-secondary); margin-bottom:20px; font-size:0.85rem;">Drill Safety Report</p>
                
                <div style="display:grid; gap:10px; text-align:left;">
                    <div style="background:rgba(255,255,255,0.01); padding:12px 15px; border-radius:12px; border:1px solid var(--glass-border);">
                        <p style="color:var(--text-secondary); font-size:0.7rem; margin-bottom:4px; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Attendance</p>
                        <p style="font-size:1.4rem; font-weight:700; color:white;">${drill.attendance}</p>
                        <div style="margin-top:5px; font-size:0.75rem; color:var(--green); display:flex; align-items:center; gap:5px; opacity:0.9;">
                            <i class="fas fa-users" style="font-size:0.65rem;"></i><span>${parseInt(drill.attendance) * 28 / 100 | 0} students participated</span>
                        </div>
                    </div>
                    
                    <div style="background:rgba(255,255,255,0.01); padding:12px 15px; border-radius:12px; border:1px solid var(--glass-border);">
                        <p style="color:var(--text-secondary); font-size:0.7rem; margin-bottom:4px; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Safety Score</p>
                        <p style="font-size:1.4rem; font-weight:700; color:white;">${drill.avgScore}%</p>
                    </div>
                </div>
                
                <button class="btn btn-primary" style="margin-top:25px; padding:10px; width:100%; font-size:0.9rem;" onclick="this.closest('#drillDetailModal').remove()">Close Analytics</button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    sendDrillReminder(index) {
        this.showToast(`Remainder sent to all students`, 'success');
    },

    updateDrillPartState(key, value) {
        if (!this.state.drillPartState) return;
        this.state.drillPartState[key] = value;
        this.render();

        if (key === 'search') {
            setTimeout(() => {
                const searchInput = document.querySelector('input[placeholder="Search drills by name..."]');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
                }
            }, 0);
        }
    },

    async loadDrillParticipation() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const mockData = [
                    { name: "Earthquake Preparedness", date: "Oct 12, 2023", status: "Completed", attendance: "92%", avgScore: 88 },
                    { name: "Fire Safety Protocol", date: "Nov 05, 2023", status: "Completed", attendance: "85%", avgScore: 79 },
                    { name: "Flood Response Training", date: "Dec 10, 2023", status: "Completed", attendance: "98%", avgScore: 94 },
                    { name: "Hurricane Survival Guide", date: "Jan 18, 2024", status: "In Progress", attendance: "45%", avgScore: 65 }
                ];
                this.state.drillPartState.data = mockData;
                resolve();
            }, 1000);
        });
    },

    getTeacherOverview() {
        // TODO: Replace with API call to GET /api/teacher/stats and GET /api/modules
        const modules = this.state.uploadedModules || [];
        return `
            <div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                    ${this.renderStatCard("Students Assigned", "28", "fa-users", "var(--cyan)")}
                    ${this.renderStatCard("Modules Uploaded", modules.length, "fa-book", "var(--indigo)")}
                    ${this.renderStatCard("Active Quizzes", "3", "fa-pen-nib", "var(--purple)")}
                    ${this.renderStatCard("Average Score", "87%", "fa-graduation-cap", "var(--cyan)")}
                </div>
                <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px;">
                    <div class="glass" style="padding: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h3 style="margin: 0;">Module Progress</h3>
                            <div style="display: flex; gap: 10px;">
                                <select class="input-style" style="padding: 5px 10px; width: auto; font-size: 0.8rem;" onchange="App.updateModuleProgressState('filter', this.value)">
                                    <option value="all" ${this.state.moduleProgressState.filter === 'all' ? 'selected' : ''}>All Modules</option>
                                    <option value="incomplete" ${this.state.moduleProgressState.filter === 'incomplete' ? 'selected' : ''}>Incomplete</option>
                                    <option value="completed" ${this.state.moduleProgressState.filter === 'completed' ? 'selected' : ''}>Completed</option>
                                </select>
                                <select class="input-style" style="padding: 5px 10px; width: auto; font-size: 0.8rem;" onchange="App.updateModuleProgressState('sort', this.value)">
                                    <option value="progress_desc" ${this.state.moduleProgressState.sort === 'progress_desc' ? 'selected' : ''}>Highest Progress</option>
                                    <option value="progress_asc" ${this.state.moduleProgressState.sort === 'progress_asc' ? 'selected' : ''}>Lowest Progress</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            ${(() => {
                let filtered = [...modules];
                if (this.state.moduleProgressState.filter === 'incomplete') filtered = filtered.filter(m => (m.completedStudents / m.totalStudents) < 1);
                if (this.state.moduleProgressState.filter === 'completed') filtered = filtered.filter(m => (m.completedStudents / m.totalStudents) >= 1);

                filtered.sort((a, b) => {
                    const pA = a.completedStudents / a.totalStudents;
                    const pB = b.completedStudents / b.totalStudents;
                    return this.state.moduleProgressState.sort === 'progress_desc' ? pB - pA : pA - pB;
                });

                return filtered.map(mod => {
                    const progress = Math.round((mod.completedStudents / (mod.totalStudents || 1)) * 100);
                    const status = progress === 0 ? "Not Started" : progress === 100 ? "Completed" : "In Progress";
                    const isWarning = progress < 40;
                    const accent = isWarning ? 'var(--red)' : 'var(--cyan)';

                    return `
                                        <div class="module-progress-item" onclick="App.showModuleDetailsModal('${mod._id}')" style="cursor: pointer; position: relative;" 
                                             title="Total Students: ${mod.totalStudents}\nCompleted: ${mod.completedStudents}\nPending: ${mod.totalStudents - mod.completedStudents}\nProgress: ${progress}%">
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center;">
                                                <div style="display: flex; align-items: center; gap: 8px;">
                                                    <span style="font-weight: 500; color: white;">${mod.title}</span>
                                                    ${isWarning ? `<i class="fas fa-exclamation-triangle" style="color: var(--red); font-size: 0.8rem;" title="Low Engagement Warning"></i>` : ''}
                                                </div>
                                                <div style="display: flex; align-items: center; gap: 10px;">
                                                    <span style="font-size: 0.75rem; color: ${accent}; padding: 2px 8px; background: rgba(255,255,255,0.05); border-radius: 10px;">${status}</span>
                                                    <span style="color: var(--text-secondary); font-size: 0.85rem;">${mod.completedStudents}/${mod.totalStudents}</span>
                                                </div>
                                            </div>
                                            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                                                <div class="progress-bar-fill" style="width: ${progress}%; height: 100%; background: ${accent}; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                                            </div>
                                        </div>
                                    `;
                }).join('');
            })()}
                        </div>
                    </div>
                    <div class="glass" style="padding: 30px;"><h3>Student Highlights</h3>${this.getStudentPerformanceTable()}</div>
                </div>
            </div>
        `;
    },

    updateModuleProgressState(key, value) {
        this.state.moduleProgressState[key] = value;
        this.render();
    },

    showModuleDetailsModal(moduleId) {
        const mod = this.state.uploadedModules.find(m => m._id === moduleId);
        if (!mod) return;

        const progress = Math.round((mod.completedStudents / mod.totalStudents) * 100);

        // Simulate student data for the modal
        const students = [
            { name: "John Doe", status: "Completed", score: "95%" },
            { name: "Jane Smith", status: "Completed", score: "88%" },
            { name: "Mike Ross", status: "Pending", score: "-" },
            { name: "Rachel Zane", status: "Completed", score: "92%" },
            { name: "Harvey Specter", status: "Pending", score: "-" }
        ];

        const modalHtml = `
            <div id="moduleDetailsModal" class="modal-overlay" style="display: flex; align-items: center; justify-content: center; z-index: 10000; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);">
                <div class="glass" style="width: 600px; padding: 40px; position: relative; border: 1px solid var(--cyan);">
                    <button onclick="document.getElementById('moduleDetailsModal').remove()" style="position: absolute; right: 20px; top: 20px; background: none; border: none; color: white; cursor: pointer; font-size: 1.5rem;">&times;</button>
                    
                    <h2 style="margin-bottom: 5px;">${mod.title}</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 30px;">Detailed Engagement Report</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                        <div class="glass" style="padding: 15px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Completion</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--cyan);">${progress}%</div>
                        </div>
                        <div class="glass" style="padding: 15px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Students</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: white;">${mod.completedStudents}/${mod.totalStudents}</div>
                        </div>
                        <div class="glass" style="padding: 15px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Avg. Quiz</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--purple);">84%</div>
                        </div>
                    </div>

                    <h4 style="margin-bottom: 15px;">Student Roster</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); font-size: 0.8rem; text-align: left;">
                                    <th style="padding: 10px;">NAME</th>
                                    <th style="padding: 10px;">STATUS</th>
                                    <th style="padding: 10px;">SCORE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${students.map(s => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <td style="padding: 10px; color: white;">${s.name}</td>
                                        <td style="padding: 10px;">
                                            <span style="font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; background: ${s.status === 'Completed' ? 'rgba(0,245,255,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${s.status === 'Completed' ? 'var(--cyan)' : 'var(--red)'};">
                                                ${s.status}
                                            </span>
                                        </td>
                                        <td style="padding: 10px; color: ${s.score === '-' ? 'var(--text-secondary)' : 'white'};">${s.score}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);
    },

    getStudentPerformanceTable() {
        const state = this.state.studentPerfState || { isLoading: false, data: [], error: null, search: '', sort: 'name', filter: 'All' };

        if (state.isLoading) {
            return `
                <div style="text-align: center; padding: 40px;">
                    <div style="width: 40px; height: 40px; border: 3px solid rgba(0, 245, 255, 0.2); border-top: 3px solid var(--cyan); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; margin-bottom: 15px;"></div>
                    <p style="color: var(--text-secondary);">Loading student performance data...</p>
                </div>
            `;
        }

        if (state.error) {
            return `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: var(--red); margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--red);">${state.error}</p>
                    <button class="btn btn-primary" style="margin-top: 15px; width: auto; padding: 8px 16px;" onclick="App.state.studentPerfState.data = null; App.changeSection('Student Performance')">Retry</button>
                </div>
            `;
        }

        let data = state.data || [];

        // Apply search
        if (state.search) {
            data = data.filter(s => s.name.toLowerCase().includes(state.search.toLowerCase()));
        }

        // Apply filter
        if (state.filter !== 'All') {
            data = data.filter(s => s.drillReady === state.filter);
        }

        // Apply sort
        if (state.sort === 'moduleAvg') {
            data = [...data].sort((a, b) => b.moduleAvg - a.moduleAvg);
        } else if (state.sort === 'quizScore') {
            data = [...data].sort((a, b) => b.quizScore - a.quizScore);
        } else if (state.sort === 'name') {
            // Default sort: alphabetical by Name (A -> Z)
            data = [...data].sort((a, b) => a.name.localeCompare(b.name));
        }

        const isDashboard = this.state.activeSection === 'Dashboard';

        const tableControls = isDashboard ? '' : `
            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid var(--glass-border);">
                <div style="flex: 1; min-width: 200px; position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 12px; top: 12px; color: var(--text-secondary);"></i>
                    <input type="text" class="input-style" style="padding-left: 35px;" placeholder="Search students by name..." value="${state.search}" oninput="App.updateStudentPerfState('search', this.value)">
                </div>
                <div>
                    <select class="input-style" style="padding: 10px; width: auto; cursor: pointer;" onchange="App.updateStudentPerfState('sort', this.value)">
                        <option value="name" ${state.sort === 'name' ? 'selected' : ''}>Sort By: Name (A to Z)</option>
                        <option value="moduleAvg" ${state.sort === 'moduleAvg' ? 'selected' : ''}>Module Average (High to Low)</option>
                        <option value="quizScore" ${state.sort === 'quizScore' ? 'selected' : ''}>Quiz Score (High to Low)</option>
                    </select>
                </div>
                <div>
                    <select class="input-style" style="padding: 10px; width: auto; cursor: pointer;" onchange="App.updateStudentPerfState('filter', this.value)">
                        <option value="All" ${state.filter === 'All' ? 'selected' : ''}>Drill Ready: All</option>
                        <option value="Yes" ${state.filter === 'Yes' ? 'selected' : ''}>Drill Ready: Yes</option>
                        <option value="No" ${state.filter === 'No' ? 'selected' : ''}>Drill Ready: No</option>
                    </select>
                </div>
            </div>
        `;

        if (data.length === 0) {
            return tableControls + `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-users-slash" style="font-size: 2.5rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--text-secondary);">No student data available matching criteria.</p>
                </div>
            `;
        }

        const getHighlightAndBadge = (score) => {
            if (score > 90) return { color: 'var(--green)', badge: '<span style="background: rgba(34, 197, 94, 0.2); color: var(--green); border: 1px solid rgba(34, 197, 94, 0.3); padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 8px; font-weight: 600;"><i class="fas fa-star" style="margin-right: 4px; font-size: 0.6rem;"></i>High Performer</span>' };

            // Performance Alerts Logic (60% threshold)
            if (this.state.settings.perfNotif && score < 60) {
                return { color: 'var(--red)', badge: '<span style="background: rgba(239, 68, 68, 0.2); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 8px; font-weight: 600;"><i class="fas fa-exclamation-triangle" style="margin-right: 4px; font-size: 0.6rem;"></i>Alert: Low Score</span>' };
            }

            if (score < 50) return { color: 'var(--red)', badge: '<span style="background: rgba(239, 68, 68, 0.2); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 8px; font-weight: 600;"><i class="fas fa-exclamation-circle" style="margin-right: 4px; font-size: 0.6rem;"></i>Needs Improvement</span>' };
            return { color: 'white', badge: '' }; // Default
        };

        const rows = data.map(student => {
            const avgStyles = getHighlightAndBadge(student.moduleAvg);
            const scorePercent = (student.quizScore / 20) * 100;
            const quizStyles = getHighlightAndBadge(scorePercent);

            // Only show badges in the Student Performance section, not on the compact Dashboard view
            const showBadges = !isDashboard;

            const isAnon = this.state.settings.hideNames;
            const displayName = isAnon ? `Student_${student.name.substring(0, 3)}***` : student.name;
            const displayInitials = isAnon ? '??' : student.name.split(' ').map(n => n[0]).join('');

            return `
                <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 15px 10px; color: white; display: flex; align-items: center;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--glass-border); display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 0.8rem; font-weight: bold; color: var(--cyan);">
                            ${displayInitials}
                        </div>
                        ${displayName}
                        ${showBadges && (avgStyles.badge || quizStyles.badge) ? (avgStyles.badge ? avgStyles.badge : quizStyles.badge) : ''}
                    </td>
                    <td style="padding: 15px 10px; color: ${avgStyles.color}; font-weight: ${avgStyles.color !== 'white' ? 'bold' : 'normal'};">${student.moduleAvg}%</td>
                    <td style="padding: 15px 10px; color: ${quizStyles.color}; font-weight: ${quizStyles.color !== 'white' ? 'bold' : 'normal'};">${student.quizScore}/20</td>
                    <td style="padding: 15px 10px;">
                        <span style="color: ${student.drillReady === 'Yes' ? 'var(--green)' : 'var(--red)'}; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                            <i class="fas ${student.drillReady === 'Yes' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${student.drillReady}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        return tableControls + `
            <div style="overflow-x: auto; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid var(--glass-border);">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
                    <thead>
                        <tr style="color: var(--text-secondary); border-bottom: 1px solid var(--glass-border); background: rgba(255,255,255,0.02);">
                            <th style="padding: 15px 10px; font-weight: 600;">NAME</th>
                            <th style="padding: 15px 10px; font-weight: 600;">MODULE AVG</th>
                            <th style="padding: 15px 10px; font-weight: 600;">QUIZ SCORE</th>
                            <th style="padding: 15px 10px; font-weight: 600;">DRILL READY</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },

    updateStudentPerfState(key, value) {
        if (!this.state.studentPerfState) return;
        this.state.studentPerfState[key] = value;
        this.render();

        // Refocus input if it was search so we don't lose focus after render
        if (key === 'search') {
            setTimeout(() => {
                const searchInput = document.querySelector('input[placeholder="Search students by name..."]');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
                }
            }, 0);
        }
    },

    async loadStudentPerformance() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate an occasional network error if needed, but let's stick to success for user testing
                const shouldFail = false;

                if (shouldFail) {
                    reject(new Error('Failed to load data from server. Please try again.'));
                    return;
                }

                // Mock JSON data
                const mockData = [
                    { name: "Kavya Menon", moduleAvg: 92, quizScore: 19, drillReady: "Yes" },
                    { name: "Rohan Gupta", moduleAvg: 88, quizScore: 17, drillReady: "Yes" },
                    { name: "Alex Chen", moduleAvg: 85, quizScore: 15, drillReady: "Yes" },
                    { name: "Maya Rodriguez", moduleAvg: 95, quizScore: 19, drillReady: "Yes" },
                    { name: "Elena Petrova", moduleAvg: 82, quizScore: 14, drillReady: "No" },
                    { name: "David Kim", moduleAvg: 45, quizScore: 8, drillReady: "No" },
                    { name: "Sarah Connor", moduleAvg: 40, quizScore: 6, drillReady: "No" },
                    { name: "James Wilson", moduleAvg: 91, quizScore: 18, drillReady: "Yes" },
                    { name: "Nina Patel", moduleAvg: 76, quizScore: 12, drillReady: "No" },
                    { name: "Lucas Silva", moduleAvg: 60, quizScore: 10, drillReady: "No" }
                ];

                this.state.studentPerfState.data = mockData;
                resolve();
            }, 1000); // 1s simulated network delay
        });
    },

    showEditQuizModal(quizId) {
        if (!this.state.manageQuizState || !this.state.manageQuizState.data) return;
        const quiz = this.state.manageQuizState.data.find(q => q.id === quizId);
        if (!quiz) return;

        this.closeQuizModal();
        const modal = document.createElement('div');
        modal.id = 'quizModal';
        modal.className = 'glass';
        modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 20px; overflow-y: auto;`;

        const qData = quiz.questionsData && quiz.questionsData.length > 0 ? quiz.questionsData : [{ text: '', options: ['', '', '', ''], correct: 0 }];

        modal.innerHTML = `
            <div style="background: var(--bg-navy); padding: 35px; border-radius: 16px; width: 100%; max-width: 800px; border: 1px solid var(--glass-border); box-shadow: 0 10px 40px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-bottom: 25px;">Edit Quiz: ${quiz.title}</h2>
                <input type="text" id="quizTitle" class="input-style" style="margin-bottom: 15px;" placeholder="Quiz Title" value="${quiz.title}">
                <input type="text" id="quizModule" class="input-style" style="margin-bottom: 25px;" placeholder="Module Name" value="${quiz.module}">
                
                <h4 style="margin-bottom: 15px;">Questions</h4>
                <div id="questionsContainer" style="display: flex; flex-direction: column; gap: 15px;">
                    ${this.renderQuestionEditor(qData)}
                </div>
                
                <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn" style="background: rgba(0, 245, 255, 0.1); width: auto; padding: 10px 20px; color: var(--cyan); border: 1px solid rgba(0, 245, 255, 0.3);" onclick="App.addQuestionEntry()">
                        <i class="fas fa-plus"></i> Add Question
                    </button>
                    <div style="display: flex; gap: 15px;">
                        <button class="btn" style="background: rgba(255,255,255,0.05); width: auto; padding: 10px 20px; border: 1px solid var(--glass-border);" onclick="App.closeQuizModal()">Cancel</button>
                        <button class="btn btn-primary" style="width: auto; padding: 10px 25px;" onclick="App.submitEditQuiz('${quiz.id}')">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    showQuizResultsModal(quizId) {
        if (!this.state.manageQuizState || !this.state.manageQuizState.data) return;
        const quiz = this.state.manageQuizState.data.find(q => q.id === quizId);
        if (!quiz) return;

        this.closeQuizModal();
        const modal = document.createElement('div');
        modal.id = 'quizModal';
        modal.className = 'glass';
        modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 20px; overflow-y: auto;`;

        // Mock submissions based on total questions
        // Date Logic: Ensure submitted dates are >= quiz creation date
        const baseDate = new Date(quiz.date);
        if (isNaN(baseDate.getTime())) baseDate.setTime(Date.now() - 86400000 * 5); // Fallback to 5 days ago if date format fails

        const formatDate = (daysAfter) => {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + daysAfter);
            return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        };

        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        // Use students from Student Performance section
        const studentList = (this.state.studentPerfState && this.state.studentPerfState.data) ?
            this.state.studentPerfState.data.map(s => s.name) :
            ["Kavya Menon", "Rohan Gupta", "Alex Chen", "Maya Rodriguez"];

        // If quiz was published today, show no submissions as requested
        let submissions = [];
        if (quiz.date !== today) {
            submissions = studentList.map((name, i) => {
                let correctCount = 0;
                quiz.questionsData.forEach((q, idx) => {
                    const studentAnswer = (name.length + idx) % q.options.length;
                    if (studentAnswer === q.correct) correctCount++;
                });
                return {
                    name: name,
                    score: correctCount,
                    time: (1 + i) + "m " + (10 * i) + "s",
                    date: formatDate(i)
                };
            });
        }

        modal.innerHTML = `
            <div style="background: var(--bg-navy); padding: 40px; border-radius: 16px; width: 100%; max-width: 850px; border: 1px solid var(--glass-border); box-shadow: 0 10px 40px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 30px;">
                    <div>
                        <h2 style="color:var(--cyan); margin: 0;">${quiz.title}</h2>
                        <p style="color: var(--text-secondary); margin-top: 5px;">Class Submission History</p>
                    </div>
                    <button class="btn" style="width: auto; padding: 10px 20px; background: rgba(255,255,255,0.05);" onclick="App.closeQuizModal()">Close</button>
                </div>
                
                <div style="overflow-x: auto;">
                    ${submissions.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
                            No submissions recorded for this version yet.
                        </div>
                    ` : `
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="color: var(--text-secondary); border-bottom: 1px solid var(--glass-border);">
                                <th style="padding: 15px 10px;">STUDENT NAME</th>
                                <th style="padding: 15px 10px;">SCORE</th>
                                <th style="padding: 15px 10px;">TIME TAKEN</th>
                                <th style="padding: 15px 10px;">SUBMITTED ON</th>
                                <th style="padding: 15px 10px; text-align: right;">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${submissions.map(sub => {
            const isAnon = this.state.settings.hideNames;
            const displayName = isAnon ? `Student_${sub.name.substring(0, 3)}***` : sub.name;
            return `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td style="padding: 15px 10px; color: white; font-weight: 500;">${displayName}</td>
                                    <td style="padding: 15px 10px;">
                                        <span style="color: ${sub.score >= quiz.questions * 0.7 ? 'var(--green)' : 'var(--red)'}; font-weight: bold;">
                                            ${sub.score}/${quiz.questions}
                                        </span>
                                    </td>
                                    <td style="padding: 15px 10px; color: var(--text-secondary);">${sub.time}</td>
                                    <td style="padding: 15px 10px; color: var(--text-secondary);">${sub.date}</td>
                                    <td style="padding: 15px 10px; text-align: right;">
                                        <button class="btn" style="padding: 5px 10px; font-size: 0.75rem; width: auto;" onclick="App.showStudentAttempt('${sub.name}', '${quiz.id}')">Review</button>
                                    </td>
                                </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>`}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    showStudentAttempt(studentName, quizId) {
        if (!this.state.manageQuizState || !this.state.manageQuizState.data) return;
        const quiz = this.state.manageQuizState.data.find(q => q.id === quizId);
        if (!quiz) return;

        const modal = document.createElement('div');
        modal.id = 'attemptModal';
        modal.className = 'glass';
        modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(15px); display: flex; justify-content: center; align-items: center; z-index: 2100; padding: 20px; overflow-y: auto;`;

        const qData = quiz.questionsData || [];

        modal.innerHTML = `
            <div style="background: var(--bg-navy); padding: 40px; border-radius: 16px; width: 100%; max-width: 700px; border: 1px solid var(--glass-border); box-shadow: 0 10px 40px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 30px;">
                    <div>
                        <h2 style="color:var(--cyan); margin: 0;">Review: ${studentName}</h2>
                        <p style="color: var(--text-secondary); margin-top: 5px;">${quiz.title}</p>
                    </div>
                    <button class="btn" style="width: auto; padding: 10px 20px; background: rgba(255,255,255,0.1);" onclick="this.closest('#attemptModal').remove()">Back</button>
                </div>
                
                <div style="display: grid; gap: 20px;">
                    ${qData.map((q, idx) => {
            const studentAnswer = (studentName.length + idx) % q.options.length; // Mocked student choice
            const isCorrect = studentAnswer === q.correct;

            return `
                            <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};">
                                <p style="font-weight: 600; margin-bottom: 15px; color: white; font-size: 1.05rem;">${idx + 1}. ${q.text}</p>
                                <div style="display: grid; gap: 10px;">
                                    ${q.options.map((opt, optIdx) => {
                let style = 'background: rgba(255,255,255,0.03); color: var(--text-secondary); border: 1px solid transparent;';
                let icon = '';

                if (optIdx === q.correct) {
                    style = 'background: rgba(34, 197, 94, 0.15); color: var(--green); border: 1px solid rgba(34, 197, 94, 0.3);';
                    icon = '<i class="fas fa-check-circle" style="margin-left: auto;"></i>';
                } else if (optIdx === studentAnswer && !isCorrect) {
                    style = 'background: rgba(239, 68, 68, 0.15); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.3);';
                    icon = '<i class="fas fa-times-circle" style="margin-left: auto;"></i>';
                }

                return `
                                            <div style="padding: 12px 15px; border-radius: 8px; font-size: 0.9rem; display: flex; align-items: center; ${style}">
                                                ${opt} ${icon}
                                            </div>
                                        `;
            }).join('')}
                                </div>
                                <div style="margin-top: 15px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                    ${isCorrect ? `
                                        <span style="color: var(--green); display: flex; align-items: center; gap: 5px;">
                                            <i class="fas fa-check"></i> Correct
                                        </span>
                                    ` : `
                                        <span style="color: var(--red); display: flex; align-items: center; gap: 5px; margin-right: 15px;">
                                            <i class="fas fa-times"></i> Wrong
                                        </span>
                                        <span style="color: var(--green); opacity: 0.9;">
                                            Correct answer: ${q.options[q.correct]}
                                        </span>
                                    `}
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    showCreateQuizModal() {
        this.closeQuizModal();
        const modal = document.createElement('div');
        modal.id = 'quizModal';
        modal.className = 'glass';
        modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px); display: flex; justify-content: center; align-items: center; z-index: 2000; padding: 20px; overflow-y: auto;`;

        modal.innerHTML = `
            <div style="background: var(--bg-navy); padding: 35px; border-radius: 16px; width: 100%; max-width: 800px; border: 1px solid var(--glass-border); box-shadow: 0 10px 40px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-bottom: 25px;">Create New Quiz</h2>
                <input type="text" id="quizTitle" class="input-style" style="margin-bottom: 15px;" placeholder="Quiz Title (e.g. Earthquake Safety)">
                <input type="text" id="quizModule" class="input-style" style="margin-bottom: 25px;" placeholder="Module Name (e.g. Natural Disasters)">
                
                <h4 style="margin-bottom: 15px;">Questions</h4>
                <div id="questionsContainer" style="display: flex; flex-direction: column; gap: 15px;">
                    ${this.renderQuestionEditor([{ text: '', options: ['', '', '', ''], correct: 0 }])}
                </div>
                
                <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn" style="background: rgba(0, 245, 255, 0.1); width: auto; padding: 10px 20px; color: var(--cyan); border: 1px solid rgba(0, 245, 255, 0.3);" onclick="App.addQuestionEntry()">
                        <i class="fas fa-plus"></i> Add Question
                    </button>
                    <div style="display: flex; gap: 15px;">
                        <button class="btn" style="background: rgba(255,255,255,0.05); width: auto; padding: 10px 20px; border: 1px solid var(--glass-border);" onclick="App.closeQuizModal()">Cancel</button>
                        <button class="btn btn-primary" style="width: auto; padding: 10px 25px;" onclick="App.submitCreateQuiz()">Create Quiz</button>
                    </div>
                </div>
            </div>
        `;
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

    submitEditQuiz(quizId) {
        if (!this.state.manageQuizState || !this.state.manageQuizState.data) return;
        const quiz = this.state.manageQuizState.data.find(q => q.id === quizId);
        if (!quiz) return;

        const title = document.getElementById('quizTitle').value.trim();
        const module = document.getElementById('quizModule').value.trim();
        const questionsList = this.scrapeQuestions();

        if (!title || !module) return this.showToast('Please enter title and module', 'error');
        if (questionsList.length === 0) return this.showToast('Please add at least one question', 'error');

        quiz.title = title;
        quiz.module = module;
        quiz.questionsData = questionsList;
        quiz.questions = questionsList.length;

        this.closeQuizModal();
        this.render();
        this.showToast('Quiz updated successfully!', 'success');
    },

    submitCreateQuiz() {
        if (!this.state.manageQuizState || !this.state.manageQuizState.data) return;

        const title = document.getElementById('quizTitle').value.trim();
        const module = document.getElementById('quizModule').value.trim();
        const questionsList = this.scrapeQuestions();

        if (!title || !module) return this.showToast('Please enter title and module', 'error');
        if (questionsList.length === 0) return this.showToast('Please add at least one question', 'error');

        const newQuiz = {
            id: 'q' + Date.now(),
            title,
            module,
            questions: questionsList.length,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            status: 'Draft',
            questionsData: questionsList
        };

        this.state.manageQuizState.data.unshift(newQuiz);
        this.closeQuizModal();
        this.render();
        this.showToast('New quiz created successfully!', 'success');
    },

    closeQuizModal() {
        const m = document.getElementById('quizModal');
        if (m) m.remove();
    },

    viewDrillDetails(index) {
        // TODO: Implement with API call to GET /api/drills/{id}/details
        this.showToast('Drill details require API integration with GET /api/drills/{id}/details', 'info');
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

        if (section === 'Virtual Drills') {
            // TODO: Replace with API call to GET /api/drills
            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <div>
                            <h3 style="margin-bottom:5px;">Virtual Drills</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem;">Loading drills from API...</p>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-code" style="font-size: 2rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">
                            Requires: GET /api/drills
                        </p>
                    </div>
                </div>`;
        }

        if (section === 'Quizzes') {
            // TODO: Replace with API call to GET /api/quizzes
            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <div>
                            <h3 style="margin-bottom:5px;">Knowledge Assessments</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem;">Loading quizzes from API...</p>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-code" style="font-size: 2rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">
                            Requires: GET /api/quizzes
                        </p>
                    </div>
                </div>`;
        }

        if (section === 'Achievements') {
            // TODO: Replace with API call to GET /api/student/achievements
            return `<div class="glass" style="padding: 40px;">
                <h3>Achievements & Badges</h3>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Loading achievements from API...</p>
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-code" style="font-size: 2rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">
                        Requires: GET /api/student/achievements
                    </p>
                </div>
            </div>`;
        }

        if (section === 'Leaderboard') {
            const currentUserName = this.state.profiles[this.state.role]?.name;
            const hideSelf = !this.state.settings.ldrbrd;

            // Sample leaderboard data
            const rawLeaderboard = [
                { rank: 1, name: "Kavya Menon", points: 2450, institution: "CrisisCraft Academy", badge: "🏆" },
                { rank: 2, name: "Rohan Gupta", points: 2380, institution: "CrisisCraft Academy", badge: "🥈" },
                { rank: 3, name: "Alex Chen", points: 2320, institution: "CrisisCraft Academy", badge: "🥉" },
                { rank: 4, name: "Maya Rodriguez", points: 2280, institution: "CrisisCraft Academy", badge: "⭐" },
                { rank: 5, name: "Elena Petrova", points: 2250, institution: "CrisisCraft Academy", badge: "⭐" },
                { rank: 6, name: "David Kim", points: 2200, institution: "CrisisCraft Academy", badge: "⭐" },
                { rank: 7, name: "Sarah Johnson", points: 2150, institution: "CrisisCraft Academy", badge: "⭐" },
                { rank: 8, name: "Michael Brown", points: 2100, institution: "CrisisCraft Academy", badge: "⭐" }
            ];

            const leaderboard = rawLeaderboard.filter(entry => {
                if (hideSelf && entry.name === currentUserName) return false;
                return true;
            });

            return `
                <div class="glass" style="padding: 40px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <div>
                            <h3 style="margin-bottom: 5px;">Global Leaderboard</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem;">Top performers in CrisisCraft</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">YOUR RANK</p>
                            <p style="font-weight: 700; color: var(--cyan); font-size: 1.2rem;">#4</p>
                        </div>
                    </div>
                    <div style="display: grid; gap: 15px;">
                        ${leaderboard.map(entry => `
                            <div class="glass glass-card" style="padding: 20px; display: flex; align-items: center; justify-content: space-between; ${entry.rank <= 3 ? 'border: 1px solid rgba(0,245,255,0.3); background: rgba(0,245,255,0.05);' : ''}">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${entry.rank === 1 ? 'linear-gradient(45deg, #FFD700, #FFA500)' : entry.rank === 2 ? 'linear-gradient(45deg, #C0C0C0, #A8A8A8)' : entry.rank === 3 ? 'linear-gradient(45deg, #CD7F32, #A0522D)' : 'rgba(0,245,255,0.1)'}; display: flex; align-items: center; justify-content: center; font-weight: 700; color: ${entry.rank <= 3 ? 'black' : 'var(--cyan)'};">
                                        ${entry.rank}
                                    </div>
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <span style="font-weight: 600; color: white;">${entry.name}</span>
                                            <span style="font-size: 1.2rem;">${entry.badge}</span>
                                        </div>
                                        <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 2px;">${entry.institution}</p>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <p style="font-weight: 700; color: var(--cyan); font-size: 1.1rem;">${entry.points.toLocaleString()}</p>
                                    <p style="color: var(--text-secondary); font-size: 0.8rem;">points</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        return `<h2>${section}</h2>`;
    },

    getStudentOverview() {
        // TODO: Replace with API call to GET /api/student/profile and GET /api/student/stats
        const userName = localStorage.getItem('crisis_craft_user') || 'Student';
        return `
            <div class="glass" style="padding: 20px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid var(--cyan);">
                 <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(0,245,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--cyan); border: 2px solid rgba(0,245,255,0.2);">
                        <i class="fas fa-university"></i>
                    </div>
                    <div>
                        <h4 style="font-size: 1.1rem; margin-bottom: 4px;">CrisisCraft Academy</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            <i class="fas fa-map-marker-alt" style="margin-right: 8px;"></i>Grade 10A - Emergency Response
                        </p>
                    </div>
                 </div>
                 <div style="text-align: right;">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">ENROLLED SINCE</p>
                    <p style="font-weight: 700; color: var(--cyan);">Jan 2024</p>
                 </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                ${this.renderStatCard("Modules Done", "8", "fa-check-circle", "var(--cyan)")}
                ${this.renderStatCard("Next Drill", "Tomorrow", "fa-calendar-alt", "var(--indigo)")}
                ${this.renderStatCard("Quiz Average", "87%", "fa-pen-alt", "var(--purple)")}
                ${this.renderStatCard("Total Points", "2280", "fa-fire", "var(--cyan)")}
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:25px;">
                <div class="glass" style="padding: 30px;">
                    <h3>Progress</h3>
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <i class="fas fa-code" style="margin-right: 8px;"></i>
                        Requires: GET /api/student/progress
                    </div>
                </div>
                <div class="glass" style="padding: 30px; background: linear-gradient(135deg, rgba(0, 245, 255, 0.05), transparent);">
                    <h3>Next Virtual Drill</h3>
                    <p style="margin-top: 15px; color: var(--text-secondary);">Emergency Evacuation Drill</p>
                    <p style="color: var(--cyan); font-size:0.9rem; margin-top:5px;">Tomorrow at 10:00 AM</p>
                    <div id="drill-countdown" style="font-size: 1.5rem; font-weight: 700; color: var(--cyan); margin-top:10px;">23:45:12</div>
                    <button class="btn btn-primary" style="width: auto; padding: 10px 30px; margin-top: 20px;" onclick="App.showToast('Requires: GET /api/drills/next', 'info')">Enter</button>
                </div>
            </div>
        `;
    },

    removeUser(index) {
        // TODO: Implement with API call to DELETE /api/admin/users/{id}
        if (confirm('Are you sure you want to remove this user?')) {
            this.showToast('User deletion requires API integration with DELETE /api/admin/users/{id}', 'info');
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
        // TODO: Implement with API call to POST /api/admin/users
        this.showToast('User creation requires API integration with POST /api/admin/users', 'info');
        this.closeAddUserModal();
    },

    removeDrill(index) {
        // TODO: Implement with API call to DELETE /api/drills/{id}
        if (confirm('Are you sure you want to delete this virtual drill?')) {
            this.showToast('Drill deletion requires API integration with DELETE /api/drills/{id}', 'info');
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
        // TODO: Implement with API call to POST /api/drills
        this.showToast('Drill creation requires API integration with POST /api/drills', 'info');
        this.closeAddDrillModal();
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

            // TODO: Get next drill from API GET /api/drills/next
            timerEl.textContent = "--:--:--";
        };

        updateTimer();
        this.countdownInterval = setInterval(updateTimer, 1000);
    },

    // --- Student Interaction Methods ---
    startModule(moduleId) {
        // TODO: Implement with API call to POST /api/modules/{id}/progress
        this.showModuleViewer(moduleId);
    },

    getContentByTitle(title) {
        const t = title.toLowerCase();
        if (t.includes('earthquake')) return "Earthquakes occur without warning. The primary safety directive is 'Drop, Cover, and Hold on.' This action reduces the chance of being struck by falling objects. If you are indoors, stay there. Move away from windows and mirrors. If you are outdoors, find a clear spot away from buildings, trees, and power lines.";
        if (t.includes('fire')) return "Fire safety starts with prevention and early detection. In the event of a fire, every second counts. Stay low to avoid smoke, which is often more lethal than the flames themselves. Always feel doors for heat before opening them. Once outside, stay out and never re-enter a burning building for any reason.";
        if (t.includes('flood')) return "Flooding is the most frequent natural disaster. During a flood warning, avoid low-lying areas. Never attempt to cross flowing water, as it takes very little depth to sweep away a person or a vehicle. If you are caught in a building, move to the highest floor but avoid becoming trapped in an attic without a roof exit.";
        if (t.includes('hurricane')) return "Hurricanes bring high winds, heavy rain, and storm surges. Preparation involves securing your home and having an evacuation plan. During the storm, stay in a reinforced room away from windows. Monitor local broadcasts for changes in the storm's path and follow all official evacuation orders immediately.";
        if (t.includes('tsunami')) return "A tsunami is a series of waves caused by a large undersea disturbance. If you are near the ocean and feel the ground shake, move inland or to higher ground immediately. Do not wait for a warning. A tsunami can travel faster than a person can run. Stay away from the coast until authorities declare it safe.";
        if (t.includes('cyber') || t.includes('security')) return "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These cyberattacks are usually aimed at accessing, changing, or destroying sensitive information; extorting money from users; or interrupting normal business processes. Essential protocols include using strong, unique passwords and enabling multi-factor authentication.";
        if (t.includes('chemical') || t.includes('hazard')) return "Chemical hazards involve substances that can cause health problems or physical injury. This includes toxic, corrosive, flammable, and reactive materials. Understanding Material Safety Data Sheets (MSDS) and using appropriate Personal Protective Equipment (PPE) are critical components of managing chemical exposure in a laboratory or industrial setting.";
        if (t.includes('tornado')) return "Tornadoes are violently rotating columns of air extending from a thunderstorm to the ground. They can destroy buildings, flip cars, and create deadly flying debris. If a tornado warning is issued, move immediately to a basement or an interior room on the lowest floor of a sturdy building. Avoid windows and use your arms to protect your head and neck.";
        if (t.includes('first') || t.includes('aid')) return "First aid is the first and immediate assistance given to any person suffering from either a minor or serious illness or injury, with care provided to preserve life, prevent the condition from worsening, or to promote recovery. This module covers essential life-saving skills including CPR, wound management, and treating shock.";
        return "Disaster preparedness is essential for community safety. This module covers the fundamental principles of emergency response, including situational awareness, communication protocols, and evacuation procedures tailored to various crisis scenarios.";
    },

    getProtocolsByTitle(title) {
        const t = String(title || '').toLowerCase();
        console.log('🧐 Generating protocols for title:', t);

        if (/earthquake/i.test(t)) {
            return [
                "Drop, Cover, and Hold on immediately.",
                "Stay away from glass, windows, and exterior walls.",
                "Wait for the shaking to stop before moving to a safe assembly point."
            ];
        } else if (/fire/i.test(t)) {
            return [
                "Activate the nearest fire alarm and call emergency services.",
                "Stay low to the ground to avoid smoke inhalation.",
                "Check door handles for heat before opening and never use elevators."
            ];
        } else if (/flood/i.test(t)) {
            return [
                "Move to higher ground immediately and avoid basement areas.",
                "Do not walk or drive through moving water (Turn Around, Don't Drown).",
                "Stay informed via battery-powered radio for flash flood warnings."
            ];
        } else if (/hurricane/i.test(t)) {
            return [
                "Secure all windows and clear loose outdoor debris.",
                "Retreat to a small interior room, closet, or hallway on the lowest floor.",
                "Stay indoors until the 'eye' of the storm has completely passed."
            ];
        } else if (/tsunami/i.test(t)) {
            return [
                "Move inland or to high ground immediately after a strong quake.",
                "Follow designated tsunami evacuation route signs (Blue signs).",
                "Stay away from the beach until the 'All Clear' is issued by officials."
            ];
        } else if (/cyber|security/i.test(t)) {
            return [
                "Enable Multi-Factor Authentication (MFA) on all accounts.",
                "Never click on suspicious links or download unknown attachments.",
                "Use a password manager to generate and store unique, strong passwords."
            ];
        } else if (/chemical|hazard/i.test(t)) {
            return [
                "Locate the nearest eyewash station and emergency shower.",
                "Wear appropriate PPE, including goggles, gloves, and lab coats.",
                "Ensure all chemical containers are clearly labeled and tightly sealed."
            ];
        } else if (/tornado/i.test(t)) {
            return [
                "Move to a basement or windowless interior room on the lowest floor.",
                "Get under a sturdy piece of furniture and protect your head.",
                "Avoid mobile homes, vehicles, and large open rooms like gyms."
            ];
        } else if (/first|aid/i.test(t)) {
            return [
                "Assess the scene for safety before approaching the victim.",
                "Check for responsiveness and call emergency services if needed.",
                "Control any major bleeding using direct pressure and sterile bandages."
            ];
        }

        console.warn('⚠️ No specific protocol found for:', t, '. Using fallback.');
        return [
            "Follow the primary emergency evacuation plan for your building.",
            "Maintain a 3-day supply of food, water, and essential medicine.",
            "Establish a clear communication plan with your family and emergency contacts."
        ];
    },

    getAnalysisByTitle(title) {
        const t = String(title || '').toLowerCase();
        if (/earthquake/i.test(t)) return "Seismic activity analysis shows that structural failure is the leading cause of injury. Focus on identifying 'safe triangles' and ensuring all heavy furniture is bolted to wall studs. Regular practice of the drop-and-cover maneuver reduces reaction time by 40%.";
        if (/fire/i.test(t)) return "Thermal dynamics indicate that heat rises rapidly, trapping toxic gases near the ceiling. Maintaining a low profile during evacuation is non-negotiable. Ensure all fire extinguishers are inspected monthly and that escape routes are never obstructed by storage items.";
        if (/flood/i.test(t)) return "Hydrological studies reveal that even shallow moving water exerts thousands of pounds of force. Hydroplaning and engine stalling are primary risks during vehicle evacuations. Always prioritize vertical evacuation if ground-level routes are submerged.";
        if (/hurricane/i.test(t)) return "Barometric pressure drops and extreme wind velocity require structural reinforcement. Window protection and roof-tie-downs are critical mitigation steps. Maintain a minimum of 72 hours of supplies, as storm surges often isolate communities from emergency services.";
        if (/tsunami/i.test(t)) return "Tectonic displacement can generate multiple wave crests over several hours. The first wave is rarely the largest. Stay at high elevation until an official 'All Clear' is provided. Do not return to coastal zones to 'inspect' damage between wave cycles.";
        if (/cyber|security/i.test(t)) return "Digital infrastructure resilience requires a multi-layered defense strategy. Social engineering remains the most common entry point for attackers. Regular software updates and network monitoring are essential to identify and mitigate potential vulnerabilities before they are exploited.";
        if (/chemical|hazard/i.test(t)) return "Chemical containment and ventilation are the primary methods of exposure control. In the event of a spill, immediately evacuate the area and notify the hazardous materials (HAZMAT) team. Never attempt to clean a spill without proper training and equipment.";
        if (/tornado/i.test(t)) return "Tornado intensity is measured by the Enhanced Fujita (EF) scale. Structural reinforcement of 'safe rooms' is the most effective way to ensure survival during an EF4 or EF5 event. Monitor weather radar for signs of rotation and debris balls during severe thunderstorms.";
        if (/first|aid/i.test(t)) return "Medical emergency response follows the 'ABC' protocol: Airway, Breathing, and Circulation. Rapid intervention during the 'Golden Hour' post-injury significantly improves patient outcomes. Ensure all first aid supplies are restocked immediately after use and check expiration dates biannually.";
        return "Comprehensive risk assessment involves identifying local hazards and establishing a robust response framework. Regular training and simulation are the most effective ways to ensure community resilience during unforeseen crisis events.";
    },

    getEquipmentByTitle(title) {
        const t = String(title || '').toLowerCase();
        if (/earthquake/i.test(t)) return ["Sturdy Shoes", "Dust Masks", "Whistle", "Pry Bar"];
        if (/fire/i.test(t)) return ["Fire Extinguisher", "Smoke Hood", "Fire Blanket", "Heat Gloves"];
        if (/flood/i.test(t)) return ["Life Jacket", "Waterproof Boots", "Dry Bag", "Rope"];
        if (/hurricane/i.test(t)) return ["Duct Tape", "Tarps", "Sandbags", "Plywood"];
        if (/tsunami/i.test(t)) return ["Blue Sign Map", "Running Shoes", "Signal Flare", "Life Buoy"];
        if (/cyber|security/i.test(t)) return ["VPN Token", "Encrypted USB", "Backup Drive", "Password Vault"];
        if (/chemical|hazard/i.test(t)) return ["Goggles", "Nitrile Gloves", "Respirator", "Lab Coat"];
        if (/tornado/i.test(t)) return ["Hard Hat", "Heavy Boots", "Battery Radio", "Work Gloves"];
        if (/first|aid/i.test(t)) return ["Tourniquet", "Epi-Pen", "Splint Kit", "Sterile Gauze"];
        return ["First Aid Kit", "Emergency Radio", "72hr Ration", "Flashlight"];
    },

    showModuleViewer(moduleId) {
        try {
            console.log('📖 Attempting to view module:', moduleId);
            this.showToast('Opening module...', 'info');

            // Remove existing modal if any
            const existing = document.getElementById('moduleViewerModal');
            if (existing) existing.remove();

            const modules = App.state.uploadedModules || [];
            const mod = modules.find(m => (m._id === moduleId || m.id === moduleId));

            if (!mod) {
                console.error('❌ Module not found in state. Available IDs:', modules.map(m => m._id || m.id));
                this.showToast('Module content unavailable. Please refresh.', 'error');
                return;
            }

            const modal = document.createElement('div');
            modal.id = 'moduleViewerModal';
            modal.style.cssText = `position:fixed; inset:0; background:rgba(15, 23, 42, 0.98); backdrop-filter:blur(20px); z-index:9999; display:flex; flex-direction:column;`;

            // Dynamically generate content based on title if missing
            const safeContent = mod.content || this.getContentByTitle(mod.title);

            // If we have a local blob URL from a recent upload, embed it
            if (mod.fileUrl) {
                modal.innerHTML = `
                    <div style="height:100%; display:flex; flex-direction:column;">
                        <div style="background:#1e293b; padding:15px 30px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1);">
                            <div style="display:flex; align-items:center; gap:20px;">
                                <div style="background:var(--red); color:white; padding:5px 10px; border-radius:4px; font-size:0.7rem; font-weight:bold;">PDF</div>
                                <h3 style="color:white; margin:0; font-size:1rem;">${mod.fileName || 'Document'}</h3>
                            </div>
                            <button class="btn btn-primary" style="width:auto; padding:8px 15px;" onclick="document.getElementById('moduleViewerModal').remove()">
                                <i class="fas fa-times" style="margin-right:8px;"></i> Close File
                            </button>
                        </div>
                        <iframe src="${mod.fileUrl}" style="flex:1; width:100%; border:none; background:#525659;"></iframe>
                    </div>`;
                document.body.appendChild(modal);
                return;
            }

            modal.innerHTML = `
                <div style="background:#1e293b; padding:15px 30px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <div style="display:flex; align-items:center; gap:20px;">
                        <div style="background:var(--red); color:white; padding:5px 10px; border-radius:4px; font-size:0.7rem; font-weight:bold; letter-spacing:1px;">PDF</div>
                        <div>
                            <h3 style="color:white; margin:0; font-size:1rem;">${mod.fileName || (mod.title + '.pdf')}</h3>
                            <p style="color:var(--text-secondary); font-size:0.75rem; margin:0;">Uploaded by ${mod.createdBy?.name || 'Teacher'} • CrisisCraft Reader</p>
                        </div>
                    </div>
                    <div style="display:flex; gap:15px;">
                        <button class="btn" style="width:auto; padding:8px 15px; background:rgba(255,255,255,0.05); font-size:0.85rem;" onclick="window.print()">
                            <i class="fas fa-print" style="margin-right:8px;"></i> Print
                        </button>
                        <button class="btn btn-primary" style="width:auto; padding:8px 15px; font-size:0.85rem;" onclick="document.getElementById('moduleViewerModal').remove()">
                            <i class="fas fa-times" style="margin-right:8px;"></i> Close File
                        </button>
                    </div>
                </div>
                <div style="flex:1; overflow-y:auto; padding:40px; display:flex; flex-direction:column; align-items:center; gap:40px; background:#525659;">
                    <!-- PAGE 1 -->
                    <div style="width:850px; background:white; min-height:1100px; padding:90px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); color:#334155; font-family:'Inter', serif; position:relative; flex-shrink:0;">
                        <div style="position:absolute; top:40px; right:40px; color:#cbd5e1; font-size:0.8rem; font-weight:bold; border:2px solid #f1f5f9; padding:5px 10px;">OFFICIAL TRAINING DOCUMENT</div>
                        <div style="margin-bottom:60px; border-bottom:2px solid #f1f5f9; padding-bottom:20px;">
                            <span style="color:var(--cyan); font-weight:bold; letter-spacing:2px; font-size:0.8rem;">CRISISCRAFT DPRES-ADL</span>
                        </div>
                        
                        <h1 style="color:#0f172a; margin-bottom:50px; font-size:2.8rem; border-bottom:3px solid #e2e8f0; padding-bottom:25px; text-transform:uppercase; letter-spacing:-1px;">${mod.title}</h1>
                        
                        <div style="line-height:1.8; font-size:1.1rem; text-align:justify;">
                            <p style="margin-bottom:35px; first-letter: font-size: 3rem; float: left; line-height: 1; padding-right: 10px; font-weight: bold; color: #0f172a;">${safeContent.charAt(0)}</p>
                            <p style="margin-bottom:35px;">${safeContent.substring(1)}</p>
                            
                            <div style="background:#f8fafc; border-radius:12px; padding:40px; margin:50px 0; border:1px solid #e2e8f0; position:relative; overflow:hidden;">
                                <div style="position:absolute; top:0; left:0; width:5px; height:100%; background:var(--red);"></div>
                                <h3 style="color:#0f172a; margin-bottom:20px; display:flex; align-items:center; gap:15px;">
                                    <i class="fas fa-exclamation-triangle" style="color:var(--red);"></i> CRITICAL PROTOCOLS
                                </h3>
                                <ul style="padding-left:20px; display:grid; gap:15px; margin-bottom:0;">
                                    ${this.getProtocolsByTitle(mod.title).map(step => `
                                        <li><strong>Action Step:</strong> ${step}</li>
                                    `).join('')}
                                </ul>
                            </div>

                            <p style="margin-top:40px; color:#64748b; font-style:italic;">[Continued on Page 2...]</p>
                        </div>

                        <div style="position:absolute; bottom:40px; left:90px; right:90px; border-top:1px solid #e2e8f0; padding-top:20px; display:flex; justify-content:space-between; color:#94a3b8; font-size:0.75rem;">
                            <span>REF ID: CC-2026-${(mod._id || 'MOCK').substring(0, 8).toUpperCase()}</span>
                            <span>PAGE 1 OF 2</span>
                        </div>
                    </div>

                    <!-- PAGE 2 -->
                    <div style="width:850px; background:white; min-height:1100px; padding:90px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); color:#334155; font-family:'Inter', serif; position:relative; flex-shrink:0;">
                        <h2 style="color:#0f172a; margin-bottom:30px; font-size:1.8rem; border-bottom:2px solid #f1f5f9; padding-bottom:15px;">ADVANCED ANALYSIS & AUTHORIZATION</h2>
                        
                        <div style="line-height:1.8; font-size:1.1rem; text-align:justify;">
                            <h4 style="color:#0f172a; margin-bottom:15px;">RISK MITIGATION STRATEGY</h4>
                            <p style="margin-bottom:30px;">${this.getAnalysisByTitle(mod.title)}</p>
                            
                            <h4 style="color:#0f172a; margin-bottom:15px;">MANDATORY EQUIPMENT CHECKLIST</h4>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:40px; background:#f1f5f9; padding:25px; border-radius:10px;">
                                ${this.getEquipmentByTitle(mod.title).map(item => `
                                    <div style="display:flex; align-items:center; gap:10px;"><i class="far fa-check-square" style="color:var(--cyan);"></i> ${item}</div>
                                `).join('')}
                            </div>

                            <p style="margin-bottom:40px;">This module has been reviewed by the safety commission and is valid for the 2026-2027 academic year. Digital certification will be awarded upon successful completion of the associated quiz with a score of 85% or higher.</p>
                            
                            <div style="margin-top:60px; border-top:1px solid #e2e8f0; padding-top:40px;">
                                <h4 style="margin:0 0 10px; color:#0f172a; font-size:0.9rem; text-transform:uppercase; letter-spacing:1px;">DOCUMENT AUTHORIZATION</h4>
                                <div style="display:flex; align-items:flex-end; justify-content:space-between;">
                                    <div>
                                        <p style="font-size:0.85rem; color:#64748b; margin-bottom:20px;">Digitally signed and approved for distribution:</p>
                                        <div style="font-style:italic; font-family:'Courier New', monospace; color:#1e293b; font-size:1.4rem;">/s/ ${mod.createdBy?.name || 'Authorized Instructor'}</div>
                                        <p style="font-size:0.75rem; color:#94a3b8; margin-top:5px;">CrisisCraft Senior Safety Lead</p>
                                    </div>
                                    <div style="width:100px; height:100px; border:2px solid #f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#f1f5f9; font-size:0.6rem; text-align:center; transform:rotate(-15deg); font-weight:bold;">CRISISCRAFT<br>OFFICIAL SEAL</div>
                                </div>
                            </div>
                        </div>

                        <div style="position:absolute; bottom:40px; left:90px; right:90px; border-top:1px solid #e2e8f0; padding-top:20px; display:flex; justify-content:space-between; color:#94a3b8; font-size:0.75rem;">
                            <span>REF ID: CC-2026-${(mod._id || 'MOCK').substring(0, 8).toUpperCase()}</span>
                            <span>PAGE 2 OF 2</span>
                        </div>
                    </div>
                </div>`;
            document.body.appendChild(modal);
        } catch (error) {
            console.error('❌ Error in showModuleViewer:', error);
            this.showToast('Failed to open module: ' + error.message, 'error');
        }
    },

    interactDrill(index) {
        // TODO: Implement with API call to GET /api/drills/{id} or POST /api/drills/{id}/simulate
        this.showToast('Drill interaction requires API integration', 'info');
    },

    findNextDrillIndex() {
        // TODO: Get next drill from API GET /api/drills/next
        return -1;
    },



    showTakeQuizModal(index) {
        // TODO: Implement with API call to GET /api/quizzes/{id}
        this.showToast('Quiz taking requires API integration', 'info');
        return;
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
        // TODO: Implement with API call to POST /api/quizzes/{id}/submit
        this.showToast('Quiz submitted successfully!', 'success');

        const isAutoGrade = this.state.settings.autoGrade;
        if (isAutoGrade) {
            const mockScore = Math.floor(Math.random() * 5) + 16; // 16-20
            this.showToast(`Auto-Graded: You scored ${mockScore}/20!`, 'success');
        } else {
            this.showToast('Your quiz has been queued for manual review.', 'info');
        }

        document.getElementById('takeQuizModal').remove();
        this.saveState();
        this.render();
    },

    showNotifications() {
        const modal = document.createElement('div');
        modal.id = 'notificationsModal';
        modal.style.cssText = `position:fixed; top:80px; right:85px; width:350px; z-index:2000;`;
        modal.innerHTML = `
            <div class="glass" style="padding:20px; border:1px solid var(--glass-border); box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h4 style="margin:0;">Notifications</h4>
                    <span style="font-size:0.75rem; color:var(--cyan); cursor:pointer;" onclick="this.closest('#notificationsModal').remove()">Clear All</span>
                </div>
                <div style="display:grid; gap:12px;">
                    <div style="padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border-left:3px solid var(--cyan);">
                        <p style="font-size:0.85rem; margin-bottom:4px; font-weight:600;">Upcoming Drill Reminder</p>
                        <p style="font-size:0.75rem; color:var(--text-secondary);">Earthquake Prep is scheduled for tomorrow 10:00 AM.</p>
                    </div>
                    <div style="padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border-left:3px solid var(--green);">
                        <p style="font-size:0.85rem; margin-bottom:4px; font-weight:600;">Quiz Results Published</p>
                        <p style="font-size:0.75rem; color:var(--text-secondary);">Your results for "Fire Safety" are now available.</p>
                    </div>
                </div>
                <button class="btn" style="margin-top:15px; width:100%; font-size:0.8rem; padding:8px;" onclick="document.getElementById('notificationsModal').remove()">Close</button>
            </div>`;
        document.body.appendChild(modal);

        // Auto-close on outside click
        setTimeout(() => {
            const closer = (e) => {
                if (!modal.contains(e.target)) {
                    modal.remove();
                    document.removeEventListener('click', closer);
                }
            };
            document.addEventListener('click', closer);
        }, 0);
    },

    showProfileMenu() {
        const modal = document.createElement('div');
        modal.id = 'profileMenuModal';
        modal.style.cssText = `position:fixed; top:80px; right:20px; width:220px; z-index:2000;`;
        modal.innerHTML = `
            <div class="glass" style="padding:15px; border:1px solid var(--glass-border); box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                <div style="display:grid; gap:8px;">
                    <div style="display:flex; align-items:center; gap:10px; padding:10px; cursor:pointer; border-radius:8px; transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'" onclick="App.changeSection('Settings'); document.getElementById('profileMenuModal').remove();">
                        <i class="fas fa-user-cog" style="color:var(--text-secondary); width:20px;"></i>
                        <span style="font-size:0.9rem;">Profile Settings</span>
                    </div>
                    <div style="height:1px; background:var(--glass-border); margin:5px 0;"></div>
                    <div style="display:flex; align-items:center; gap:10px; padding:10px; cursor:pointer; border-radius:8px; transition:0.2s; color:var(--red);" onmouseover="this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.background='transparent'" onclick="App.logout()">
                        <i class="fas fa-sign-out-alt" style="width:20px;"></i>
                        <span style="font-size:0.9rem; font-weight:600;">Logout</span>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        // Auto-close on outside click
        setTimeout(() => {
            const closer = (e) => {
                if (!modal.contains(e.target)) {
                    modal.remove();
                    document.removeEventListener('click', closer);
                }
            };
            document.addEventListener('click', closer);
        }, 0);
    },

    logout() {
        this.state.isLoggedIn = false;
        this.state.role = null;
        localStorage.removeItem('crisis_craft_token');
        localStorage.removeItem('crisis_craft_user');
        this.render();
    },

};

// Explicitly expose App to window for HTML event handlers
window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());
