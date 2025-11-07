const usersData = JSON.parse(process.env.USERS_DATA || '[]');
const SESSION_EXPIRY_TIME = 12 * 60 * 60 * 1000;

function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.split('=');
      cookies[name.trim()] = rest.join('=').trim();
    });
  }
  return cookies;
}

function checkSession(sessionId) {
  if (!sessionId) return false;
  const sessions = JSON.parse(process.env.SESSIONS || '{}');
  
  if (!sessions[sessionId]) {
    return false;
  }

  if (Date.now() - sessions[sessionId].createdAt > SESSION_EXPIRY_TIME) {
    return false;
  }
  return true;
}

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  const cookies = parseCookies(event.headers.cookie);
  const cookieSession = cookies.session_id;
  
  if (cookieSession && checkSession(cookieSession)) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, message: "Hal hazırda giriş etmiş vəziyyətdəsiniz." })
    };
  }

  try {
    const receivedData = JSON.parse(event.body);
    const username = receivedData.username;
    const password = receivedData.password;

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "İstifadəçi adı və ya şifrə boş ola bilməz." })
      };
    }

    const user = usersData.find(user => user.username === username && user.password === password);
    
    if (user) {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < 48; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }

      // NOT: Gerçek production'da bu session'ı Redis/Database'e kaydetmeniz gerekir
      // Şimdilik cookie'ye kaydediyoruz
      const sessionData = {
        username: username,
        createdAt: Date.now()
      };

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session_id=${result}; Max-Age=43200; Path=/; Secure; SameSite=Lax`
        },
        body: JSON.stringify({ success: true, message: "Xoş gəlmişsiniz!" })
      };

    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Şifə səhvdir yenidən yoxlayın :(" })
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Internal server error' })
    };
  }
}
