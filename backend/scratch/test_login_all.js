
async function test(email, password) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log(`Test [${email}, ${password}]: Status ${response.status}, Message: "${data.message}"`);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

async function run() {
    console.log('--- Testing Login Errors ---');
    // Case 1: Wrong username
    await test('nonexistent@user.com', '');
    // Case 2: Wrong password
    await test('admin@crisiscraft.edu', 'wrongpass');
    // Case 3: Both wrong?
    await test('nonexistent@user.com', 'somepass');
}
run();
