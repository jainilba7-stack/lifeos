/* LifeOS Unified API & App Client Helper */
// Automatically detect file:// protocol vs http:// server ports and route requests to Node backend (port 5000)
const backendPort = '5000';
const isFileProtocol = window.location.protocol === 'file:' || !window.location.hostname;
const isBackendHost = window.location.port === backendPort;

const API_BASE_URL = isBackendHost
  ? '/api'
  : isFileProtocol
    ? 'https://lifeos-zk04.onrender.com'
    : `${window.location.protocol}//${window.location.hostname}:${backendPort}/api`;

// Web Audio API Alarm Sound Synthesizer
function playAlarmSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playBeep = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Play pleasant high-pitch alarm chime double-beep (3 cycles)
    playBeep(880, 0.0, 0.12);
    playBeep(1046.5, 0.15, 0.18);
    playBeep(880, 0.45, 0.12);
    playBeep(1046.5, 0.60, 0.18);
    playBeep(880, 0.90, 0.12);
    playBeep(1046.5, 1.05, 0.25);
  } catch (e) {
    console.warn('Audio alarm sound failed:', e);
  }
}

// Toast Notification Helper
function showToast(message, type = 'success', triggerSound = false) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  if (triggerSound || type === 'warning' || type === 'info') {
    playAlarmSound();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<strong>${icon}</strong> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Token Storage Helpers
function getToken() {
  return localStorage.getItem('lifeos_token');
}

function setToken(token) {
  localStorage.setItem('lifeos_token', token);
}

function removeToken() {
  localStorage.removeItem('lifeos_token');
  localStorage.removeItem('lifeos_user');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('lifeos_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem('lifeos_user', JSON.stringify(user));
}

// Check Authentication Route Guard
function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
  }
}

// Global Mobile Drawer Navigation Toggle
window.toggleMobileMenu = function (e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const sidebar = document.querySelector('.sidebar');
  let overlay = document.querySelector('.sidebar-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.onclick = function () {
      if (sidebar) sidebar.classList.remove('active');
      overlay.classList.remove('active');
    };
  }

  if (sidebar) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
};

function setupResponsiveNavigation() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const topbar = document.querySelector('.topbar');

  let menuBtn = document.querySelector('.mobile-menu-btn');
  if (topbar && !menuBtn) {
    menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = '☰';
    menuBtn.setAttribute('aria-label', 'Toggle Navigation Menu');

    const topbarLeft = topbar.querySelector('.topbar-left');
    if (topbarLeft) {
      topbarLeft.insertBefore(menuBtn, topbarLeft.firstChild);
    } else {
      topbar.insertBefore(menuBtn, topbar.firstChild);
    }
  }

  if (menuBtn) {
    menuBtn.onclick = window.toggleMobileMenu;
  }

  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.onclick = function () {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    };
  }

  document.querySelectorAll('.sidebar-nav .nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupResponsiveNavigation();
});

// Core Fetch API Wrapper
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = options.headers || {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!options.isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body
    });

    const data = await response.json();

    if (response.status === 401) {
      removeToken();
      if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
        window.location.href = 'login.html';
      }
      throw new Error(data.message || 'Unauthorized session');
    }

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

// Global Logout Action
async function logoutUser() {
  try {
    await apiCall('/auth/logout', { method: 'POST' });
  } catch (e) {
    // Ignore error on logout cleanup
  } finally {
    removeToken();
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  }
}
