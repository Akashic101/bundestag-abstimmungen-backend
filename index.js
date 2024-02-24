const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to the SQLite database
const db = new sqlite3.Database('./main.db');

app.use(cors());

app.get('/data/top10', (req, res) => {
    db.all(`
        SELECT 
            Bezeichnung, 
            Bemerkung,
            SUM(ja) AS ja, 
            SUM(nein) AS nein, 
            SUM(Enthaltung) AS enthaltung, 
            SUM(ungültig) AS ungültig, 
            SUM(nichtabgegeben) AS nichtabgegeben 
        FROM ExcelData
        GROUP BY Bezeichnung, Bemerkung
        ORDER BY SUM(Enthaltung + ungültig + nichtabgegeben) DESC
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        
        // Format the response as an array of objects
        const data = rows.map(row => {
            const formattedData = {
                bezeichnung: row.Bezeichnung,
                ja: row.ja || 0,
                nein: row.nein || 0,
                enthaltung: row.enthaltung || 0,
                ungültig: row.ungültig || 0,
                nichtabgegeben: row.nichtabgegeben || 0
            };
            if (row.Bemerkung) {
                formattedData[`nichtabgegeben (${row.Bemerkung})`] = row.nichtabgegeben;
                delete formattedData.nichtabgegeben;
            }
            return formattedData;
        });
        
        res.json(data);
    });
});

app.get('/mitglieder/', (req, res) => {
    db.all('SELECT DISTINCT Name, Vorname, FraktionGruppe FROM ExcelData', (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(rows);
    });
});

app.get('/mitglieder/:mitglied', (req, res) => {
    const { mitglied } = req.params;

    db.all('SELECT * FROM ExcelData WHERE Bezeichnung = ?', [mitglied], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(rows);
    });
});

app.get('/fraktiongruppe/', (req, res) => {
    db.all('SELECT DISTINCT FraktionGruppe FROM ExcelData', (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        const fraktionen = rows.map(row => row.FraktionGruppe);
        res.json(fraktionen);
    });
});

app.get('/fraktiongruppe/:fraktiongruppe/mitglieder', (req, res) => {
    const { fraktiongruppe } = req.params;

    db.all('SELECT DISTINCT Name, Vorname, Bezeichnung FROM ExcelData WHERE FraktionGruppe = ?', [fraktiongruppe], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(rows);
    });
});

app.get('/fraktiongruppe/:fraktiongruppe/mitglieder/:mitglied', (req, res) => {
    const { fraktiongruppe } = req.params;

    db.all('SELECT DISTINCT Name, Vorname, Bezeichnung FROM ExcelData WHERE FraktionGruppe = ?', [fraktiongruppe], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(rows);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});