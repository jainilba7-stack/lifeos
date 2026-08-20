
const backendPort = '5000';
const isBackendHost = window.location.port === backendPort;

const protocol = window.location.protocol === 'file:' ? 'http:' : window.location.protocol;
const hostname = window.location.hostname || 'localhost';

const API_BASE_URL = isBackendHost
  ? '/api'
  : `${protocol}//${hostname}:${backendPort}/api`;

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
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


function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
  }
}


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


async function logoutUser() {
  try {
    await apiCall('/auth/logout', { method: 'POST' });
  } catch (e) {

  } finally {
    removeToken();
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  }
}
