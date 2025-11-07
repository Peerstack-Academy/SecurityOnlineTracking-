const usersData = JSON.parse(process.env.USERS_DATA || '[]');

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

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  const cookies = parseCookies(event.headers.cookie);
  const cookieSession = cookies.session_id;
  
  // Eğer zaten bir session cookie'si varsa
  if (cookieSession) {
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
      // Random session token oluştur
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < 48; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }

      // Token'a kullanıcı bilgisi ve zaman ekle (base64 encoded)
      const sessionData = {
        username: username,
        createdAt: Date.now(),
        token: result
      };
      const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64');

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session_id=${encodedSession}; Max-Age=43200; Path=/; HttpOnly; SameSite=Lax`
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
