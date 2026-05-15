// CSV Import und Bilderverwaltung
class ImportManager {
    constructor() {
        this.csvFields = [
            'Name',
            'Zuchtbuchnummer',
            'Papier-ID',
            'Geburtsdatum',
            'Verkauft',
            'Käufer_Vorname',
            'Käufer_Nachname',
            'Käufer_Adresse',
            'Verkaufsdatum',
            'Bild_Oberseite_Dateiname',
            'Bild_Unterseite_Dateiname'
        ];
    }

    // Lade CSV-Datei und verarbeite sie
    async loadCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const rows = this.parseCSV(csv);
                    resolve(rows);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsText(file);
        });
    }

    // Parse CSV-String
    parseCSV(csv) {
        const lines = csv.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV ist leer oder hat keinen Header');

        // Lese Header
        const headers = this.parseCSVLine(lines[0]);
        
        // Validiere Header
        const missingFields = this.csvFields.filter(field => !headers.includes(field));
        if (missingFields.length > 0) {
            throw new Error(`Fehlende Spalten: ${missingFields.join(', ')}`);
        }

        // Parse Daten
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue; // Überspringe leere Zeilen
            
            const values = this.parseCSVLine(lines[i]);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            // Validiere erforderliche Felder
            if (!row['Name'] || row['Name'].trim() === '') {
                throw new Error(`Zeile ${i + 1}: Name ist erforderlich`);
            }

            data.push(row);
        }

        return data;
    }

    // Parse eine CSV-Zeile (beachtet Anführungszeichen)
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result.map(val => val.trim());
    }

    // Erstelle Turtle-Objekt aus CSV-Zeile
    createTurtleFromCSV(row) {
        const turtle = {
            name: row['Name'],
            breedingNumber: row['Zuchtbuchnummer'] || null,
            paperId: row['Papier-ID'] || null,
            birthDate: row['Geburtsdatum'] || null,
            status: row['Verkauft']?.toLowerCase() === 'ja' ? 'sold' : 'owned',
            buyer: null,
            sellDate: null,
            imageFilenames: {
                top: row['Bild_Oberseite_Dateiname'] || null,
                bottom: row['Bild_Unterseite_Dateiname'] || null
            }
        };

        // Käuferinformationen
        if (turtle.status === 'sold') {
            turtle.buyer = {
                firstName: row['Käufer_Vorname'] || '',
                lastName: row['Käufer_Nachname'] || '',
                address: row['Käufer_Adresse'] || ''
            };
            turtle.sellDate = row['Verkaufsdatum'] || null;
        }

        return turtle;
    }

    // Validiere Datum
    isValidDate(dateString) {
        if (!dateString) return true;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // Lade Bilder aus ZIP
    async loadImagesFromZip(zipFile) {
        // Diese Funktion erfordert eine ZIP-Library (z.B. JSZip)
        // Momentan wird sie als Platzhalter implementiert
        console.warn('ZIP-Import benötigt zusätzliche Library');
        return {};
    }

    // Importiere Bilder mit Fallback auf Base64-Strings
    async processImages(imageMap) {
        const processed = {};
        
        for (const [filename, base64Data] of Object.entries(imageMap)) {
            try {
                processed[filename] = base64Data;
            } catch (error) {
                console.error(`Fehler beim Verarbeiten von ${filename}:`, error);
            }
        }

        return processed;
    }

    // Generiere Download-Link für Template
    downloadTemplate() {
        const headers = this.csvFields.join(',');
        const exampleRow = [
            'Schildi',
            'ZB-2024-001',
            'P-2024-001',
            '2022-05-15',
            'nein',
            '',
            '',
            '',
            '',
            'schildi_oben.jpg',
            'schildi_unten.jpg'
        ].map(val => this.escapeCSV(val)).join(',');

        const csv = `${headers}\n${exampleRow}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Schildkroeten-Template-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Escapiere CSV-Werte
    escapeCSV(value) {
        if (!value) return '';
        value = String(value);
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    // Exportiere CSV aus Schildkröten-Daten
    async exportAsCSV(turtles) {
        const headers = this.csvFields.join(',');
        const rows = [];

        for (const turtle of turtles) {
            const row = [
                turtle.name,
                turtle.breedingNumber || '',
                turtle.paperId || '',
                turtle.birthDate || '',
                turtle.status === 'sold' ? 'ja' : 'nein',
                turtle.buyer?.firstName || '',
                turtle.buyer?.lastName || '',
                (turtle.buyer?.address || '').replace(/\n/g, '\\n'),
                turtle.sellDate || '',
                '', // Bild-Oberseite wird nicht exportiert
                ''  // Bild-Unterseite wird nicht exportiert
            ].map(val => this.escapeCSV(val)).join(',');

            rows.push(row);
        }

        const csv = `${headers}\n${rows.join('\n')}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Schildkroeten-Export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Erstelle globale Instanz
const importManager = new ImportManager();
