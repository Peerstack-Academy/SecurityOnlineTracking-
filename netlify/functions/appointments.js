import { google } from "googleapis";

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');
const spreadsheetId = process.env.SPREADSHEET_ID || "1Zb8yexQkS2I2y8TyeVtQx6dZ51QzhxTNox4MXon5FmQ";
const range = "Sheet1";

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

  // Cookie'den session kontrolü
  const cookies = parseCookies(event.headers.cookie);
  const sessionId = cookies.session_id;

  if (!sessionId || !checkSessionCookie(sessionId)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, message: "Giriş etmədən bu səhifəyə daxil ola bilməzsiniz." })
    };
  }

  try {
    const receivedData = JSON.parse(event.body);

    const client = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth: client });
    const sheetResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const rows = sheetResponse.data.values;
    const headers = rows[0];
    const jsonData = [];
    
    for (let i = 1; i < rows.length; i++) {
      const rowData = {};
      for (let j = 1; j < headers.length; j++) {
        rowData[headers[j]] = rows[i][j] || "";
      }

      let filterCheck = true;

      if (receivedData.ad && receivedData.ad.trim() !== '') {
        if (!rowData.NAME.split(" ")[0].toLowerCase().includes(receivedData.ad.toLowerCase())) {
          filterCheck = false;
        }
      }

      if (receivedData.soyad && receivedData.soyad.trim() !== '' && filterCheck) {
        if (!rowData.NAME.split(" ")[1]?.toLowerCase().includes(receivedData.soyad.toLowerCase())) {
          filterCheck = false;
        }
      }

      if (receivedData.status && receivedData.status.trim() !== '' && filterCheck) {
        if (!rowData.STATUS.toLowerCase().includes(receivedData.status.toLowerCase())) {
          filterCheck = false;
        }
      }

      if (receivedData.date && receivedData.date.trim() !== '' && filterCheck) {
        const dateOnly = rowData.DATE ? rowData.DATE.split(' ')[0] : "";
        if (dateOnly !== receivedData.date) {
          filterCheck = false;
        }
      }

      // Tarih aralığı filtresi (from - to)
      if (filterCheck && (receivedData.fromDate || receivedData.toDate)) {
        try {
          const dateOnly = rowData.DATE ? rowData.DATE.split(' ')[0] : "";
          if (dateOnly) {
            const [month, day, year] = dateOnly.split('/');
            const rowDate = new Date(year, month - 1, day);
            
            if (receivedData.fromDate && receivedData.fromDate.trim() !== '') {
              const [fMonth, fDay, fYear] = receivedData.fromDate.split('/');
              const fromDate = new Date(fYear, fMonth - 1, fDay);
              if (rowDate < fromDate) {
                filterCheck = false;
              }
            }
            
            if (filterCheck && receivedData.toDate && receivedData.toDate.trim() !== '') {
              const [tMonth, tDay, tYear] = receivedData.toDate.split('/');
              const toDate = new Date(tYear, tMonth - 1, tDay);
              toDate.setHours(23, 59, 59, 999);
              if (rowDate > toDate) {
                filterCheck = false;
              }
            }
          }
        } catch (e) {
          console.log(`Date range parsing error: ${e}`);
        }
      }

      if (receivedData.fin && receivedData.fin.trim() !== '' && filterCheck) {
        if (!rowData.FIN.toLowerCase().includes(receivedData.fin.toLowerCase())) {
          filterCheck = false;
        }
      }

      if (filterCheck) {
        jsonData.push(rowData);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Internal server error' })
    };
  }
}
