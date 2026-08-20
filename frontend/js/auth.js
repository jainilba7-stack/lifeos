/* LifeOS Authentication Flow Handlers */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Registration Handler
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

        showToast(res.message, 'success');
        
        // If demo OTP is returned or printed, display it
        if (res.data && res.data.demoOtp) {
          showToast(`Your OTP Code is: ${res.data.demoOtp}`, 'info');
        }

        // Store email for OTP verification step
        sessionStorage.setItem('verify_email', email);
        setTimeout(() => {
          window.location.href = 'verify-otp.html';
        }, 1500);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
      }
    });
  }

  // 2. OTP Digit Auto-Focus & Submit Handler
  const otpForm = document.getElementById('verify-otp-form');
  if (otpForm) {
    const digits = document.querySelectorAll('.otp-digit');
    const emailSpan = document.getElementById('target-email');
    const savedEmail = sessionStorage.getItem('verify_email') || '';
    if (emailSpan && savedEmail) emailSpan.textContent = savedEmail;

    digits.forEach((input, idx) => {
      input.addEventListener('keyup', (e) => {
        if (e.key >= '0' && e.key <= '9') {
          if (idx < digits.length - 1) digits[idx + 1].focus();
        } else if (e.key === 'Backspace') {
          if (idx > 0) digits[idx - 1].focus();
        }
      });
    });

    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = savedEmail || document.getElementById('otp-email')?.value;
      let otp = '';
      digits.forEach((d) => (otp += d.value));

      if (otp.length < 6) {
        return showToast('Please enter all 6 digits of the OTP code', 'warning');
      }

      const btn = otpForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> Verifying...';

      try {
        const res = await apiCall('/auth/verify-otp', {
          method: 'POST',
          body: { email, otp }
        });

        setToken(res.data.token);
        setCurrentUser(res.data.user);
        showToast('Account verified! Redirecting to Dashboard...', 'success');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Verify & Activate';
      }
    });

    const resendBtn = document.getElementById('resend-otp-btn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        try {
          const res = await apiCall('/auth/resend-otp', {
            method: 'POST',
            body: { email: savedEmail }
          });
          showToast('New OTP sent', 'success');
          if (res.data && res.data.demoOtp) {
            showToast(`Your OTP Code is: ${res.data.demoOtp}`, 'info');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  }

  // 3. Login Handler
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
        if (err.message && err.message.includes('not verified')) {
          sessionStorage.setItem('verify_email', email);
          setTimeout(() => {
            window.location.href = 'verify-otp.html';
          }, 1200);
        }
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
      }
    });
  }

  // 4. Forgot Password Handler
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
        if (res.data && res.data.demoOtp) {
          showToast(`Your OTP Code is: ${res.data.demoOtp}`, 'info');
        }
        sessionStorage.setItem('reset_email', email);
        setTimeout(() => {
          window.location.href = 'reset-password.html';
        }, 1500);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 5. Reset Password Handler
  const resetForm = document.getElementById('reset-password-form');
  if (resetForm) {
    const savedEmail = sessionStorage.getItem('reset_email') || '';
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = savedEmail || document.getElementById('email').value;
      const otp = document.getElementById('otp').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      try {
        const res = await apiCall('/auth/reset-password', {
          method: 'POST',
          body: { email, otp, newPassword, confirmPassword }
        });
        showToast(res.message, 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
});
