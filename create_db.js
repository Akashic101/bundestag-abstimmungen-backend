const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'main.db'
});

// Define the ExcelData model
const ExcelData = sequelize.define('ExcelData', {
    Wahlperiode: DataTypes.INTEGER,
    Sitzungnr: DataTypes.INTEGER,
    Abstimmnr: DataTypes.INTEGER,
    FraktionGruppe: DataTypes.STRING,
    Name: DataTypes.STRING,
    Vorname: DataTypes.STRING,
    Titel: DataTypes.STRING,
    ja: DataTypes.INTEGER,
    nein: DataTypes.INTEGER,
    Enthaltung: DataTypes.INTEGER,
    ungültig: DataTypes.INTEGER,
    nichtabgegeben: DataTypes.INTEGER,
    Bezeichnung: DataTypes.STRING,
    Bemerkung: DataTypes.STRING,
    Datum: DataTypes.STRING
});

// Immediately invoked async function to ensure await works
(async () => {
    try {
        // Synchronize the model with the database before processing files
        await sequelize.sync();

        // Directory containing Excel files
        const directory = './input'; // Change this to the directory path

        // Read files in the directory
        fs.readdir(directory, async (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                return;
            }

            // Process each file to insert data into the single table
            for (const file of files) {
                const filePath = path.join(directory, file);
                await insertData(filePath);
            }

            // Close the database connection
            await sequelize.close();
        });
    } catch (error) {
        console.error('Error:', error);
    }
})();

// Function to insert data into the single table
async function insertData(filePath) {
    try {
        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert the worksheet to JSON array of objects
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

        const modifiedData = data.map(row => {
            if (row['Fraktion/Gruppe'] !== undefined) {
                row.FraktionGruppe = row['Fraktion/Gruppe'];
                delete row['Fraktion/Gruppe'];
            }
            return row;
        });

        // If no data is found, log a message and return
        if (modifiedData.length === 0) {
            console.log(`No data found in file ${filePath}. Skipping.`);
            return;
        }

        // Extract the filename without extension
        const fileName = path.parse(filePath).name;

        // Extract date from filename
        const dateMatch = fileName.match(/(\d{4})(\d{2})(\d{2})_/);
        if (!dateMatch) {
            throw new Error('Filename does not contain a valid date.');
        }

        // Construct date string in desired format
        const dateString = `${dateMatch[3]}.${dateMatch[2]}.${dateMatch[1]}`;

        // Add date field to each object
        const dataWithDate = modifiedData.map(row => ({
            ...row,
            Datum: dateString
        }));

        // Bulk insert data into the single table
        await ExcelData.bulkCreate(dataWithDate);

        console.log(`Data inserted into ExcelData table successfully from file: ${filePath}`);
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
    }
}
