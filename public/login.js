
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorModal = document.getElementById('errorModal');
  const errorMessage = document.getElementById('errorMessage');
  const closeErrorModalBtn = document.getElementById('closeErrorModal');
  const errorModalOverlay = document.getElementById('errorModalOverlay');

  const showErrorModal = (message) => {
    errorMessage.textContent = message;
    errorModal.classList.remove('hidden');
  };

  const hideErrorModal = () => {
    errorModal.classList.add('hidden');
  };

  if (closeErrorModalBtn) {
    closeErrorModalBtn.addEventListener('click', hideErrorModal);
  }

  if (errorModalOverlay) {
    errorModalOverlay.addEventListener('click', hideErrorModal);
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
    
      if (!username || !password) {
        showErrorModal('Zəhmət olmasa bütün sahələri doldurun');
        return;
      }
      fetch('/api/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
      })
      .then(res => res.json())
      .then(data => {
          if (data.success) {
              window.location.href = '/';
          } else {
              showErrorModal(data.message);
          }
      })
      .catch(error => {
          console.error('Error:', error);
          showErrorModal('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
      });
    });
  }
});
