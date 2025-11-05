import { google } from "googleapis";
import express from 'express';
import cookieParser from 'cookie-parser';
import fs from "fs";

const app = express()
app.use(cookieParser());
app.use(express.json());

// Configuration - sonradan .env fayılına atmaq lazımdı
const port = 3000
const spreadsheetId = "";
const range = "Sheet1";

const credentials = JSON.parse(fs.readFileSync("credentials.json", "utf8"));
const users_data = JSON.parse(fs.readFileSync("users.json", "utf8"));
const sessions = {};

const client = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth: client });

app.post('/appointments', async (req, res) => {
    const session_id = req.cookies.session_id;

    if (!session_id || !sessions[session_id]) {
        return res.status(401).json({ success: false, message: "Giriş etmədən bu səhifəyə daxil ola bilməzsiniz." });
    }

    const recieved_data = req.body;

    const sheet_response = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const rows = sheet_response.data.values;
    const headers = rows[0];
    const json_data = [];
    
    for (let i = 1; i < rows.length; i++) {
        const rowData = {};
        for (let j = 1; j < headers.length; j++) {
            rowData[headers[j]] = rows[i][j] || "";
        }

        let filter_check = true;

        if (recieved_data.ad && recieved_data.ad.trim() !== '') {
            if (!rowData.NAME.split(" ")[0].toLowerCase().includes(recieved_data.ad.toLowerCase())) {
                filter_check = false;
            }
        }

        if (recieved_data.soyad && recieved_data.soyad.trim() !== '' && filter_check) {
            if (!rowData.NAME.split(" ")[1].toLowerCase().includes(recieved_data.soyad.toLowerCase())) {
                filter_check = false;
            }
        }

        if (recieved_data.status && recieved_data.status.trim() !== '' && filter_check) {
            if (!rowData.STATUS.toLowerCase().includes(recieved_data.status.toLowerCase())) {
                filter_check = false;
            }
        }

        if (recieved_data.date && recieved_data.date.trim() !== '' && filter_check) {
            const dateOnly = rowData.DATE ? rowData.DATE.split(' ')[0] : "";
            if (dateOnly !== recieved_data.date) {
                filter_check = false;
            }
        }

        if (recieved_data.fin && recieved_data.fin.trim() !== '' && filter_check) {
            if (!rowData.FIN.toLowerCase().includes(recieved_data.fin.toLowerCase())) {
                filter_check = false;
            }
        }

        if (filter_check) {
            json_data.push(rowData);
        }
    }

    res.json(json_data);
});

app.post('/login', (req, res) => {
    const cookie_session = req.cookies.session_id;
    
    if (cookie_session && sessions[cookie_session]) {
        return res.json({ success: false, message: "Hal hazırda giriş etmiş vəziyyətdəsiniz." });
    }

    const recieved_data = req.body;
    const username = recieved_data.username;
    const password = recieved_data.password;

    if (!username || !password) {
        res.status(400);
        return res.json({ success: false, message: "İstifadəçi adı və ya şifrə boş ola bilməz." });
    }

    const user = users_data.find(user => user.username === username && user.password === password);
    
    if (user) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < 48; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        sessions[result] = { username: username };

        res.cookie("session_id", result, { maxAge: 43200000 });
        res.json({ success: true, message: "Xoş gəlmişsiniz!" });

    } else {
        res.status(401);
        res.json({ success: false, message: "Şifə səhvdir yenidən yoxlayın :(" });
    }
});

app.get('/logout', (req, res) => {
    const session_id = req.cookies.session_id;

    if (session_id && sessions[session_id]) {
        delete sessions[session_id];

        res.clearCookie("session_id");
        res.json({ success: true, message: "Hesabınızdan çıxış etdiniz." });
    } else {
        res.status(400);
        res.json({ success: false, message: "Cookie tapılmadı." });
    }

});

app.listen(port, () => {
  console.log(`${port} portu bizimdir!`);
})