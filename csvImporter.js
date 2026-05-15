// CSV-Importer für Schildkröten und Bilder
class CSVImporter {
    constructor() {
        this.requiredFields = ['name', 'zuchtbuchnummer', 'papier-id', 'geburtsdatum'];
        this.optionalFields = ['verkauft', 'käufer_vorname', 'käufer_nachname', 'käufer_adresse', 'verkaufsdatum'];
        this.imageFields = ['bild_oberseite_url', 'bild_unterseite_url'];
    }

    /**
     * Parse CSV-Inhalt
     * @param {string} csvContent - CSV-Datei-Inhalt
     * @returns {Array} Array von Turtle-Objekten
     */
    parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV-Datei ist leer oder hat keine Daten');
        }

        // Parse Header
        const header = lines[0].split(',').map(h => h.trim());
        this.validateHeader(header);

        // Parse Daten
        const turtles = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip leere Zeilen

            const values = this.parseCSVLine(line);
            if (values.length === 0) continue;

            const turtle = this.createTurtleObject(header, values);
            if (turtle.name) { // Name ist erforderlich
                turtles.push(turtle);
            }
        }

        if (turtles.length === 0) {
            throw new Error('Keine gültigen Schildkröten-Daten gefunden');
        }

        return turtles;
    }

    /**
     * Validiere CSV-Header
     * @param {Array} header - Header-Zeile
     */
    validateHeader(header) {
        const lowerHeader = header.map(h => h.toLowerCase());
        
        // Prüfe auf erforderliche Felder
        if (!lowerHeader.includes('name')) {
            throw new Error('Erforderliche Spalte fehlt: Name');
        }
    }

    /**
     * Parse eine CSV-Zeile (mit Komma-Unterstützung in Anführungszeichen)
     * @param {string} line - CSV-Zeile
     * @returns {Array} Array von Werten
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    }

    /**
     * Erstelle Turtle-Objekt aus CSV-Zeile
     * @param {Array} header - Header-Zeile
     * @param {Array} values - Wert-Zeile
     * @returns {Object} Turtle-Objekt
     */
    createTurtleObject(header, values) {
        const obj = {};
        
        for (let i = 0; i < header.length && i < values.length; i++) {
            const key = header[i].trim().toLowerCase();
            const value = values[i];

            if (key === 'name') obj.name = value;
            else if (key === 'zuchtbuchnummer') obj.breedingNumber = value;
            else if (key === 'papier-id') obj.paperId = value;
            else if (key === 'geburtsdatum') obj.birthDate = value;
            else if (key === 'verkauft') obj.sold = value.toLowerCase() === 'ja' || value === '1';
            else if (key === 'käufer_vorname') obj.buyerFirstName = value;
            else if (key === 'käufer_nachname') obj.buyerLastName = value;
            else if (key === 'käufer_adresse') obj.buyerAddress = value;
            else if (key === 'verkaufsdatum') obj.sellDate = value;
            else if (key === 'bild_oberseite_url') obj.topImageUrl = value;
            else if (key === 'bild_unterseite_url') obj.bottomImageUrl = value;
        }

        // Normalisiere Daten
        return this.normalizeTurtleObject(obj);
    }

    /**
     * Normalisiere Turtle-Objekt
     * @param {Object} obj - Turtle-Objekt
     * @returns {Object} Normalisiertes Objekt
     */
    normalizeTurtleObject(obj) {
        return {
            name: obj.name || '',
            breedingNumber: obj.breedingNumber || '',
            paperId: obj.paperId || '',
            birthDate: obj.birthDate ? this.normalizeDate(obj.birthDate) : '',
            status: obj.sold ? 'sold' : 'owned',
            buyer: obj.sold ? {
                firstName: obj.buyerFirstName || '',
                lastName: obj.buyerLastName || '',
                address: obj.buyerAddress || ''
            } : null,
            sellDate: obj.sellDate ? this.normalizeDate(obj.sellDate) : '',
            topImageUrl: obj.topImageUrl || '',
            bottomImageUrl: obj.bottomImageUrl || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Normalisiere Datum (DD.MM.YYYY oder YYYY-MM-DD)
     * @param {string} dateStr - Datum-String
     * @returns {string} Normalisiertes Datum (YYYY-MM-DD)
     */
    normalizeDate(dateStr) {
        if (!dateStr) return '';
        
        // Versuche verschiedene Formate zu erkennen
        if (dateStr.includes('-')) {
            return dateStr; // Bereits YYYY-MM-DD
        }
        
        if (dateStr.includes('.')) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        return dateStr;
    }

    /**
     * Lade Bilder von URLs oder aus lokalen Pfaden
     * @param {Array} turtles - Array von Turtle-Objekten
     * @param {Map} imageMap - Map von Pfaden zu Base64-Daten
     * @returns {Promise<Array>} Turtles mit geladenen Bildern
     */
    async loadImages(turtles, imageMap = new Map()) {
        const turtlesWithImages = [];

        for (const turtle of turtles) {
            const turtleData = { ...turtle, images: [] };

            // Lade Oberseite-Bild
            if (turtle.topImageUrl) {
                try {
                    let imageData;
                    if (imageMap.has(turtle.topImageUrl)) {
                        imageData = imageMap.get(turtle.topImageUrl);
                    } else {
                        imageData = await this.loadImageFromUrl(turtle.topImageUrl);
                    }
                    turtleData.images.push({
                        data: imageData,
                        side: 'top'
                    });
                } catch (error) {
                    console.warn(`Fehler beim Laden des Oberseite-Bildes: ${turtle.topImageUrl}`, error);
                }
            }

            // Lade Unterseite-Bild
            if (turtle.bottomImageUrl) {
                try {
                    let imageData;
                    if (imageMap.has(turtle.bottomImageUrl)) {
                        imageData = imageMap.get(turtle.bottomImageUrl);
                    } else {
                        imageData = await this.loadImageFromUrl(turtle.bottomImageUrl);
                    }
                    turtleData.images.push({
                        data: imageData,
                        side: 'bottom'
                    });
                } catch (error) {
                    console.warn(`Fehler beim Laden des Unterseite-Bildes: ${turtle.bottomImageUrl}`, error);
                }
            }

            // Entferne URLs
            delete turtleData.topImageUrl;
            delete turtleData.bottomImageUrl;

            turtlesWithImages.push(turtleData);
        }

        return turtlesWithImages;
    }

    /**
     * Lade Bild von URL und konvertiere zu Base64
     * @param {string} url - Bild-URL
     * @returns {Promise<string>} Base64-Bild-Daten
     */
    async loadImageFromUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            
            img.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${url}`));
            img.src = url;
        });
    }

    /**
     * Importiere Turtles mit Bildern in die Datenbank
     * @param {Array} turtles - Array von Turtle-Objekten mit Bildern
     * @returns {Promise<Object>} Importieren-Ergebnis
     */
    async importTurtlesIntoDB(turtles) {
        const result = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const turtle of turtles) {
            try {
                const images = turtle.images || [];
                delete turtle.images;

                // Füge Schildkröte hinzu
                const turtleId = await turtleDB.addTurtle(turtle);

                // Füge Bilder hinzu
                for (const image of images) {
                    await turtleDB.addImage(turtleId, image.data, image.side);
                }

                result.success++;
            } catch (error) {
                result.failed++;
                result.errors.push({
                    name: turtle.name,
                    error: error.message
                });
            }
        }

        return result;
    }

    /**
     * Lade und parse CSV-Datei
     * @param {File} file - CSV-Datei
     * @returns {Promise<Array>} Geparste Turtles
     */
    async importCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const turtles = this.parseCSV(content);
                    resolve(turtles);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Download CSV-Template
     */
    downloadTemplate() {
        const templateContent = `Name,Zuchtbuchnummer,Papier-ID,Geburtsdatum,Verkauft,Käufer_Vorname,Käufer_Nachname,Käufer_Adresse,Verkaufsdatum,Bild_Oberseite_URL,Bild_Unterseite_URL
Schildi,ZB-2024-001,P-2024-001,2020-01-15,Nein,,,,,
Schnecke,ZB-2024-002,P-2024-002,2021-06-20,Ja,Max,Mustermann,"Musterstraße 1, 12345 Musterstadt",2024-05-01,,`;

        const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `schildkroeten-template-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}

// Erstelle globale Instanz
const csvImporter = new CSVImporter();
