// Hauptanwendungslogik
class TurtleApp {
    constructor() {
        this.currentTurtleId = null;
        this.currentView = 'overview';
        this.filterStatus = 'all';
        this.init();
    }

    async init() {
        try {
            // Initialisiere Datenbank
            await turtleDB.init();
            
            // Service Worker registrieren (falls verfügbar)
            if ('serviceWorker' in navigator) {
                try {
                    await navigator.serviceWorker.register('sw.js');
                } catch (error) {
                    console.log('Service Worker nicht verfügbar');
                }
            }
            
            // Event Listener
            this.setupEventListeners();
            
            // Lade dunklen Modus-Einstellung
            this.loadDarkModePreference();
            
            // Zeige Übersicht
            await this.loadTurtleOverview();
        } catch (error) {
            this.showToast('Fehler beim Initialisieren: ' + error.message, 'error');
            console.error(error);
        }
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('viewToggle').addEventListener('click', () => this.toggleView());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettingsModal());
        
        // Übersicht
        document.getElementById('addTurtleBtn').addEventListener('click', () => this.showEditView(null));
        document.getElementById('backBtn').addEventListener('click', () => this.switchView('overview'));
        document.getElementById('backFromEditBtn').addEventListener('click', () => this.switchView('overview'));
        
        // Filter
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterStatus = e.target.dataset.filter;
                this.loadTurtleOverview();
            });
        });
        
        // Formular
        document.getElementById('turtleForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('turtleSold').addEventListener('change', (e) => this.toggleBuyerInfo(e.target.checked));
        
        // Bilder
        document.getElementById('uploadImageBtn').addEventListener('click', () => this.uploadImage());
        document.getElementById('captureImageBtn').addEventListener('click', () => this.captureImage());
        document.getElementById('imageInput').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('cameraInput').addEventListener('change', (e) => this.handleCameraCapture(e));
        
        // Modal
        document.getElementById('closeMatchModal').addEventListener('click', () => this.closeMatchModal());
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeSettingsModal());
        
        // Einstellungen
        document.getElementById('darkModeToggle').addEventListener('change', (e) => this.toggleDarkMode(e.target.checked));
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn').addEventListener('click', () => this.importData());
    }

    // Lade Schildkröten-Übersicht
    async loadTurtleOverview() {
        try {
            const turtles = await turtleDB.getAllTurtles(this.filterStatus);
            const container = document.getElementById('turtleList');
            container.innerHTML = '';
            
            if (turtles.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Noch keine Schildkröten hinzugefügt</p></div>';
                return;
            }
            
            for (const turtle of turtles) {
                const card = await this.createTurtleCard(turtle);
                container.appendChild(card);
            }
        } catch (error) {
            this.showToast('Fehler beim Laden: ' + error.message, 'error');
        }
    }

    // Erstelle eine Schildkröten-Karte
    async createTurtleCard(turtle) {
        const card = document.createElement('div');
        card.className = 'turtle-card';
        
        // Lade Profilbild
        let profileImageHtml = '<div class="turtle-card-image">🐢</div>';
        if (turtle.profileImage) {
            try {
                const image = await this.getImageById(turtle.profileImage);
                if (image) {
                    profileImageHtml = `<div class="turtle-card-image"><img src="${image.data}" alt="${turtle.name}"></div>`;
                }
            } catch (error) {
                console.error('Fehler beim Laden des Bildes:', error);
            }
        }
        
        const statusClass = turtle.status === 'sold' ? 'status-sold' : 'status-owned';
        const statusText = turtle.status === 'sold' ? 'Verkauft' : 'Im Besitz';
        const age = this.calculateAge(turtle.birthDate);
        
        card.innerHTML = `
            ${profileImageHtml}
            <div class="turtle-card-content">
                <div class="turtle-card-title">${turtle.name}</div>
                <div class="turtle-card-info">Alter: ${age}</div>
                <div class="turtle-card-info">ZB-Nr: ${turtle.breedingNumber || '-'}</div>
                <span class="turtle-card-status ${statusClass}">${statusText}</span>
            </div>
        `;
        
        card.addEventListener('click', () => this.showDetailView(turtle.id));
        return card;
    }

    // Zeige Detail-View
    async showDetailView(turtleId) {
        try {
            const turtle = await turtleDB.getTurtle(turtleId);
            if (!turtle) {
                this.showToast('Schildkröte nicht gefunden', 'error');
                return;
            }
            
            this.currentTurtleId = turtleId;
            const detailContainer = document.getElementById('turtleDetail');
            
            // Lade Bilder
            const images = await turtleDB.getTurtleImages(turtleId);
            const profileImage = turtle.profileImage ? images.find(img => img.id === turtle.profileImage) : null;
            
            const age = this.calculateAge(turtle.birthDate);
            const statusClass = turtle.status === 'sold' ? 'status-sold' : 'status-owned';
            const statusText = turtle.status === 'sold' ? 'Verkauft' : 'Im Besitz';
            
            let profileImageHtml = '🐢';
            if (profileImage) {
                profileImageHtml = `<img src="${profileImage.data}" alt="${turtle.name}">`;
            }
            
            let buyerInfo = '';
            if (turtle.status === 'sold' && turtle.buyer) {
                buyerInfo = `
                    <div class="detail-row">
                        <div class="detail-label">Käufer:</div>
                        <div class="detail-value">${turtle.buyer.firstName} ${turtle.buyer.lastName}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Adresse:</div>
                        <div class="detail-value">${turtle.buyer.address.replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Verkaufsdatum:</div>
                        <div class="detail-value">${this.formatDate(turtle.sellDate)}</div>
                    </div>
                `;
            }
            
            let galleryHtml = '';
            if (images.length > 0) {
                const topImages = images.filter(img => img.side === 'top');
                const bottomImages = images.filter(img => img.side === 'bottom');
                
                if (topImages.length > 0) {
                    galleryHtml += '<h3>Oberseite</h3><div class="gallery-grid">';
                    topImages.forEach(img => {
                        galleryHtml += `<div class="gallery-item"><img src="${img.data}" alt="Oberseite"></div>`;
                    });
                    galleryHtml += '</div>';
                }
                
                if (bottomImages.length > 0) {
                    galleryHtml += '<h3>Unterseite</h3><div class="gallery-grid">';
                    bottomImages.forEach(img => {
                        galleryHtml += `<div class="gallery-item"><img src="${img.data}" alt="Unterseite"></div>`;
                    });
                    galleryHtml += '</div>';
                }
            }
            
            detailContainer.innerHTML = `
                <div class="detail-header">
                    <div class="detail-image">${profileImageHtml}</div>
                    <div class="detail-info">
                        <h2>${turtle.name}</h2>
                        <div class="detail-row">
                            <div class="detail-label">Geburtsdatum:</div>
                            <div class="detail-value">${this.formatDate(turtle.birthDate)}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Alter:</div>
                            <div class="detail-value">${age}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Zuchtbuchnummer:</div>
                            <div class="detail-value">${turtle.breedingNumber || '-'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Papier-ID:</div>
                            <div class="detail-value">${turtle.paperId || '-'}</div>
                        </div>
                        ${buyerInfo}
                        <div class="detail-status ${statusClass}">${statusText}</div>
                        <div class="detail-actions">
                            <button class="btn btn-primary" onclick="app.showEditView(${turtle.id})">Bearbeiten</button>
                            <button class="btn btn-secondary" onclick="app.switchView('overview')">Zurück</button>
                        </div>
                    </div>
                </div>
                <div class="gallery-section">
                    ${galleryHtml}
                </div>
            `;
            
            this.switchView('detail');
        } catch (error) {
            this.showToast('Fehler beim Laden der Details: ' + error.message, 'error');
        }
    }

    // Zeige Bearbeitungs-View
    async showEditView(turtleId) {
        try {
            const form = document.getElementById('turtleForm');
            form.reset();
            
            if (turtleId) {
                // Bearbeite existierende Schildkröte
                const turtle = await turtleDB.getTurtle(turtleId);
                if (!turtle) {
                    this.showToast('Schildkröte nicht gefunden', 'error');
                    return;
                }
                
                document.getElementById('turtleName').value = turtle.name;
                document.getElementById('turtleBreedingNumber').value = turtle.breedingNumber || '';
                document.getElementById('turtlePaperId').value = turtle.paperId || '';
                document.getElementById('turtleBirthDate').value = turtle.birthDate || '';
                document.getElementById('turtleSold').checked = turtle.status === 'sold';
                
                if (turtle.buyer) {
                    document.getElementById('buyerFirstName').value = turtle.buyer.firstName || '';
                    document.getElementById('buyerLastName').value = turtle.buyer.lastName || '';
                    document.getElementById('buyerAddress').value = turtle.buyer.address || '';
                    document.getElementById('sellDate').value = turtle.sellDate || '';
                }
                
                this.toggleBuyerInfo(turtle.status === 'sold');
                document.getElementById('deleteTurtleBtn').style.display = 'block';
                document.querySelector('.turtle-form h2').textContent = 'Schildkröte bearbeiten';
                
                // Lade Bilder
                await this.loadTurtleImages(turtleId);
            } else {
                // Neue Schildkröte
                document.getElementById('deleteTurtleBtn').style.display = 'none';
                document.querySelector('.turtle-form h2').textContent = 'Neue Schildkröte';
                document.getElementById('imagePreview').innerHTML = '';
            }
            
            this.currentTurtleId = turtleId;
            this.switchView('edit');
        } catch (error) {
            this.showToast('Fehler: ' + error.message, 'error');
        }
    }

    // Lade Bilder einer Schildkröte
    async loadTurtleImages(turtleId) {
        try {
            const images = await turtleDB.getTurtleImages(turtleId);
            const previewContainer = document.getElementById('imagePreview');
            previewContainer.innerHTML = '';
            
            images.forEach(image => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.innerHTML = `
                    <img src="${image.data}" alt="Bild">
                    <span class="image-item-label">${image.side === 'top' ? 'Oben' : 'Unten'}</span>
                    <button type="button" class="image-item-remove" data-image-id="${image.id}">×</button>
                `;
                
                imageItem.querySelector('.image-item-remove').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.removeImage(image.id);
                });
                
                previewContainer.appendChild(imageItem);
            });
        } catch (error) {
            console.error('Fehler beim Laden der Bilder:', error);
        }
    }

    // Handle Formular-Submit
    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const turtleData = {
                name: document.getElementById('turtleName').value,
                breedingNumber: document.getElementById('turtleBreedingNumber').value,
                paperId: document.getElementById('turtlePaperId').value,
                birthDate: document.getElementById('turtleBirthDate').value,
                status: document.getElementById('turtleSold').checked ? 'sold' : 'owned'
            };
            
            if (turtleData.status === 'sold') {
                turtleData.buyer = {
                    firstName: document.getElementById('buyerFirstName').value,
                    lastName: document.getElementById('buyerLastName').value,
                    address: document.getElementById('buyerAddress').value
                };
                turtleData.sellDate = document.getElementById('sellDate').value;
            }
            
            if (this.currentTurtleId) {
                // Update
                await turtleDB.updateTurtle(this.currentTurtleId, turtleData);
                this.showToast('Schildkröte aktualisiert!');
            } else {
                // Create
                await turtleDB.addTurtle(turtleData);
                this.showToast('Schildkröte hinzugefügt!');
            }
            
            await this.loadTurtleOverview();
            this.switchView('overview');
        } catch (error) {
            this.showToast('Fehler beim Speichern: ' + error.message, 'error');
        }
    }

    // Handle Bild-Upload
    async handleImageUpload(e) {
        const files = e.target.files;
        if (files.length === 0) return;
        
        try {
            for (let file of files) {
                const base64 = await imageProcessor.imageToBase64(file);
                const side = await imageProcessor.detectImageSide(base64);
                
                if (this.currentTurtleId) {
                    await turtleDB.addImage(this.currentTurtleId, base64, side);
                }
            }
            
            if (this.currentTurtleId) {
                await this.loadTurtleImages(this.currentTurtleId);
            }
            this.showToast('Bilder hochgeladen!');
        } catch (error) {
            this.showToast('Fehler beim Upload: ' + error.message, 'error');
        }
        
        e.target.value = '';
    }

    // Handle Kamera-Capture
    async handleCameraCapture(e) {
        const files = e.target.files;
        if (files.length === 0) return;
        
        try {
            const file = files[0];
            const base64 = await imageProcessor.imageToBase64(file);
            
            if (this.currentTurtleId) {
                // Finde ähnliche Bilder
                const images = await turtleDB.getTurtleImages(this.currentTurtleId);
                if (images.length > 0) {
                    const matches = await imageProcessor.findSimilarImages(base64, images);
                    this.showImageMatchModal(matches, base64);
                } else {
                    // Keine Bilder zum Vergleichen
                    const side = await imageProcessor.detectImageSide(base64);
                    await turtleDB.addImage(this.currentTurtleId, base64, side);
                    await this.loadTurtleImages(this.currentTurtleId);
                    this.showToast('Foto hinzugefügt!');
                }
            } else {
                this.showToast('Bitte speichere zuerst die Schildkröte', 'error');
            }
        } catch (error) {
            this.showToast('Fehler beim Fotografieren: ' + error.message, 'error');
        }
        
        e.target.value = '';
    }

    // Zeige Bild-Match Modal
    async showImageMatchModal(matches, capturedImageData) {
        const modal = document.getElementById('imageMatchModal');
        const options = document.getElementById('matchOptions');
        options.innerHTML = '';
        
        if (matches.length === 0) {
            options.innerHTML = '<p>Keine ähnlichen Bilder gefunden</p>';
        } else {
            matches.slice(0, 4).forEach(match => {
                const option = document.createElement('div');
                option.className = 'match-option';
                
                const image = document.createElement('img');
                // In einer echten App würde die Bild-ID verwendet
                option.innerHTML = `
                    <div class="match-option-score">${match.similarity}%</div>
                    <p>${match.side === 'top' ? 'Oberseite' : 'Unterseite'}</p>
                `;
                
                option.addEventListener('click', async () => {
                    try {
                        const side = match.similarity > 70 ? match.side : (match.side === 'top' ? 'bottom' : 'top');
                        await turtleDB.addImage(this.currentTurtleId, capturedImageData, side);
                        await this.loadTurtleImages(this.currentTurtleId);
                        this.closeMatchModal();
                        this.showToast('Foto hinzugefügt!');
                    } catch (error) {
                        this.showToast('Fehler: ' + error.message, 'error');
                    }
                });
                
                options.appendChild(option);
            });
        }
        
        modal.classList.remove('hidden');
    }

    // Schließe Match Modal
    closeMatchModal() {
        document.getElementById('imageMatchModal').classList.add('hidden');
    }

    // Entferne ein Bild
    async removeImage(imageId) {
        if (confirm('Bild wirklich entfernen?')) {
            try {
                await turtleDB.deleteImage(imageId);
                if (this.currentTurtleId) {
                    await this.loadTurtleImages(this.currentTurtleId);
                }
                this.showToast('Bild entfernt!');
            } catch (error) {
                this.showToast('Fehler beim Löschen: ' + error.message, 'error');
            }
        }
    }

    // Upload-Button
    uploadImage() {
        document.getElementById('imageInput').click();
    }

    // Capture-Button
    captureImage() {
        document.getElementById('cameraInput').click();
    }

    // Lösche Schildkröte
    async deleteTurtle() {
        if (confirm('Schildkröte wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) {
            try {
                await turtleDB.deleteTurtle(this.currentTurtleId);
                this.showToast('Schildkröte gelöscht!');
                await this.loadTurtleOverview();
                this.switchView('overview');
            } catch (error) {
                this.showToast('Fehler beim Löschen: ' + error.message, 'error');
            }
        }
    }

    // Toggle Käufer-Info
    toggleBuyerInfo(show) {
        const buyerInfo = document.getElementById('buyerInfo');
        if (show) {
            buyerInfo.classList.remove('hidden');
        } else {
            buyerInfo.classList.add('hidden');
        }
    }

    // Zeige Einstellungen Modal
    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        document.getElementById('darkModeToggle').checked = document.body.classList.contains('dark-mode');
        modal.classList.remove('hidden');
    }

    // Schließe Settings Modal
    closeSettingsModal() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    // Toggle Dark Mode
    toggleDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    }

    // Lade Dark Mode Präferenz
    loadDarkModePreference() {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'true') {
            document.body.classList.add('dark-mode');
        }
    }

    // Exportiere Daten
    async exportData() {
        try {
            const data = await turtleDB.exportData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `schildkroeten-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Daten exportiert!');
        } catch (error) {
            this.showToast('Fehler beim Export: ' + error.message, 'error');
        }
    }

    // Importiere Daten
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                const text = await file.text();
                const data = JSON.parse(text);
                await turtleDB.importData(data);
                await this.loadTurtleOverview();
                this.showToast('Daten importiert!');
            } catch (error) {
                this.showToast('Fehler beim Import: ' + error.message, 'error');
            }
        };
        input.click();
    }

    // Hilfsfunktionen
    calculateAge(birthDate) {
        if (!birthDate) return '-';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age + ' Jahre';
    }

    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('de-DE');
    }

    switchView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewName + 'View').classList.add('active');
        this.currentView = viewName;
    }

    toggleView() {
        if (this.currentView === 'overview') {
            this.switchView('detail');
        } else {
            this.switchView('overview');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + (type === 'error' ? 'error' : '');
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Hilfsfunktion zum Abrufen eines Bildes nach ID
    async getImageById(imageId) {
        const transaction = turtleDB.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        return new Promise((resolve, reject) => {
            const request = store.get(imageId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }
}

// Delete Button Handler
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        if (e.target.id === 'deleteTurtleBtn') {
            e.preventDefault();
            app.deleteTurtle();
        }
    });
});

// Starte die App
const app = new TurtleApp();