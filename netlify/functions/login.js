const usersData = JSON.parse(process.env.USERS_DATA || '[]');
const SESSION_EXPIRY_TIME = 12 * 60 * 60 * 1000; // 12 saat

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

function checkSessionCookie(cookieValue) {
  if (!cookieValue) return false;
  
  try {
    // Cookie formatı: username:timestamp:randomToken
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf8');
    const [username, timestamp] = decoded.split(':');
    
    const createdAt = parseInt(timestamp);
    if (isNaN(createdAt)) return false;
    
    // Session süresi kontrolü
    if (Date.now() - createdAt > SESSION_EXPIRY_TIME) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  const cookies = parseCookies(event.headers.cookie);
  const sessionCookie = cookies.session_id;
  
  if (sessionCookie && checkSessionCookie(sessionCookie)) {
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
      // Random token oluştur
      let randomToken = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 32; i++) {
        randomToken += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Cookie içeriği: username:timestamp:randomToken
      const cookieData = `${username}:${Date.now()}:${randomToken}`;
      const encodedCookie = Buffer.from(cookieData).toString('base64');

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session_id=${encodedCookie}; Max-Age=43200; Path=/; HttpOnly; SameSite=Lax`
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
