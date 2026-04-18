/**
 * API Helper for Frontend
 * Handles authentication and API calls to backend
 */

const API_URL = 'http://localhost:5000/api';

// ========================
// Authentication Functions
// ========================

/**
 * Store JWT token in localStorage after login
 * Called after successful login response from backend
 */
function storeToken(token) {
    console.log('🔑 Storing token in localStorage');
    localStorage.setItem('token', token);
    console.log('✓ Token stored');
}

/**
 * Retrieve JWT token from localStorage
 */
function getToken() {
    const token = localStorage.getItem('token');
    console.log('🔍 Retrieved token from localStorage');
    return token;
}

/**
 * Clear token (logout)
 */
function clearToken() {
    console.log('🔓 Clearing token from localStorage');
    localStorage.removeItem('token');
    console.log('✓ Token cleared');
}

// ========================
// Generic API Request Function
// ========================

/**
 * Make API request with automatic JWT token attachment
 * @param {string} endpoint - API endpoint (e.g., '/modules')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} body - Request body (for POST, PUT)
 * @returns {Promise<object>} Response data
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const token = getToken();
        
        // Prepare headers
        const headers = {
            'Content-Type': 'application/json'
        };

        // 🔐 CRITICAL: Attach JWT token in Authorization header
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('✓ JWT token attached to request');
        } else {
            console.warn('⚠️  No token found - request will not be authenticated');
        }

        // Prepare request options
        const options = {
            method,
            headers
        };

        // Add body for POST/PUT requests
        if (body) {
            options.body = JSON.stringify(body);
            console.log('📤 Request body:', body);
        }

        console.log(`📡 ${method} ${API_URL}${endpoint}`);

        // Make request
        const response = await fetch(`${API_URL}${endpoint}`, options);

        // Handle response
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✓ Response received:', data);
        return data;

    } catch (error) {
        console.error('❌ API Request Failed:', error.message);
        throw error;
    }
}

// ========================
// Authentication API Calls
// ========================

/**
 * Login user and store token
 */
async function loginUser(email, password) {
    try {
        console.log('🔐 Attempting login...');
        const response = await apiRequest('/auth/login', 'POST', { email, password });
        
        // Store token from response
        if (response.token) {
            storeToken(response.token);
            console.log('✅ Login successful, user:', response.user);
            return response;
        }
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        throw error;
    }
}

/**
 * Register new user
 */
async function registerUser(name, email, password, role) {
    try {
        console.log('📝 Attempting registration...');
        const response = await apiRequest('/auth/register', 'POST', { 
            name, 
            email, 
            password, 
            role 
        });
        
        // Store token from response
        if (response.token) {
            storeToken(response.token);
            console.log('✅ Registration successful, user:', response.user);
            return response;
        }
    } catch (error) {
        console.error('❌ Registration failed:', error.message);
        throw error;
    }
}

/**
 * Logout user
 */
function logoutUser() {
    clearToken();
    console.log('✅ Logout successful');
    // Optionally redirect to login page
    // window.location.href = '/index.html';
}

// ========================
// Module API Calls
// ========================

/**
 * Get all modules
 */
async function getModules() {
    try {
        console.log('📚 Fetching modules...');
        return await apiRequest('/modules', 'GET');
    } catch (error) {
        console.error('❌ Failed to fetch modules:', error.message);
        throw error;
    }
}

/**
 * Create a new module
 * IMPORTANT: Must be authenticated (teacher or admin)
 */
async function createModule(title, fileName) {
    try {
        console.log('✍️  Creating module...');
        const token = getToken();
        
        if (!token) {
            throw new Error('No token found. User must be logged in to create modules.');
        }

        const response = await apiRequest('/modules', 'POST', { 
            title, 
            fileName 
        });
        
        console.log('✅ Module created successfully');
        console.log('Module ID:', response._id);
        console.log('Created by:', response.createdBy);
        
        return response;
    } catch (error) {
        console.error('❌ Failed to create module:', error.message);
        throw error;
    }
}

// ========================
// Usage Examples
// ========================

/*
// EXAMPLE 1: Login
async function exampleLogin() {
    try {
        const result = await loginUser('jane.smith@crisiscraft.edu', 'teacher');
        console.log('Logged in as:', result.user.email);
        console.log('User ID:', result.user._id);
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// EXAMPLE 2: Create Module (after login)
async function exampleCreateModule() {
    try {
        const module = await createModule('Fire Safety', 'fire-safety.pdf');
        console.log('New module created with ID:', module._id);
    } catch (error) {
        alert('Failed to create module: ' + error.message);
    }
}

// EXAMPLE 3: Get Modules
async function exampleGetModules() {
    try {
        const modules = await getModules();
        console.log('Modules:', modules);
    } catch (error) {
        alert('Failed to fetch modules: ' + error.message);
    }
}

// EXAMPLE 4: Full flow
async function exampleFullFlow() {
    try {
        // 1. Login
        await loginUser('jane.smith@crisiscraft.edu', 'teacher');
        
        // 2. Create module
        const module = await createModule('Earthquake Preparedness', 'earthquake.pdf');
        console.log('Module created:', module);
        
        // 3. Fetch all modules
        const modules = await getModules();
        console.log('All modules:', modules);
        
        // 4. Logout
        logoutUser();
    } catch (error) {
        console.error('Error:', error.message);
    }
}
*/

// ========================
// Export Functions (for use in other scripts)
// ========================
// Make functions available globally or as exports
window.apiRequest = apiRequest;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.getModules = getModules;
window.createModule = createModule;
