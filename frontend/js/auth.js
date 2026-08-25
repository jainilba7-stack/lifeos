/* LifeOS Direct Authentication Flow Handlers (No OTP) */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Direct Registration Handler
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('fullName').value;
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      const btn = registerForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> Creating account...';

      try {
        const res = await apiCall('/auth/register', {
          method: 'POST',
          body: { fullName, username, email, password, confirmPassword }
        });

        setToken(res.data.token);
        setCurrentUser(res.data.user);
        showToast('Account created! Welcome to LifeOS 🎉', 'success');
        
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
      }
    });
  }

  // 2. Direct Login Handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> Logging in...';

      try {
        const res = await apiCall('/auth/login', {
          method: 'POST',
          body: { email, password }
        });

        setToken(res.data.token);
        setCurrentUser(res.data.user);
        showToast('Welcome back to LifeOS!', 'success');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
      }
    });
  }

  // 3. Direct Forgot Password Handler
  const forgotForm = document.getElementById('forgot-password-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;

      try {
        const res = await apiCall('/auth/forgot-password', {
          method: 'POST',
          body: { email }
        });
        showToast(res.message, 'success');
        sessionStorage.setItem('reset_email', email);
        setTimeout(() => {
          window.location.href = 'reset-password.html';
        }, 1000);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 4. Direct Reset Password Handler
  const resetForm = document.getElementById('reset-password-form');
  if (resetForm) {
    const savedEmail = sessionStorage.getItem('reset_email') || '';
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = savedEmail || document.getElementById('email').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      try {
        const res = await apiCall('/auth/reset-password', {
          method: 'POST',
          body: { email, newPassword, confirmPassword }
        });
        showToast(res.message, 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1000);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
});
