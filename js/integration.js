// SeatSwap Global Integration Script
// Handles authentication state, unified navigation, and seamless page connections

(function() {
  'use strict';

  // ========================================================
  // CONSTANTS & KEYS
  // ========================================================
  const REDIRECT_KEY = 'seatswap_redirect_after_login';
  const CURRENCY_KEY = 'seatswap_currency';
  const FRONTEND_PREVIEW = window.SEATSWAP_FRONTEND_PREVIEW === true;
  let authResolved = false;
  let currentUser = null;

  // ========================================================
  // AUTHENTICATION UTILITIES
  // ========================================================

  function isAuthenticated() {
    return authResolved && currentUser !== null;
  }

  function getCurrentUser() {
    return currentUser;
  }

  function clearAuthData() {
    localStorage.removeItem('seatswap_auth_token');
    localStorage.removeItem('seatswap_user_data');
    currentUser = null;
    authResolved = true;
  }

  async function logout() {
    try {
      const csrfResponse = await fetch('/api/v1/auth/csrf', { credentials: 'same-origin' });
      const csrf = await csrfResponse.json();
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': csrf.token }
      });
    } catch (error) {
      console.error('Sign out request failed');
    }
    clearAuthData();
    window.location.href = '/index.html';
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
        <span>${escapeHtml(user.fullName || (user.email ? user.email.split('@')[0] : 'Member'))}</span>
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
          <div style="font-size: 13.5px; color: #f5f5f7; font-weight: 600;">${escapeHtml(user.fullName || 'Member')}</div>
          <div style="font-size: 11.5px; color: #86868b; margin-top: 2px; word-break: break-all;">${escapeHtml(user.email || '')}</div>
        </div>
        <a href="dashboard.html" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #f5f5f7; text-decoration: none; font-size: 13px; border-radius: 8px; transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
          <span>📊</span>
          <span>SeatSwap Dashboard</span>
        </a>
        <a href="index.html" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #f5f5f7; text-decoration: none; font-size: 13px; border-radius: 8px; transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
          <span>🏠</span>
          <span>Landing Page</span>
        </a>
        <a href="/auth-app/dist/index.html#/profile" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #f5f5f7; text-decoration: none; font-size: 13px; border-radius: 8px; transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
          <span>👤</span>
          <span>Account settings</span>
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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  // ========================================================
  // SMART LEASE MODAL ENHANCEMENT
  // ========================================================

  function setupLeaseConfirmAuth() {
    const confirmBtn = document.getElementById('confirmLeaseBtn');
    if (!confirmBtn) return;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Leasing unavailable';
    const notice = document.getElementById('leaseModalNotice');
    if (notice) {
      notice.style.display = 'block';
      notice.textContent = 'Real listings, provider invitations, and payments are not connected yet.';
    }
    window.confirmLeaseOrder = function() {};
    window.publishHostListing = function() {
      const hostNotice = document.getElementById('hostModalNotice');
      if (hostNotice) {
        hostNotice.style.display = 'block';
        hostNotice.textContent = 'Real listings cannot be published until provider authorization and the backend listing workflow are ready.';
      }
    };
    window.simulateDisputeFlow = function() {
      const disputeButton = document.getElementById('btnRunDisputeSim');
      if (disputeButton) disputeButton.textContent = 'Dispute handling is not connected';
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
  // ========================================================
  // INITIALIZATION
  // ========================================================

  async function init() {
    clearAuthData();
    if (document.readyState === 'loading') {
      await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }
    setupCurrencySync();

    if (!FRONTEND_PREVIEW) {
      try {
        const response = await fetch('/api/v1/auth/session', { credentials: 'same-origin' });
        if (response.ok) {
          const result = await response.json();
          currentUser = result.user;
        }
      } catch (error) {
        currentUser = null;
      }
    }
    authResolved = true;

    const isDashboard = window.location.pathname.endsWith('/dashboard.html') || window.location.pathname === '/dashboard';
    if (isDashboard && !isAuthenticated() && !FRONTEND_PREVIEW) {
      sessionStorage.setItem(REDIRECT_KEY, window.location.pathname + window.location.search + window.location.hash);
      window.location.href = '/auth-app/dist/index.html#/login';
      return;
    }

    updateNavigation();
    setupLeaseConfirmAuth();
  }

  // Expose public API
  window.SeatSwapAuth = {
    isAuthenticated,
    getCurrentUser,
    clearAuthData,
    logout,
    updateNavigation
  };

  init();

})();
