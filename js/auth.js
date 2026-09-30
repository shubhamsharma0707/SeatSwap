// Simple authentication utility for checking login state
const AUTH_TOKEN_KEY = 'seatswap_auth_token';
const USER_DATA_KEY = 'seatswap_user_data';
const REDIRECT_KEY = 'seatswap_redirect_after_login';

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem(AUTH_TOKEN_KEY) !== null;
}

// Get current user data
function getCurrentUser() {
  const userData = localStorage.getItem(USER_DATA_KEY);
  try {
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    return null;
  }
}

// Save authentication data
function saveAuthData(token, userData) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

// Clear authentication data
function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  window.location.href = 'index.html';
}

// Protect pages that require authentication
function requireAuth() {
  if (!isAuthenticated()) {
    sessionStorage.setItem(REDIRECT_KEY, window.location.pathname.split('/').pop() || 'dashboard.html');
    window.location.href = 'auth-app/dist/index.html';
    return false;
  }
  return true;
}

// Quick 1-click test login helper
function quickTestLogin(email = 'alex.founder@startup.io', name = 'Alex Chen') {
  const token = 'mock_jwt_token_' + Date.now();
  const user = {
    email: email,
    fullName: name,
    id: 'user_' + Date.now()
  };
  saveAuthData(token, user);
  return user;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isAuthenticated, getCurrentUser, saveAuthData, logout, requireAuth, quickTestLogin };
}
