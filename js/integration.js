// SeatSwap Global Integration Script
// Handles authentication state, unified navigation, and seamless page connections

(function() {
  'use strict';

  // ========================================================
  // CONSTANTS & KEYS
  // ========================================================
  const AUTH_TOKEN_KEY = 'seatswap_auth_token';
  const USER_DATA_KEY = 'seatswap_user_data';
  const REDIRECT_KEY = 'seatswap_redirect_after_login';
  const CURRENCY_KEY = 'seatswap_currency';

  // ========================================================
  // AUTHENTICATION UTILITIES
  // ========================================================

  function isAuthenticated() {
    return localStorage.getItem(AUTH_TOKEN_KEY) !== null;
  }

  function getCurrentUser() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      return null;
    }
  }

  function saveAuthData(token, userData) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }

  function clearAuthData() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }

  function logout() {
    clearAuthData();
    // Refresh current page or go to index
    if (window.location.pathname.includes('dashboard.html')) {
      window.location.reload();
    } else {
      window.location.href = 'index.html';
    }
  }

  function quickTestLogin(email = 'alex.founder@startup.io', name = 'Alex Chen') {
    const token = 'mock_jwt_token_' + Date.now();
    const user = {
      email: email,
      fullName: name,
      id: 'user_' + Date.now()
    };
    saveAuthData(token, user);
    updateNavigation();
    return user;
  }

  // ========================================================
  // UNIFIED NAVIGATION (CONNECTS ALL PAGES)
  // ========================================================

  function updateNavigation() {
    const isLoggedIn = isAuthenticated();
    const user = getCurrentUser();

    // Remove any existing user menu or auth button so we can rebuild cleanly
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) existingMenu.remove();
    const existingSignIn = document.getElementById('navSignInBtn');
    if (existingSignIn) existingSignIn.remove();

    // 1. Locate nav container
    // For index.html: header.chrome nav.nav
    // For dashboard.html: nav.nav .nav__actions or .nav
    const navActions = document.querySelector('.nav__actions') || document.querySelector('.nav');
    if (!navActions) return;

    if (isLoggedIn && user) {
      // Create user dropdown menu
      const userMenu = document.createElement('div');
      userMenu.id = 'userMenu';
      userMenu.style.cssText = `
        position: relative;
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
        z-index: 1000;
      `;

      const userButton = document.createElement('button');
      userButton.type = 'button';
      userButton.className = 'btn btn--dark user-pill-btn';
      userButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #0b0b0b;
        color: #f5f5f7;
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.18);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      userButton.innerHTML = `
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; box-shadow: 0 0 8px rgba(34,197,94,0.6);"></span>
        <span>${user.fullName || (user.email ? user.email.split('@')[0] : 'Member')}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="opacity: 0.7; margin-left: 2px;">
          <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      const dropdown = document.createElement('div');
      dropdown.id = 'userDropdown';
      dropdown.style.cssText = `
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: #111115;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 16px;
        padding: 8px;
        min-width: 220px;
        display: none;
        z-index: 10000;
        box-shadow: 0 16px 40px rgba(0,0,0,0.6);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      `;

      dropdown.innerHTML = `
        <div style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 6px;">
          <div style="font-size: 13.5px; color: #f5f5f7; font-weight: 600;">${user.fullName || 'Verified Member'}</div>
          <div style="font-size: 11.5px; color: #86868b; margin-top: 2px; word-break: break-all;">${user.email || 'user@relay.seatswap.io'}</div>
        </div>
        <a href="dashboard.html" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #f5f5f7; text-decoration: none; font-size: 13px; border-radius: 8px; transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
          <span>📊</span>
          <span>SeatSwap Dashboard</span>
        </a>
        <a href="index.html" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #f5f5f7; text-decoration: none; font-size: 13px; border-radius: 8px; transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
          <span>🏠</span>
          <span>Landing Page</span>
        </a>
        <div style="height: 1px; background: rgba(255,255,255,0.08); margin: 6px 0;"></div>
        <a href="#" id="logoutBtn" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #ff6b6b; text-decoration: none; font-size: 13px; border-radius: 8px; transition: background 0.15s;" onmouseover="this.style.background='rgba(255,80,80,0.1)'" onmouseout="this.style.background='transparent'">
          <span>🚪</span>
          <span>Sign Out</span>
        </a>
      `;

      userButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      });

      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });

      userMenu.appendChild(userButton);
      userMenu.appendChild(dropdown);
      navActions.appendChild(userMenu);

      const logoutBtn = dropdown.querySelector('#logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          logout();
        });
      }
    } else {
      // User is not logged in: show dedicated "Sign In" button in header
      const signInLink = document.createElement('a');
      signInLink.id = 'navSignInBtn';
      signInLink.href = 'auth-app/dist/index.html#/login';
      signInLink.textContent = 'Sign In';
      signInLink.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.2);
        color: #f5f5f7;
        background: rgba(255,255,255,0.06);
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        margin-left: 8px;
        transition: all 0.2s ease;
      `;
      signInLink.onmouseover = function() {
        this.style.background = 'rgba(255,255,255,0.14)';
        this.style.borderColor = 'rgba(255,255,255,0.3)';
      };
      signInLink.onmouseout = function() {
        this.style.background = 'rgba(255,255,255,0.06)';
        this.style.borderColor = 'rgba(255,255,255,0.2)';
      };

      signInLink.addEventListener('click', function(e) {
        sessionStorage.setItem(REDIRECT_KEY, window.location.pathname.split('/').pop() || 'dashboard.html');
      });

      navActions.appendChild(signInLink);
    }
  }

  // ========================================================
  // SMART LEASE MODAL ENHANCEMENT
  // ========================================================

  function setupLeaseConfirmAuth() {
    const confirmBtn = document.getElementById('confirmLeaseBtn');
    if (!confirmBtn) return;

    // Enhance confirmation to handle unauthenticated state elegantly
    const originalConfirm = window.confirmLeaseOrder;

    window.confirmLeaseOrder = function() {
      if (isAuthenticated()) {
        if (typeof originalConfirm === 'function') {
          originalConfirm();
        }
        return;
      }

      // If not authenticated, provide friendly 1-click test login or full auth
      const notice = document.getElementById('leaseModalNotice');
      if (notice) {
        notice.style.display = 'block';
        notice.innerHTML = `
          <div style="background: rgba(255,190,11,0.08); border: 1px solid rgba(255,190,11,0.35); border-radius: 12px; padding: 12px 14px; margin-top: 8px;">
            <div style="font-size: 13px; color: #ffd166; font-weight: 600; margin-bottom: 4px;">⚡ Authentication Required for Escrow</div>
            <div style="font-size: 12px; color: #a1a1a6; margin-bottom: 10px;">Sign in to assign your relay proxy and lock your 48-hour escrow protection.</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" id="btnQuickDemoLogin" style="background: #eef0d0; color: #101010; border: none; border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer;">
                ⚡ 1-Click Test Login & Claim
              </button>
              <a href="auth-app/dist/index.html#/login" id="btnGoToLogin" style="background: rgba(255,255,255,0.1); color: #f5f5f7; border: 1px solid rgba(255,255,255,0.2); border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 500; text-decoration: none; display: inline-flex; align-items: center;">
                🔑 Go to Sign In
              </a>
            </div>
          </div>
        `;

        const quickLoginBtn = document.getElementById('btnQuickDemoLogin');
        if (quickLoginBtn) {
          quickLoginBtn.onclick = function() {
            quickTestLogin();
            if (typeof originalConfirm === 'function') {
              originalConfirm();
            }
          };
        }

        const goToLoginBtn = document.getElementById('btnGoToLogin');
        if (goToLoginBtn) {
          goToLoginBtn.onclick = function() {
            sessionStorage.setItem(REDIRECT_KEY, 'dashboard.html');
          };
        }
      }
    };
  }

  // ========================================================
  // CURRENCY SYNC ACROSS ALL PAGES
  // ========================================================

  function setupCurrencySync() {
    const savedCurrency = localStorage.getItem(CURRENCY_KEY) || 'USD';
    const usdBtn = document.getElementById('currencyUSD');
    const inrBtn = document.getElementById('currencyINR');

    function applyCurrency(curr) {
      localStorage.setItem(CURRENCY_KEY, curr);
      if (usdBtn && inrBtn) {
        if (curr === 'USD') {
          usdBtn.classList.add('active');
          inrBtn.classList.remove('active');
        } else {
          inrBtn.classList.add('active');
          usdBtn.classList.remove('active');
        }
      }

      // Update all .price elements
      document.querySelectorAll('.price').forEach(el => {
        const val = curr === 'USD' ? el.getAttribute('data-usd') : el.getAttribute('data-inr');
        if (val) el.textContent = val;
      });
    }

    if (usdBtn) {
      usdBtn.addEventListener('click', () => applyCurrency('USD'));
    }
    if (inrBtn) {
      inrBtn.addEventListener('click', () => applyCurrency('INR'));
    }

    applyCurrency(savedCurrency);
  }

  // ========================================================
  // REDIRECT HANDLER AFTER LOGIN
  // ========================================================

  function handleRedirectAfterLogin() {
    const redirectPath = sessionStorage.getItem(REDIRECT_KEY);
    if (redirectPath && isAuthenticated()) {
      sessionStorage.removeItem(REDIRECT_KEY);
      // Only redirect if we're not already on that page
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      if (!currentPage.includes(redirectPath)) {
        window.location.href = redirectPath;
      }
    }
  }

  // ========================================================
  // INITIALIZATION
  // ========================================================

  function init() {
    handleRedirectAfterLogin();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        updateNavigation();
        setupLeaseConfirmAuth();
        setupCurrencySync();
      });
    } else {
      updateNavigation();
      setupLeaseConfirmAuth();
      setupCurrencySync();
    }
  }

  // Expose public API
  window.SeatSwapAuth = {
    isAuthenticated,
    getCurrentUser,
    saveAuthData,
    clearAuthData,
    logout,
    quickTestLogin,
    updateNavigation
  };

  init();

})();
