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
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  const cookies = parseCookies(event.headers.cookie);
  const sessionId = cookies.session_id;

  if (sessionId) {
    // Session'ı temizle (cookie'yi sil)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'session_id=; Max-Age=0; Path=/; Secure; SameSite=Lax'
      },
      body: JSON.stringify({ success: true, message: "Hesabınızdan çıxış etdiniz." })
    };
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Cookie tapılmadı." })
    };
  }
}
