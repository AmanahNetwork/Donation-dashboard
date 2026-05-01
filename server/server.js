require('dotenv').config();
const PORT = process.env.PORT || 5001; 
const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library'); 
const cors = require('cors');
const path = require('path'); // Moved up with other imports

const app = express();
app.use(cors());
app.use(express.json());

// --- PROFESSIONAL AUTH SECTION ---
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.SHEET_ID, serviceAccountAuth);
console.log("Google Spreadsheet object initialized with Service Account.");
// ---------------------------------

// API ROUTE
app.get('/api/donations', async (req, res) => {
  try {
    console.log("--- New Request Received ---");
    await doc.loadInfo(); 
    console.log("Successfully connected to Sheet:", doc.title);

    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    const data = rows.map((row) => ({
      email: row.get('Email Address') || row.get('Email') || 'No Email',
      amount: parseFloat(row.get('AMOUNT TO PAY')) || 0,
      timestamp: row.get('Timestamp') || new Date().toISOString(),
    }));

    res.json(data);
    console.log(`Data sent: ${data.length} rows processed.`);

  } catch (err) {
    console.error("!!! SERVER ERROR !!!", err.message);
    res.status(500).json({ error: "Authentication or Spreadsheet error" });
  }
});

// --- SERVING THE FRONTEND ---

// 1. Serve static files (CSS, JS, Images) from the build folder
app.use(express.static(path.join(__dirname, '../client/build'))); 

// 2. The Universal Catch-All (Bypasses PathError in Node v24)
app.use((req, res, next) => {
  // If the request starts with /api, let it fall through to the API routes above
  if (req.url.startsWith('/api')) {
    return next();
  }
  // For everything else, serve the React index.html
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 AmanahNetwork Server listening on port ${PORT}`);
});