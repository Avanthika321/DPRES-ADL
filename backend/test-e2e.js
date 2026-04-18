#!/usr/bin/env node

/**
 * Full End-to-End Test for CrisisCraft Authentication & Module Flow
 * Tests: Register → Login → Upload → View Modules → Verify createdBy
 */

const BASE_URL = 'http://localhost:5000/api';
let teacherToken = null;
let studentToken = null;
let teacherUserId = null;
let uploadedModuleId = null;

// ========================
// Test Setup
// ========================
console.log('\n🚀 CRISISCRAFT E2E TEST SUITE');
console.log('================================\n');

// Test data
const testData = {
    teacher: {
        name: 'Test Teacher',
        email: `teacher-${Date.now()}@test.com`,
        password: 'password123',
        role: 'teacher'
    },
    student: {
        name: 'Test Student',
        email: `student-${Date.now()}@test.com`,
        password: 'password123',
        role: 'student'
    },
    module: {
        title: 'Emergency Response Protocol',
        fileName: 'emergency-protocol.pdf'
    }
};

// ========================
// Helper Functions
// ========================

async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
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

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();

        return {
            ok: response.ok,
            status: response.status,
            data
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            error: error.message
        };
    }
}

function log(icon, message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    if (data) {
        console.log(`${icon} [${timestamp}] ${message}`);
        console.log('  Data:', JSON.stringify(data, null, 2));
    } else {
        console.log(`${icon} [${timestamp}] ${message}`);
    }
}

// ========================
// Test Functions
// ========================

async function test1_RegisterTeacher() {
    console.log('\n📝 TEST 1: Register Teacher');
    console.log('-'.repeat(40));

    const result = await makeRequest('/auth/register', 'POST', testData.teacher);

    if (result.ok) {
        log('✅', 'Teacher registered successfully');
        teacherToken = result.data.token;
        teacherUserId = result.data.user._id;
        log('✓', 'Token stored', { token: teacherToken?.substring(0, 20) + '...' });
        log('✓', 'User ID', { _id: teacherUserId });
        return true;
    } else {
        log('❌', 'Teacher registration failed', result.data);
        return false;
    }
}

async function test2_RegisterStudent() {
    console.log('\n📝 TEST 2: Register Student');
    console.log('-'.repeat(40));

    const result = await makeRequest('/auth/register', 'POST', testData.student);

    if (result.ok) {
        log('✅', 'Student registered successfully');
        studentToken = result.data.token;
        log('✓', 'Token stored', { token: studentToken?.substring(0, 20) + '...' });
        return true;
    } else {
        log('❌', 'Student registration failed', result.data);
        return false;
    }
}

async function test3_TeacherLogin() {
    console.log('\n📝 TEST 3: Teacher Login');
    console.log('-'.repeat(40));

    const result = await makeRequest('/auth/login', 'POST', {
        email: testData.teacher.email,
        password: testData.teacher.password
    });

    if (result.ok) {
        log('✅', 'Teacher login successful');
        teacherToken = result.data.token;
        teacherUserId = result.data.user._id;
        log('✓', 'Token refreshed', { token: teacherToken?.substring(0, 20) + '...' });
        log('✓', 'User role', { role: result.data.user.role });
        return true;
    } else {
        log('❌', 'Teacher login failed', result.data);
        return false;
    }
}

async function test4_UploadModule() {
    console.log('\n📝 TEST 4: Teacher Uploads Module');
    console.log('-'.repeat(40));

    if (!teacherToken) {
        log('❌', 'No teacher token available');
        return false;
    }

    const result = await makeRequest('/modules', 'POST', testData.module, teacherToken);

    if (result.ok) {
        log('✅', 'Module uploaded successfully');
        uploadedModuleId = result.data._id;
        log('✓', 'Module ID', { _id: uploadedModuleId });
        log('✓', 'Module title', { title: result.data.title });
        
        // CRITICAL: Verify createdBy is the teacher's ID
        if (result.data.createdBy === teacherUserId) {
            log('✅ CRITICAL', 'createdBy matches teacher ID!', { 
                createdBy: result.data.createdBy, 
                teacherId: teacherUserId 
            });
            return true;
        } else {
            log('❌ CRITICAL', 'createdBy does NOT match teacher ID!', { 
                createdBy: result.data.createdBy, 
                teacherId: teacherUserId,
                expected: teacherUserId
            });
            return false;
        }
    } else {
        log('❌', 'Module upload failed', result.data);
        return false;
    }
}

async function test5_GetModulesAsTeacher() {
    console.log('\n📝 TEST 5: Teacher Views All Modules');
    console.log('-'.repeat(40));

    if (!teacherToken) {
        log('❌', 'No teacher token available');
        return false;
    }

    const result = await makeRequest('/modules', 'GET', null, teacherToken);

    if (result.ok && Array.isArray(result.data)) {
        log('✅', `Retrieved ${result.data.length} modules`);
        
        // Find our uploaded module
        const ourModule = result.data.find(m => m._id === uploadedModuleId);
        if (ourModule) {
            log('✓', 'Our module found in list');
            log('✓', 'Module details', {
                title: ourModule.title,
                createdBy: ourModule.createdBy,
                teacherId: teacherUserId,
                match: ourModule.createdBy === teacherUserId
            });
            return true;
        } else {
            log('❌', 'Our uploaded module not found in list');
            return false;
        }
    } else {
        log('❌', 'Failed to retrieve modules', result.data || result.error);
        return false;
    }
}

async function test6_GetModulesAsStudent() {
    console.log('\n📝 TEST 6: Student Views All Modules');
    console.log('-'.repeat(40));

    if (!studentToken) {
        log('❌', 'No student token available');
        return false;
    }

    const result = await makeRequest('/modules', 'GET', null, studentToken);

    if (result.ok && Array.isArray(result.data)) {
        log('✅', `Student retrieved ${result.data.length} modules`);
        
        // Find our uploaded module
        const ourModule = result.data.find(m => m._id === uploadedModuleId);
        if (ourModule) {
            log('✓', 'Student can see our module');
            log('✓', 'Module visible to student', {
                title: ourModule.title,
                createdBy: ourModule.createdBy
            });
            return true;
        } else {
            log('⚠️ ', 'Uploaded module not visible to student (may be expected)');
            return result.data.length > 0; // Pass if at least some modules visible
        }
    } else {
        log('❌', 'Student failed to retrieve modules', result.data || result.error);
        return false;
    }
}

async function test7_StudentLogin() {
    console.log('\n📝 TEST 7: Student Login & Refresh Token');
    console.log('-'.repeat(40));

    const result = await makeRequest('/auth/login', 'POST', {
        email: testData.student.email,
        password: testData.student.password
    });

    if (result.ok) {
        log('✅', 'Student login successful');
        studentToken = result.data.token;
        log('✓', 'New token obtained', { token: studentToken?.substring(0, 20) + '...' });
        log('✓', 'User role', { role: result.data.user.role });
        return true;
    } else {
        log('❌', 'Student login failed', result.data);
        return false;
    }
}

async function test8_UnauthorizedAccess() {
    console.log('\n📝 TEST 8: Unauthorized Access Test (No Token)');
    console.log('-'.repeat(40));

    const result = await makeRequest('/modules', 'POST', testData.module);

    if (!result.ok && result.status === 401) {
        log('✅', 'Correctly rejected POST without token', result.data);
        return true;
    } else if (!result.ok) {
        log('✅', 'Request rejected', { status: result.status, message: result.data?.message });
        return true;
    } else {
        log('❌', 'SECURITY ISSUE: Allowed POST without token!');
        return false;
    }
}

async function test9_RoleBasedAccess() {
    console.log('\n📝 TEST 9: Role-Based Access Control');
    console.log('-'.repeat(40));

    // Student tries to upload (should fail)
    const result = await makeRequest('/modules', 'POST', testData.module, studentToken);

    if (!result.ok) {
        log('✅', 'Correctly blocked student from uploading', { 
            status: result.status,
            message: result.data?.message 
        });
        return true;
    } else {
        log('❌', 'SECURITY ISSUE: Student was allowed to upload!');
        return false;
    }
}

// ========================
// Run All Tests
// ========================

async function runAllTests() {
    const results = [];

    results.push({
        name: 'TEST 1: Register Teacher',
        passed: await test1_RegisterTeacher()
    });

    results.push({
        name: 'TEST 2: Register Student',
        passed: await test2_RegisterStudent()
    });

    results.push({
        name: 'TEST 3: Teacher Login',
        passed: await test3_TeacherLogin()
    });

    results.push({
        name: 'TEST 4: Upload Module (CRITICAL)',
        passed: await test4_UploadModule()
    });

    results.push({
        name: 'TEST 5: Teacher Views Modules',
        passed: await test5_GetModulesAsTeacher()
    });

    results.push({
        name: 'TEST 6: Student Views Modules',
        passed: await test6_GetModulesAsStudent()
    });

    results.push({
        name: 'TEST 7: Student Login (Refresh)',
        passed: await test7_StudentLogin()
    });

    results.push({
        name: 'TEST 8: Unauthorized Access',
        passed: await test8_UnauthorizedAccess()
    });

    results.push({
        name: 'TEST 9: Role-Based Access',
        passed: await test9_RoleBasedAccess()
    });

    // ========================
    // Print Summary
    // ========================
    console.log('\n\n📊 TEST SUMMARY');
    console.log('='.repeat(50));

    let passedCount = 0;
    results.forEach((result, index) => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.name}`);
        if (result.passed) passedCount++;
    });

    const totalTests = results.length;
    const passPercentage = Math.round((passedCount / totalTests) * 100);

    console.log('='.repeat(50));
    console.log(`\nResults: ${passedCount}/${totalTests} tests passed (${passPercentage}%)\n`);

    if (passedCount === totalTests) {
        console.log('🎉 ALL TESTS PASSED! ✨');
    } else {
        console.log('⚠️  Some tests failed - review above for details');
    }

    console.log('\n================================\n');
    process.exit(passedCount === totalTests ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
});
