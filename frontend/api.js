/**
 * API Helper for Frontend
 * Handles authentication and API calls to backend
 */

const API_URL = 'http://localhost:5000/api';

// ========================
// Authentication Functions
// ========================

function storeToken(token) {
    localStorage.setItem('crisis_craft_token', token);
}

function getToken() {
    return localStorage.getItem('crisis_craft_token');
}

function clearToken() {
    localStorage.removeItem('crisis_craft_token');
}

// ========================
// Generic API Request Function
// ========================

async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('❌ API Request Failed:', error.message);
        throw error;
    }
}

// ========================
// Authentication API Calls
// ========================

async function loginUser(email, password) {
    const response = await apiRequest('/auth/login', 'POST', { email, password });
    if (response.token) {
        storeToken(response.token);
    }
    return response;
}

async function registerUser(name, email, password, role) {
    const response = await apiRequest('/auth/register', 'POST', { name, email, password, role });
    if (response.token) {
        storeToken(response.token);
    }
    return response;
}

function logoutUser() {
    clearToken();
}

// ========================
// Module API Calls
// ========================

async function getModules() {
    return await apiRequest('/modules', 'GET');
}

async function getModule(id) {
    return await apiRequest(`/modules/${id}`, 'GET');
}

async function createModule(title, fileName, content, disasterType) {
    return await apiRequest('/modules', 'POST', { title, fileName, content, disasterType });
}

async function deleteModule(id) {
    return await apiRequest(`/modules/${id}`, 'DELETE');
}

async function trackModuleProgress(id, percentComplete) {
    return await apiRequest(`/modules/${id}/progress`, 'POST', { percentComplete });
}

async function startModuleProgress(id) {
    return await apiRequest(`/modules/${id}/start`, 'POST');
}

async function getMyModuleProgress() {
    return await apiRequest('/modules/my-progress', 'GET');
}

// ========================
// Quiz API Calls
// ========================

async function getQuizzes() {
    return await apiRequest('/quizzes', 'GET');
}

async function getQuiz(id) {
    return await apiRequest(`/quizzes/${id}`, 'GET');
}

async function createQuiz(quizData) {
    return await apiRequest('/quizzes', 'POST', quizData);
}

async function updateQuiz(id, quizData) {
    return await apiRequest(`/quizzes/${id}`, 'PATCH', quizData);
}

async function deleteQuiz(id) {
    return await apiRequest(`/quizzes/${id}`, 'DELETE');
}

async function submitQuiz(quizId, answers) {
    return await apiRequest('/quizzes/submit', 'POST', { quizId, answers });
}

async function getMyQuizResults() {
    return await apiRequest('/quizzes/my-results', 'GET');
}

// ========================
// Drill API Calls
// ========================

async function getDrills() {
    return await apiRequest('/drills', 'GET');
}

async function getDrill(id) {
    return await apiRequest(`/drills/${id}`, 'GET');
}

async function createDrill(drillData) {
    return await apiRequest('/drills', 'POST', drillData);
}

async function updateDrill(id, drillData) {
    return await apiRequest(`/drills/${id}`, 'PUT', drillData);
}

async function deleteDrill(id) {
    return await apiRequest(`/drills/${id}`, 'DELETE');
}

async function registerForDrill(id) {
    return await apiRequest(`/drills/${id}/register`, 'POST');
}

async function getNextDrill() {
    return await apiRequest('/drills/next', 'GET');
}

async function getDrillParticipation() {
    return await apiRequest('/drills/participation', 'GET');
}

// ========================
// Admin API Calls
// ========================

async function getAdminStats() {
    return await apiRequest('/admin/stats', 'GET');
}

async function getAllUsers() {
    return await apiRequest('/admin/users', 'GET');
}

async function adminCreateUser(userData) {
    return await apiRequest('/admin/users', 'POST', userData);
}

async function adminDeleteUser(id) {
    return await apiRequest(`/admin/users/${id}`, 'DELETE');
}

async function adminUpdateUser(id, userData) {
    return await apiRequest(`/admin/users/${id}`, 'PATCH', userData);
}

async function getLeaderboard() {
    return await apiRequest('/admin/leaderboard', 'GET');
}

async function sendAdminAlert(message, type) {
    return await apiRequest('/admin/alerts', 'POST', { message, type });
}

async function getActiveAlerts() {
    return await apiRequest('/admin/alerts', 'GET');
}

async function dismissAlert(id) {
    return await apiRequest(`/admin/alerts/${id}`, 'DELETE');
}

async function getDetailedReports() {
    return await apiRequest('/admin/reports', 'GET');
}

// ========================
// Student/Teacher API Calls
// ========================

async function getStudentStats() {
    return await apiRequest('/student/stats', 'GET');
}

async function getAchievements() {
    return await apiRequest('/student/achievements', 'GET');
}

async function getTeacherStats() {
    return await apiRequest('/teacher/stats', 'GET');
}

async function getStudentPerformanceStats() {
    return await apiRequest('/teacher/student-performance', 'GET');
}

// ========================
// Export Functions
// ========================
window.apiRequest = apiRequest;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.getModules = getModules;
window.getModule = getModule;
window.createModule = createModule;
window.deleteModule = deleteModule;
window.trackModuleProgress = trackModuleProgress;
window.startModuleProgress = startModuleProgress;
window.getMyModuleProgress = getMyModuleProgress;
window.getQuizzes = getQuizzes;
window.getQuiz = getQuiz;
window.createQuiz = createQuiz;
window.updateQuiz = updateQuiz;
window.deleteQuiz = deleteQuiz;
window.submitQuiz = submitQuiz;
window.getMyQuizResults = getMyQuizResults;
window.getDrills = getDrills;
window.getDrill = getDrill;
window.createDrill = createDrill;
window.updateDrill = updateDrill;
window.deleteDrill = deleteDrill;
window.registerForDrill = registerForDrill;
window.getNextDrill = getNextDrill;
window.getDrillParticipation = getDrillParticipation;
window.getAdminStats = getAdminStats;
window.getAllUsers = getAllUsers;
window.adminCreateUser = adminCreateUser;
window.adminDeleteUser = adminDeleteUser;
window.adminUpdateUser = adminUpdateUser;
window.getLeaderboard = getLeaderboard;
window.sendAdminAlert = sendAdminAlert;
window.getActiveAlerts = getActiveAlerts;
window.dismissAlert = dismissAlert;
window.getDetailedReports = getDetailedReports;
window.getStudentStats = getStudentStats;
window.getAchievements = getAchievements;
window.getTeacherStats = getTeacherStats;
window.getStudentPerformanceStats = getStudentPerformanceStats;
