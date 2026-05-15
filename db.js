// IndexedDB-basierte Datenbank für Schildkröten
class TurtleDB {
    constructor() {
        this.dbName = 'SchildkroetenDB';
        this.version = 1;
        this.db = null;
        this.isInitialized = false;
    }

    // Initialisiere die Datenbank
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Erstelle Object Stores
                if (!db.objectStoreNames.contains('turtles')) {
                    const turtleStore = db.createObjectStore('turtles', { keyPath: 'id', autoIncrement: true });
                    turtleStore.createIndex('name', 'name', { unique: false });
                    turtleStore.createIndex('status', 'status', { unique: false });
                }

                if (!db.objectStoreNames.contains('images')) {
                    const imageStore = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
                    imageStore.createIndex('turtleId', 'turtleId', { unique: false });
                    imageStore.createIndex('side', 'side', { unique: false });
                }
            };
        });
    }

    // Füge eine neue Schildkröte hinzu
    async addTurtle(turtleData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['turtles'], 'readwrite');
            const store = transaction.objectStore('turtles');
            const request = store.add({
                name: turtleData.name,
                breedingNumber: turtleData.breedingNumber,
                paperId: turtleData.paperId,
                birthDate: turtleData.birthDate,
                status: 'owned', // 'owned' oder 'sold'
                profileImage: null,
                buyer: null,
                sellDate: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Aktualisiere eine Schildkröte
    async updateTurtle(id, turtleData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['turtles'], 'readwrite');
            const store = transaction.objectStore('turtles');
            
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const turtle = getRequest.result;
                if (turtle) {
                    Object.assign(turtle, turtleData);
                    turtle.updatedAt = new Date().toISOString();
                    
                    const updateRequest = store.put(turtle);
                    updateRequest.onerror = () => reject(updateRequest.error);
                    updateRequest.onsuccess = () => resolve(turtle);
                } else {
                    reject(new Error('Schildkröte nicht gefunden'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // Rufe eine Schildkröte ab
    async getTurtle(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['turtles'], 'readonly');
            const store = transaction.objectStore('turtles');
            const request = store.get(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    // Rufe alle Schildkröten ab
    async getAllTurtles(filter = 'all') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['turtles'], 'readonly');
            const store = transaction.objectStore('turtles');
            let request;

            if (filter === 'owned') {
                request = store.index('status').getAll('owned');
            } else if (filter === 'sold') {
                request = store.index('status').getAll('sold');
            } else {
                request = store.getAll();
            }

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Lösche eine Schildkröte
    async deleteTurtle(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['turtles', 'images'], 'readwrite');
            
            // Lösche Schildkröte
            const turtleStore = transaction.objectStore('turtles');
            const turtleRequest = turtleStore.delete(id);
            
            // Lösche alle zugehörigen Bilder
            const imageStore = transaction.objectStore('images');
            const imageIndex = imageStore.index('turtleId');
            const imagesRequest = imageIndex.getAll(id);
            
            imagesRequest.onsuccess = () => {
                imagesRequest.result.forEach(image => {
                    imageStore.delete(image.id);
                });
            };

            transaction.onerror = () => reject(transaction.error);
            transaction.oncomplete = () => resolve();
        });
    }

    // Füge ein Bild hinzu
    async addImage(turtleId, imageData, side = 'top') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images', 'turtles'], 'readwrite');
            const imageStore = transaction.objectStore('images');
            
            const request = imageStore.add({
                turtleId: turtleId,
                data: imageData,
                side: side, // 'top' oder 'bottom'
                uploadedAt: new Date().toISOString(),
                similarity: {}
            });

            request.onsuccess = () => {
                const imageId = request.result;
                
                // Aktualisiere das Profilbild (oberseite mit neustem Datum)
                const turtleStore = transaction.objectStore('turtles');
                const getTurtleRequest = turtleStore.get(turtleId);
                
                getTurtleRequest.onsuccess = () => {
                    const turtle = getTurtleRequest.result;
                    if (side === 'top') {
                        turtle.profileImage = imageId;
                        turtleStore.put(turtle);
                    }
                };
                
                resolve(imageId);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Rufe alle Bilder einer Schildkröte ab
    async getTurtleImages(turtleId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const index = store.index('turtleId');
            const request = index.getAll(turtleId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Lösche ein Bild
    async deleteImage(imageId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.delete(imageId);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    // Exportiere alle Daten
    async exportData() {
        const turtles = await this.getAllTurtles('all');
        const allImages = [];
        
        for (const turtle of turtles) {
            const images = await this.getTurtleImages(turtle.id);
            allImages.push(...images);
        }
        
        return {
            turtles,
            images: allImages,
            exportedAt: new Date().toISOString()
        };
    }

    // Importiere Daten
    async importData(data) {
        const transaction = this.db.transaction(['turtles', 'images'], 'readwrite');
        
        // Importiere Schildkröten
        const turtleStore = transaction.objectStore('turtles');
        data.turtles.forEach(turtle => {
            turtleStore.add(turtle);
        });
        
        // Importiere Bilder
        const imageStore = transaction.objectStore('images');
        data.images.forEach(image => {
            imageStore.add(image);
        });
        
        return new Promise((resolve, reject) => {
            transaction.onerror = () => reject(transaction.error);
            transaction.oncomplete = () => resolve();
        });
    }
}

// Erstelle eine globale Instanz
const turtleDB = new TurtleDB();