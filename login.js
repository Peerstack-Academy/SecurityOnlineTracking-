
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
    
      if (!username || !password) {
        alert('Zəhmət olmasa bütün sahələri doldurun');
        return;
      }
      
      if (username === 'admin' && password === 'admin') {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        window.location.href = 'index.html';
      } else {
        alert('İstifadəçi adı və ya şifrə yanlışdır');
      }
    });
  }
});
