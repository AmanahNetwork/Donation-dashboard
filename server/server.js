require('dotenv').config();
const PORT = process.env.PORT || 5001; // Matches your console log port
const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library'); // Use JWT for Service Accounts
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- PROFESSIONAL AUTH SECTION ---
// This uses your new JSON key data from the .env file
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fixes private key formatting
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.SHEET_ID, serviceAccountAuth);
console.log("Google Spreadsheet object initialized with Service Account.");
// ---------------------------------

app.get('/api/donations', async (req, res) => {
  try {
    console.log("--- New Request Received ---");
    
    // Connect to the sheet
    await doc.loadInfo(); 
    console.log("Successfully connected to Sheet:", doc.title);

    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    // Map data from Google Sheet columns
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
const path = require('path');

// 1. Serve the static files from the React "dist" folder
app.use(express.static(path.join(__dirname, '../client/dist'))); 

// 2. The "catch-all" handler for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});
app.listen(PORT, () => {
  console.log(`🚀 AmanahNetwork Server listening on port ${PORT}`);
});