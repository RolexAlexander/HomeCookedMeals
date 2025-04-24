document.addEventListener('DOMContentLoaded', () => {
    console.log("AUTH_APP: DOM fully loaded.");

    // --- Check if already logged in ---
    if (Api.isLoggedIn()) {
        console.log("AUTH_APP: User already logged in. Redirecting to home.");
        // Redirect away from auth page if logged in
        window.location.replace('/'); // Use replace to avoid history entry
        return; // Stop further execution
    }

    // --- Element References ---
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    // const authMessage = document.getElementById('auth-message'); // If using message div

    // Input Fields (for clearing/focusing etc.)
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const registerNameInput = document.getElementById('register-name');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const registerConfirmPasswordInput = document.getElementById('register-confirm-password');


    // --- Helper Functions ---
    if (typeof showToast !== 'function') {
        console.warn("AUTH_APP: showToast function not found. Using basic alert.");
        window.showToast = (message, type = 'info') => alert(`[${type.toUpperCase()}] ${message}`);
    }

    function showLogin() {
        loginSection.classList.remove('hidden');
        registerSection.classList.add('hidden');
        // Clear register form if needed
        registerForm.reset();
        document.title = "Login - Home Cooked Meals";
    }

    function showRegister() {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
         // Clear login form if needed
        loginForm.reset();
        document.title = "Register - Home Cooked Meals";
    }

    // --- Event Handlers ---
    async function handleLoginSubmit(event) {
        event.preventDefault();
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        const credentials = {
            email: loginEmailInput.value.trim(),
            password: loginPasswordInput.value
        };

        console.log("AUTH_APP: Attempting login with:", credentials.email);

        try {
            const result = await Api.login(credentials);

            if (result.status === 200 && result.body.success) {
                console.log("AUTH_APP: Login successful!", result.body.user);
                showToast("Login successful! Redirecting...", 'success', 2000);
                // Token stored automatically by Api.js
                // Redirect after a short delay for toast
                setTimeout(() => { window.location.href = '/'; }, 1000);
            } else {
                console.error("AUTH_APP: Login failed:", result.body.message);
                showToast(`Login failed: ${result.body.message || 'Invalid credentials'}`, 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        } catch (error) {
            console.error("AUTH_APP: Error during login API call:", error);
            showToast("An unexpected error occurred during login. Please try again.", 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    }

    async function handleRegisterSubmit(event) {
        event.preventDefault();
        const submitButton = registerForm.querySelector('button[type="submit"]');

        const name = registerNameInput.value.trim();
        const email = registerEmailInput.value.trim();
        const password = registerPasswordInput.value;
        const confirmPassword = registerConfirmPasswordInput.value;

        // Basic Validation
        if (password !== confirmPassword) {
            showToast("Passwords do not match.", 'error');
            registerConfirmPasswordInput.focus(); // Focus the mismatching field
            return;
        }
         if (password.length < 6) { // Example length check
             showToast("Password must be at least 6 characters long.", 'error');
             registerPasswordInput.focus();
             return;
         }

        submitButton.disabled = true;
        submitButton.textContent = 'Registering...';

        const userData = { name, email, password };
        console.log("AUTH_APP: Attempting registration for:", userData.email);

        try {
            const result = await Api.register(userData);

            if (result.status === 201 && result.body.success) { // 201 Created usually for register
                console.log("AUTH_APP: Registration successful!", result.body.user);
                showToast("Registration successful! Please log in.", 'success');
                // Automatically switch to login view after successful registration
                showLogin();
                // Optionally pre-fill login email
                loginEmailInput.value = email;
                loginPasswordInput.focus();

            } else {
                console.error("AUTH_APP: Registration failed:", result.body.message);
                // API likely returns 400 or similar if email exists etc.
                showToast(`Registration failed: ${result.body.message || 'Could not register'}`, 'error');
            }
        } catch (error) {
            console.error("AUTH_APP: Error during registration API call:", error);
            showToast("An unexpected error occurred during registration. Please try again.", 'error');
        } finally {
            // Re-enable button regardless of success/failure ONLY IF not switching view
            // Since we switch view on success, only re-enable on failure
             if (!(result && result.status === 201 && result.body.success)) {
                 submitButton.disabled = false;
                 submitButton.textContent = 'Register';
            }
        }
    }

    // --- Attach Event Listeners ---
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegister();
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLogin();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }

     // --- Update Cart Count (initial, likely 0 if not logged in) ---
     // Assuming updateCartCount is globally available from script.js
     if (typeof updateCartCount === 'function') {
          // updateCartCount(); // Might be confusing if not logged in
          // OR explicitly set header cart count if element exists
          const cartCountHeaderEl = document.getElementById('cart-count');
          if(cartCountHeaderEl) cartCountHeaderEl.textContent = '0';
     }


    // --- Initial State ---
    showLogin(); // Show login form by default

    console.log("AUTH_APP: Initialization complete. Waiting for user interaction.");

}); // End DOMContentLoaded