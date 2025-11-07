import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
    // Delete session from Redis
    try {
      await redis.del(`session:${sessionId}`);
    } catch (error) {
      console.error('Redis delete error:', error);
    }

    // Determine if we're on HTTPS
    const isProduction = event.headers.host && !event.headers.host.includes('localhost');
    const secureCookie = isProduction ? '; Secure' : '';

    // Clear cookie
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_id=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secureCookie}`
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
