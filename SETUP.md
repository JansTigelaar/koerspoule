# Koerspoule Setup Handleiding

Volg deze stappen om je Koerspoule applicatie op te zetten en te deployen.

## Stap 1: Project Klaarzetten (5 minuten)

### 1.1 Repository aanmaken

1. Ga naar https://github.com/new
2. Repository naam: `koerspoule`
3. Zet op **Public**
4. Klik op **Create repository**

### 1.2 Code uploaden

```bash
cd koerspoule-app
git init
git add .
git commit -m "Initial commit: Koerspoule app"
git branch -M main
git remote add origin https://github.com/JOUW_USERNAME/koerspoule.git
git push -u origin main
```

## Stap 2: Firebase Setup (10 minuten)

### 2.1 Firebase Project Aanmaken

1. Ga naar https://console.firebase.google.com/
2. Klik op **Add project** / **Project toevoegen**
3. Project naam: `koerspoule`
4. Google Analytics: kan uit (niet nodig)
5. Klik op **Create project**

### 2.2 Authentication Instellen

1. Klik in het linker menu op **Authentication**
2. Klik op **Get started**
3. Bij **Sign-in method**, klik op **Email/Password**
4. Zet de eerste toggle **Enable** aan
5. Klik op **Save**

### 2.3 Firestore Database Aanmaken

1. Klik in het linker menu op **Firestore Database**
2. Klik op **Create database**
3. Kies **Start in production mode**
4. Kies location: **europe-west3** (Frankfurt)
5. Klik op **Enable**

### 2.4 Security Rules en Indexes Instellen

**Optie A: Via Firebase Console (makkelijk)**

1. Blijf op de Firestore Database pagina
2. Klik op het tabje **Rules**
3. Kopieer de inhoud van `firestore.rules` uit je project
4. Klik op **Publish**
5. Klik op het tabje **Indexes**
6. Voor elke composite index in `firestore.indexes.json`, maak een nieuwe index aan

**Optie B: Via Firebase CLI (aanbevolen)**

```bash
# Installeer Firebase CLI (eerste keer)
npm install -g firebase-tools

# Login bij Firebase
firebase login

# Initialiseer project (selecteer je project)
firebase use --add

# Deploy rules en indexes
firebase deploy --only firestore:rules,firestore:indexes
```

De `firestore.rules` en `firestore.indexes.json` bestanden zijn al aanwezig in je project met de correcte configuratie.

### 2.5 Web App Configuratie Ophalen

1. Ga naar **Project Settings** (tandwiel icoon rechtsboven)
2. Scroll naar beneden naar **Your apps**
3. Klik op het **</>** icoon (web app)
4. App nickname: `Koerspoule Web`
5. **Hosting niet aanvinken**
6. Klik op **Register app**
7. **Kopieer de firebaseConfig waarden**

### 2.6 Config Toevoegen aan Project

1. Open `src/firebase/config.js` in je code editor
2. Vervang de placeholder waarden met je eigen waarden:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                          // Jouw API key
  authDomain: "koerspoule-xxx.firebaseapp.com",
  projectId: "koerspoule-xxx",
  storageBucket: "koerspoule-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

3. Sla het bestand op

## Stap 3: Test Data Toevoegen (5 minuten)

### 3.1 Test Event Aanmaken

1. Ga terug naar Firebase Console
2. Klik op **Firestore Database**
3. Klik op **Start collection**
4. Collection ID: `events`
5. Document ID: laat automatisch genereren
6. Voeg deze velden toe:

| Field | Type | Value |
|-------|------|-------|
| name | string | Tour de France 2025 |
| description | string | De grootste wielerronde ter wereld |
| startDate | string | 2025-06-30 |
| endDate | string | 2025-07-21 |
| location | string | Frankrijk |
| status | string | active |

7. Klik op **Save**

## Stap 4: Lokaal Testen (5 minuten)

```bash
# Installeer dependencies (eerste keer)
npm install

# Start development server
npm start
```

De app opent op http://localhost:3000

### 4.1 Test de Applicatie

1. **Registreer** een nieuwe gebruiker
2. Klik op het **Tour de France 2025** event
3. Klik op **Team maken**
4. Voer een teamnaam in
5. Selecteer renners voor alle 25 categorieën (let op: per categorie zie je alleen de toegestane renners)
6. Klik op **Team opslaan**
7. Je team verschijnt nu op het dashboard
8. Bekijk het **Klassement**

## Stap 5: Deploy naar GitHub Pages (10 minuten)

### 5.1 Package.json Aanpassen

1. Open `package.json`
2. Pas de `homepage` regel aan:

```json
"homepage": "https://JOUW_USERNAME.github.io/koerspoule"
```

3. Sla op

### 5.2 GitHub Pages Activeren

1. Ga naar je GitHub repository
2. Klik op **Settings**
3. Klik op **Pages** in het linker menu
4. Bij **Source**, selecteer: **GitHub Actions**

### 5.3 Deploy

```bash
# Commit je Firebase config
git add .
git commit -m "Add Firebase config"
git push

# Of deploy direct
npm run deploy
```

### 5.4 Wacht op Deployment

1. Ga naar **Actions** tab in je GitHub repository
2. Wacht tot de groene vinkje verschijnt
3. Je site is nu live op: `https://JOUW_USERNAME.github.io/koerspoule`

## Stap 6: Admin Rechten Geven (Optioneel)

Om events en scores te kunnen beheren, moet je admin zijn:

1. Registreer eerst via de website
2. Ga naar Firebase Console > Firestore Database
3. Zoek je user document in de `users` collection
4. Klik op je user document
5. Klik op **Add field**
6. Field: `isAdmin`, Type: `boolean`, Value: `true`
7. Klik op **Update**

## Veelvoorkomende Problemen

### "Permission denied" errors

- Controleer of de Firestore Security Rules correct zijn ingesteld (zie stap 2.4)
- Controleer of je bent ingelogd
- Als teams niet opgeslagen worden, check of de `allow create` regel voor teams aanwezig is

### Firebase config errors

- Controleer of alle waarden in `config.js` correct zijn gekopieerd
- Let op dat je geen quotes of komma's mist

### "The query requires an index" error

Dit betekent dat de composite indexes nog niet zijn aangemaakt. Er zijn twee opties:

1. **Automatisch**: Klik op de link in de error message die Firebase geeft - dit maakt automatisch de index aan
2. **Handmatig**: Deploy de indexes via Firebase CLI: `firebase deploy --only firestore:indexes`

De benodigde indexes staan in `firestore.indexes.json` en zijn:
- `events` collection: `status` + `startDate` (voor actieve events sorteren)
- `teams` collection: `eventId` + `userId` (voor user teams ophalen)
- `teams` collection: `eventId` + `totalPoints` (voor leaderboard sorteren)

### GitHub Pages 404

- Controleer of de `homepage` URL in package.json correct is
- Wacht 5-10 minuten na deployment
- Check GitHub Actions tab voor errors

### Build fails

```bash
# Verwijder node_modules en installeer opnieuw
rm -rf node_modules package-lock.json
npm install
npm start
```

## Volgende Stappen

### Meer Events Toevoegen

Voeg meer events toe via Firebase Console met dezelfde velden als je test event.

### Scores Bijwerken

Na elke etappe kun je scores bijwerken via Firebase Console of een script.

### Custom Domain (Optioneel)

Je kunt een eigen domein koppelen via GitHub Pages settings.

## Support

Heb je problemen? Open een issue op GitHub of mail naar support@koerspoule.nl

---

**Succes met je Koerspoule! 🚴‍♂️**
