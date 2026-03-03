document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('nav li');
    const sections = document.querySelectorAll('section');

    // Section Switching Logic
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show relevant section
            // In a real app, this would dynamically load/render content
            // For now, we'll implement the specific sections requested
            renderSection(sectionId);
        });
    });

    function renderSection(id) {
        const contentArea = document.getElementById('content-area');

        if (id === 'overview') {
            location.reload();
            return;
        }

        let html = '';
        switch (id) {
            case 'users':
                html = `
                    <section class="active-section">
                        <div class="section-header glass">
                            <h2>Manage Users</h2>
                            <button class="add-btn">+ Add New User</button>
                        </div>
                        <div class="table-container glass float-3d" style="margin-top: 20px;">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><div class="user-cell"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt=""> John Doe</div></td>
                                        <td>Student</td>
                                        <td><span class="status-badge active">Active</span></td>
                                        <td><button class="icon-btn"><i class="fas fa-edit"></i></button> <button class="icon-btn delete"><i class="fas fa-trash"></i></button></td>
                                    </tr>
                                    <tr>
                                        <td><div class="user-cell"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" alt=""> Jane Smith</div></td>
                                        <td>Teacher</td>
                                        <td><span class="status-badge active">Active</span></td>
                                        <td><button class="icon-btn"><i class="fas fa-edit"></i></button> <button class="icon-btn delete"><i class="fas fa-trash"></i></button></td>
                                    </tr>
                                    <tr>
                                        <td><div class="user-cell"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" alt=""> Mike Ross</div></td>
                                        <td>Student</td>
                                        <td><span class="status-badge inactive">Inactive</span></td>
                                        <td><button class="icon-btn"><i class="fas fa-edit"></i></button> <button class="icon-btn delete"><i class="fas fa-trash"></i></button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                `;
                break;
            case 'drills':
                html = `
                    <section class="active-section">
                        <div class="drill-layout">
                            <div class="drill-form glass float-3d">
                                <h3>Create Virtual Drill</h3>
                                <div class="form-group">
                                    <label>Drill Title</label>
                                    <input type="text" placeholder="e.g., Earthquake Evacuation">
                                </div>
                                <div class="form-group">
                                    <label>Disaster Type</label>
                                    <select>
                                        <option>Flood</option>
                                        <option>Earthquake</option>
                                        <option>Cyclone</option>
                                        <option>Fire</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Question</label>
                                    <textarea placeholder="Ask a question..."></textarea>
                                </div>
                                <div class="options-grid">
                                    <input type="text" placeholder="Option A">
                                    <input type="text" placeholder="Option B">
                                    <input type="text" placeholder="Option C">
                                    <input type="text" placeholder="Option D">
                                </div>
                                <div class="form-group">
                                    <label>Correct Answer</label>
                                    <select>
                                        <option>Option A</option>
                                        <option>Option B</option>
                                        <option>Option C</option>
                                        <option>Option D</option>
                                    </select>
                                </div>
                                <button class="publish-btn">Publish Drill</button>
                            </div>
                            <div class="drill-list-container">
                                <h3>Recently Created Drills</h3>
                                <div class="drill-card glass float-3d">
                                    <div class="drill-icon fire"><i class="fas fa-fire"></i></div>
                                    <div class="drill-info">
                                        <h4>Fire Safety 101</h4>
                                        <p>Created: 2 days ago</p>
                                    </div>
                                </div>
                                <div class="drill-card glass float-3d">
                                    <div class="drill-icon water"><i class="fas fa-tint"></i></div>
                                    <div class="drill-info">
                                        <h4>Flood Prevention</h4>
                                        <p>Created: 5 days ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                `;
                break;
            case 'reports':
                html = `
                    <section class="active-section">
                        <div class="reports-grid">
                            <div class="chart-box glass float-3d">
                                <h3>Disaster Awareness Level</h3>
                                <div class="pie-chart-mock">
                                    <div class="slice" style="--bg: var(--electric-cyan); --deg: 120deg;"></div>
                                    <div class="slice" style="--bg: var(--neon-red); --deg: 240deg;"></div>
                                    <div class="slice" style="--bg: #ffcc00; --deg: 360deg;"></div>
                                </div>
                                <div class="legend">
                                    <span><i style="background: var(--electric-cyan)"></i> High</span>
                                    <span><i style="background: var(--neon-red)"></i> Medium</span>
                                    <span><i style="background: #ffcc00"></i> Low</span>
                                </div>
                            </div>
                            <div class="progress-box glass float-3d">
                                <h3>Readiness Progress</h3>
                                <div class="prog-item">
                                    <p>Flood Response</p>
                                    <div class="prog-bar"><div class="fill" style="width: 80%"></div></div>
                                </div>
                                <div class="prog-item">
                                    <p>Fire Safety</p>
                                    <div class="prog-bar"><div class="fill" style="width: 65%"></div></div>
                                </div>
                                <div class="prog-item">
                                    <p>Earthquake Prep</p>
                                    <div class="prog-bar"><div class="fill" style="width: 90%"></div></div>
                                </div>
                            </div>
                        </div>
                    </section>
                `;
                break;
            case 'alerts':
                html = `
                    <section class="active-section alerts-page">
                        <div class="alert-broadcast glass float-3d">
                            <div class="alert-icon-main pulse-btn"><i class="fas fa-bullhorn"></i></div>
                            <h2>Crisis Broadcast Center</h2>
                            <textarea placeholder="Type your emergency message here..."></textarea>
                            <div class="target-group">
                                <label>Target Group:</label>
                                <select>
                                    <option>All Users</option>
                                    <option>Students Only</option>
                                    <option>Teachers Only</option>
                                </select>
                            </div>
                            <button class="pulse-btn" style="width: 100%; margin-top: 20px;">Send Immediate Alert</button>
                        </div>
                    </section>
                `;
                break;
            default:
                html = `<div class="glass" style="padding: 40px;"><h2>${id} Section</h2><p>Coming soon...</p></div>`;
        }

        contentArea.innerHTML = html;

        // Re-attach 3D effects to new elements
        setTimeout(() => {
            const newCards = contentArea.querySelectorAll('.float-3d');
            newCards.forEach(card => attach3DEffect(card));
        }, 100);
    }

    function attach3DEffect(card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (centerY - y) / 10;
            const rotateY = (x - centerX) / 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)`;
        });
    }

    // Initial 3D Tilt Effect on cards
    const initialCards = document.querySelectorAll('.float-3d');
    initialCards.forEach(card => attach3DEffect(card));
});
