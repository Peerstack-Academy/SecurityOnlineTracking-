
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
              alert(data.message);
              window.location.href = '/';
          } else {
              alert(data.message);
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert(error);
      });
    });
  }
});
