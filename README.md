# 🐢 Schildkrötenverwaltungsapp

Eine Progressive Web App (PWA) zur Verwaltung von Schildkröten-Akten. Die App funktioniert auf Web, iOS und Android.

## Funktionen

### Grundfunktionen
- ✅ **Schildkröten-Verwaltung**: Erstelle und verwalte Akten für deine Schildkröten
- ✅ **Bildverwaltung**: Lade Bilder von Ober- und Unterseite hoch
- ✅ **Profilbilder**: Das neueste Oberseite-Bild wird automatisch als Profilbild verwendet
- ✅ **Datenerfassung**: Speichere Zuchtbuchnummer, Papier-ID und Geburtsdatum
- ✅ **Verkaufs-Tracking**: Markiere Schildkröten als verkauft und speichere Käuferinformationen
- ✅ **Filterung**: Unterscheide zwischen im Besitz befindlichen und verkauften Schildkröten

### Bildverarbeitung
- 📷 **Foto machen**: Nutze die Kamera deines Geräts zur Bildaufnahme
- 🖼️ **Bilder hochladen**: Lade Bilder von deinem Gerät hoch
- 🔍 **Bildvergleich**: Die App erkennt automatisch ähnliche Bilder und schlägt die beste Übereinstimmung vor
- 🗑️ **Bildverwaltung**: Lösche Bilder und passe die Akte an

### Cross-Platform
- 🌐 **Web**: Nutze die App im Browser auf deinem Computer
- 📱 **iOS**: Installiere als App über "Zum Startbildschirm hinzufügen"
- 🤖 **Android**: Installiere als App über das Menü oder "Zum Startbildschirm hinzufügen"
- 📡 **Offline**: Funktioniert auch ohne Internetverbindung

### Zusätzliche Features
- 🌙 **Dunkler Modus**: Angenehme Benutzeroberfläche in der Nacht
- 💾 **Daten-Export/Import**: Backup deine Daten als JSON
- 🔄 **Sync**: Daten sind lokal auf dem Gerät gespeichert

## Installation

### Auf der Website
1. Öffne die App im Browser: `https://deine-domain.de/Schildkroeten`

### Auf iOS
1. Öffne die App in Safari
2. Tippe auf das Share-Symbol
3. Wähle "Zum Startbildschirm hinzufügen"
4. Gebe einen Namen ein und tippe "Hinzufügen"

### Auf Android
1. Öffne die App in Chrome
2. Tippe auf das Menü (drei Punkte)
3. Wähle "Zum Startbildschirm hinzufügen" oder "App installieren"

## Verwendung

### Neue Schildkröte hinzufügen
1. Klicke auf "+ Neue Schildkröte"
2. Fülle die Daten aus:
   - **Name**: Der Name deiner Schildkröte
   - **Zuchtbuchnummer**: Eindeutige Identifikation
   - **Papier-ID**: ID aus den Zuchtpapieren
   - **Geburtsdatum**: Wird für die Altersberechnung verwendet
3. Lade Bilder hoch
4. Klicke "Speichern"

### Bilder hinzufügen
1. Öffne die Schildkröte und klicke "Bearbeiten"
2. Klicke auf:
   - **📷 Foto machen**: Nutze die Kamera
   - **📁 Bild hochladen**: Wähle Bilder vom Gerät
3. Die App erkennt automatisch, ob es die Ober- oder Unterseite ist
4. Falls Ähnlichkeiten erkannt werden, wähle die beste Option

### Schildkröte verkaufen
1. Öffne die Schildkröte und klicke "Bearbeiten"
2. Aktiviere "Verkauft"
3. Gebe die Käuferinformationen ein:
   - **Vorname & Nachname**
   - **Adresse**
   - **Verkaufsdatum**
4. Speichere die Änderungen

### Filter und Ansicht
- **Alle**: Zeige alle Schildkröten
- **Im Besitz**: Zeige nur Schildkröten, die du noch hast
- **Verkauft**: Zeige nur verkaufte Schildkröten

### Daten sichern
1. Öffne die Einstellungen (⚙️)
2. Klicke "Daten exportieren" um ein Backup zu erstellen
3. Klicke "Daten importieren" um ein Backup wiederherzustellen

## Technologie

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Datenbank**: IndexedDB (lokal auf dem Gerät)
- **Service Worker**: Offline-Support
- **PWA**: Installierbar auf allen Plattformen
- **Bildverarbeitung**: Canvas API, Histogram Matching

## Datenschutz

- 🔒 **Lokal gespeichert**: Alle Daten werden ausschließlich auf deinem Gerät gespeichert
- 🚫 **Keine Cloud**: Keine Synchronisation mit Servern
- 📊 **Keine Tracking**: Keine Verfolgung oder Analyse

## Browser-Kompatibilität

- ✅ Chrome/Chromium 50+
- ✅ Firefox 50+
- ✅ Safari 11+ (iOS 12+)
- ✅ Edge 15+

## Tipps & Tricks

1. **Profilbilder**: Mache hochwertige Fotos der Oberseite für die beste Erkennung
2. **Organisation**: Gebe deinen Schildkröten aussagekräftige Namen
3. **Backup**: Exportiere deine Daten regelmäßig
4. **Offline**: Die App funktioniert auch ohne Internetverbindung

## Bekannte Einschränkungen

- Die Bildähnlichkeit ist vereinfacht - sie kann mit fortgeschrittener Bildverarbeitung verbessert werden
- Speicherplatz ist begrenzt durch die verfügbare Festplatte des Geräts

## Zukünftige Features

- 🤖 Machine Learning für bessere Bildähnlichkeit
- 📊 Statistiken und Grafiken
- 🏷️ Kategorien und Tags
- 🔔 Erinnerungen und Kalender
- 🌍 Mehrsprachigkeit
- ☁️ Optionale Cloud-Synchronisation

## Lizenz

MIT

## Kontakt & Support

Bei Fragen oder Problemen öffne bitte ein Issue auf GitHub.