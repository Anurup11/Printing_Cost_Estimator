(() => {
    const STORAGE_KEYS = {
        users: 'adrUsers',
        session: 'adrCurrentUser'
    };

    function readJson(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    function getUsers() {
        return readJson(STORAGE_KEYS.users, []);
    }

    function saveUsers(users) {
        writeJson(STORAGE_KEYS.users, users);
    }

    function getCurrentUser() {
        return readJson(STORAGE_KEYS.session, null);
    }

    function saveCurrentUser(user) {
        if (user) {
            writeJson(STORAGE_KEYS.session, user);
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.session);
        }
    }

    function setFeedback(element, message, isError) {
        if (!element) {
            return;
        }

        element.textContent = message || '';
        element.style.color = isError ? '#c53b2c' : '#2e6fa3';
    }

    function initNavigation() {
        const toggle = document.getElementById('navToggle');
        const links = document.getElementById('homeNavLinks');

        if (!toggle || !links) {
            return;
        }

        function closeMenu() {
            toggle.classList.remove('is-active');
            links.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', () => {
            const isOpen = links.classList.toggle('is-open');
            toggle.classList.toggle('is-active', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        links.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 820) {
                    closeMenu();
                }
            });
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 820) {
                closeMenu();
            }
        });
    }

    function initAuth() {
        const authModal = document.getElementById('authModal');
        const authModalClose = document.getElementById('authModalClose');
        const authTabLogin = document.getElementById('authTabLogin');
        const authTabSignUp = document.getElementById('authTabSignUp');
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const authFeedback = document.getElementById('authFeedback');
        const userStatus = document.getElementById('userStatus');
        const currentUserName = document.getElementById('currentUserName');
        const logoutBtn = document.getElementById('logoutBtn');

        if (!authModal) {
            return;
        }

        function switchAuthTab(mode) {
            const showLogin = mode !== 'signup';

            loginForm?.classList.toggle('hidden', !showLogin);
            signupForm?.classList.toggle('hidden', showLogin);
            authTabLogin?.classList.toggle('hp-modal-tab-active', showLogin);
            authTabSignUp?.classList.toggle('hp-modal-tab-active', !showLogin);
            setFeedback(authFeedback, '', false);
        }

        function openAuthModal(mode) {
            switchAuthTab(mode);
            authModal.classList.add('active');
            authModal.setAttribute('aria-hidden', 'false');
        }

        function closeAuthModal() {
            authModal.classList.remove('active');
            authModal.setAttribute('aria-hidden', 'true');
            setFeedback(authFeedback, '', false);
        }

        function renderAuthState() {
            const currentUser = getCurrentUser();
            const isLoggedIn = Boolean(currentUser);

            loginBtn?.classList.toggle('hidden', isLoggedIn);
            signupBtn?.classList.toggle('hidden', isLoggedIn);
            userStatus?.classList.toggle('hidden', !isLoggedIn);

            if (currentUserName) {
                currentUserName.textContent = currentUser?.name || '';
            }
        }

        loginBtn?.addEventListener('click', () => openAuthModal('login'));
        signupBtn?.addEventListener('click', () => openAuthModal('signup'));
        authModalClose?.addEventListener('click', closeAuthModal);
        authTabLogin?.addEventListener('click', () => switchAuthTab('login'));
        authTabSignUp?.addEventListener('click', () => switchAuthTab('signup'));

        authModal.addEventListener('click', (event) => {
            if (event.target === authModal) {
                closeAuthModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && authModal.classList.contains('active')) {
                closeAuthModal();
            }
        });

        loginForm?.addEventListener('submit', (event) => {
            event.preventDefault();

            const email = document.getElementById('loginEmail')?.value.trim().toLowerCase() || '';
            const password = document.getElementById('loginPassword')?.value || '';
            const users = getUsers();
            const match = users.find((user) => user.email === email && user.password === password);

            if (!match) {
                setFeedback(authFeedback, 'Invalid email or password.', true);
                return;
            }

            saveCurrentUser({
                name: match.name,
                email: match.email
            });
            renderAuthState();
            setFeedback(authFeedback, 'Login successful.', false);
            loginForm.reset();

            window.setTimeout(() => {
                closeAuthModal();
            }, 400);
        });

        signupForm?.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = document.getElementById('signupName')?.value.trim() || '';
            const email = document.getElementById('signupEmail')?.value.trim().toLowerCase() || '';
            const password = document.getElementById('signupPassword')?.value || '';

            if (!name || !email || !password) {
                setFeedback(authFeedback, 'Complete all sign up fields.', true);
                return;
            }

            const users = getUsers();
            const exists = users.some((user) => user.email === email);

            if (exists) {
                setFeedback(authFeedback, 'An account with this email already exists.', true);
                return;
            }

            users.push({ name, email, password });
            saveUsers(users);
            saveCurrentUser({ name, email });
            renderAuthState();
            setFeedback(authFeedback, 'Account created successfully.', false);
            signupForm.reset();

            window.setTimeout(() => {
                closeAuthModal();
            }, 400);
        });

        logoutBtn?.addEventListener('click', () => {
            saveCurrentUser(null);
            renderAuthState();
        });

        renderAuthState();
    }

    function initContactForm() {
        const form = document.getElementById('contactForm');
        const feedback = document.getElementById('formFeedback');

        if (!form || !feedback) {
            return;
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = document.getElementById('fullName')?.value.trim() || 'there';
            setFeedback(feedback, `Thanks ${name}, your message has been recorded locally.`, false);
            form.reset();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initNavigation();
        initAuth();
        initContactForm();
    });
})();