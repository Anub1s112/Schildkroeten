// Image Processing und Vergleich
class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    // Konvertiere ein Bild zu Base64
    async imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Berechne Ähnlichkeit zwischen zwei Bildern (vereinfachter Algorithmus)
    async calculateSimilarity(image1Data, image2Data) {
        try {
            const hist1 = await this.getImageHistogram(image1Data);
            const hist2 = await this.getImageHistogram(image2Data);
            
            // Bhattacharyya Koeffizient
            let similarity = 0;
            for (let i = 0; i < hist1.length; i++) {
                similarity += Math.sqrt(hist1[i] * hist2[i]);
            }
            
            return Math.round(similarity * 100);
        } catch (error) {
            console.error('Fehler bei Ähnlichkeitsberechnung:', error);
            return 0;
        }
    }

    // Berechne Histogramm eines Bildes
    async getImageHistogram(imageData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;
                    this.ctx.drawImage(img, 0, 0);
                    
                    const imageDataObj = this.ctx.getImageData(0, 0, img.width, img.height);
                    const histogram = new Uint32Array(256);
                    
                    for (let i = 0; i < imageDataObj.data.length; i += 4) {
                        const r = imageDataObj.data[i];
                        const g = imageDataObj.data[i + 1];
                        const b = imageDataObj.data[i + 2];
                        const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                        histogram[luminance]++;
                    }
                    
                    // Normalisiere das Histogramm
                    const total = img.width * img.height;
                    const normalized = Array.from(histogram).map(v => v / total);
                    
                    resolve(normalized);
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));
            img.src = imageData;
        });
    }

    // Komprimiere ein Bild
    async compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    
                    // Berechne neue Dimensionen
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    
                    this.canvas.width = width;
                    this.canvas.height = height;
                    this.ctx.drawImage(img, 0, 0, width, height);
                    
                    this.canvas.toBlob(resolve, 'image/jpeg', quality);
                };
                img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Erkenne die Seite eines Bildes (oben/unten)
    async detectImageSide(imageData) {
        // Vereinfachte Heuristik: kann später mit ML verbessert werden
        // Basierend auf Textmuster, Mustern, etc.
        try {
            const hist = await this.getImageHistogram(imageData);
            const variance = this.calculateVariance(hist);
            
            // Je höher die Varianz, desto eher ist es die Oberseite
            return variance > 0.5 ? 'top' : 'bottom';
        } catch (error) {
            return 'top'; // Standard
        }
    }

    // Berechne Varianz eines Arrays
    calculateVariance(arr) {
        const mean = arr.reduce((a, b) => a + b) / arr.length;
        const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2)) / arr.length;
        return variance;
    }

    // Vergleiche ein aufgenommenes Bild mit existierenden Bildern
    async findSimilarImages(capturedImageData, existingImages) {
        const results = [];
        
        for (const existingImage of existingImages) {
            const similarity = await this.calculateSimilarity(capturedImageData, existingImage.data);
            results.push({
                imageId: existingImage.id,
                side: existingImage.side,
                similarity: similarity,
                uploadedAt: existingImage.uploadedAt
            });
        }
        
        // Sortiere nach Ähnlichkeit (absteigend)
        return results.sort((a, b) => b.similarity - a.similarity);
    }
}

// Erstelle eine globale Instanz
const imageProcessor = new ImageProcessor();