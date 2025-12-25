# 🚴 Koerspoule - Fantasy Cycling Competition App

Een moderne fantasy cycling applicatie gebouwd met React en Firebase, speciaal ontworpen voor Nederlandse wielerliefhebbers.

## ✨ Features

- **🏆 Fantasy Teams**: Stel je eigen wielerteam samen uit 228 renners verdeeld over 25 categorieën
- **📊 Live Klassement**: Volg de stand in realtime na elke etappe
- **🤖 AI Verhalen**: Automatisch gegenereerde Nederlandse wielerverslagen powered by OpenAI GPT-4
- **👥 Multi-User**: Meerdere gebruikers kunnen deelnemen per event
- **🔐 Beveiligd**: Admin dashboard met volledige access control
- **📱 Responsive**: Werkt perfect op desktop, tablet en mobiel
- **⚡ Real-time Updates**: Automatische puntenberekening en klassement updates

## 🛠️ Technologie Stack

- **Frontend**: React 18 + React Router
- **Backend**: Firebase (Authentication + Firestore)
- **AI**: OpenAI GPT-4 voor verhalen generatie
- **Hosting**: GitHub Pages
- **Styling**: Custom CSS met CSS variabelen
- **Icons**: Lucide React

## 🚀 Live Demo

[https://janstigelaar.github.io/koerspoule](https://janstigelaar.github.io/koerspoule)

## 📋 Vereisten

- Node.js 16+ en npm
- Firebase project (gratis tier is voldoende)
- OpenAI API key (voor AI verhalen)
- GitHub account (voor hosting)

## ⚙️ Installatie

### 1. Clone Repository

```bash
git clone https://github.com/JansTigelaar/koerspoule.git
cd koerspoule
npm install
```

### 2. Firebase Setup

1. Ga naar [Firebase Console](https://console.firebase.google.com/)
2. Maak een nieuw project aan
3. Activeer **Authentication** (Email/Password)
4. Activeer **Firestore Database**
5. Kopieer je Firebase config naar `src/firebase/config.js`

Voor gedetailleerde instructies, zie `SETUP.md`

### 3. Environment Variables

Maak een `.env` bestand in de root:

```bash
cp .env.example .env
```

Vul je OpenAI API key in:

```
REACT_APP_OPENAI_API_KEY=sk-proj-jouw-api-key-hier
```

### 4. Firestore Rules en Indexes Deployen

```bash
npm install -g firebase-tools
firebase login
firebase init firestore  # Selecteer je project
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Start Development Server

```bash
npm start
```

App draait nu op [http://localhost:3000](http://localhost:3000)

## 📦 Deployment naar GitHub Pages

### Eerste keer:

```bash
# 1. Maak repository aan op GitHub: https://github.com/new

# 2. Push code naar GitHub
git remote add origin https://github.com/JansTigelaar/koerspoule.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main

# 3. Deploy naar GitHub Pages
npm run deploy
```

### Updates deployen:

```bash
git add .
git commit -m "Update beschrijving"
git push
npm run deploy
```

Je app is nu live op: `https://janstigelaar.github.io/koerspoule`

## 👤 Admin Worden

Om admin rechten te krijgen:

1. Registreer een account via de app
2. Ga naar Firebase Console → Firestore
3. Navigeer naar `users` collectie
4. Vind je user document (met je UID)
5. Voeg field toe: `isAdmin: true` (boolean)
6. Refresh de app - je hebt nu admin toegang!

## 🎯 Gebruik

### Als Speler:

1. **Registreer** een account
2. **Maak een team** voor een actief event
3. **Selecteer 25 renners** (1 per categorie uit toegestane renners)
4. **Volg het klassement** na elke etappe
5. **Lees AI verhalen** over de etappe op het dashboard

### Als Admin:

1. Ga naar **Admin** (via navigatie menu - alleen zichtbaar voor admins)
2. **Voer etappe resultaten in**:
   - Selecteer event en etappe nummer
   - Kopieer top 20 uit [Procyclingstats](https://www.procyclingstats.com)
   - Formaat: `1. POGAČAR Tadej (1)`
3. **Klik "Resultaten Verwerken"**
4. AI genereert automatisch een verhaal (3-10 seconden)
5. **Bekijk en publiceer** het verhaal voor alle gebruikers

## 📊 Punten Systeem

| Positie | Punten | Positie | Punten |
|---------|--------|---------|--------|
| 1e      | 50     | 11e     | 10     |
| 2e      | 40     | 12e     | 9      |
| 3e      | 35     | 13e     | 8      |
| 4e      | 30     | 14e     | 7      |
| 5e      | 26     | 15e     | 6      |
| 6e      | 22     | 16e     | 5      |
| 7e      | 19     | 17e     | 4      |
| 8e      | 16     | 18e     | 3      |
| 9e      | 14     | 19e     | 2      |
| 10e     | 12     | 20e     | 1      |

Alleen renners in de top 20 krijgen punten per etappe.

## 🔧 Configuratie

### AI Prompt Aanpassen

Edit `src/utils/storyGenerator.js`:
```javascript
const prompt = `Schrijf een verhaal over etappe ${stageNumber}...`;
```

Zie `AI_STORY_TESTING.md` voor gedetailleerde prompt configuratie en voorbeelden.

### Renners Toevoegen/Wijzigen

Edit `src/data/riders.js`:
```javascript
export const RIDERS = [
  { id: 1, name: "POGAČAR Tadej", number: 1, isJoker: false, isYoungRider: false }
];
```

### Categorieën Aanpassen

Edit `src/data/categories.js`:
```javascript
export const CATEGORIES = [
  { 
    id: 'cat1', 
    name: 'Klassementsrenner 1', 
    allowedRiderNumbers: [1, 11, 21, 31, 41] 
  }
];
```

## 📁 Project Structuur

```
koerspoule-app/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Admin/              # Admin functionaliteit
│   │   │   ├── StageResults.js # Resultaten invoeren
│   │   │   └── StageStory.js   # AI verhaal weergave
│   │   ├── Auth/               # Authenticatie
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── ProtectedAdminRoute.js
│   │   ├── Dashboard/          # Hoofdpagina
│   │   ├── Events/             # Evenementen lijst
│   │   ├── Leaderboard/        # Klassement
│   │   ├── Navigation/         # Menu
│   │   └── Team/               # Team builder (25 categorieën)
│   ├── data/
│   │   ├── categories.js       # 25 categorieën met toegestane renners
│   │   └── riders.js           # 228 renners database
│   ├── firebase/
│   │   └── config.js           # Firebase configuratie
│   ├── utils/
│   │   ├── pointsCalculator.js # Punten berekening logica
│   │   └── storyGenerator.js   # AI verhaal generatie
│   ├── App.js                  # Hoofd routing
│   ├── App.css                 # Globale styling
│   └── index.js                # Entry point
├── .env                        # Environment variables (niet in git!)
├── .env.example                # Template voor .env
├── firestore.rules             # Database beveiliging
├── firestore.indexes.json      # Database indexen
├── firebase.json               # Firebase configuratie
├── package.json
├── SETUP.md                    # Gedetailleerde setup guide
├── DEBUG.md                    # Troubleshooting guide
├── POINTS_PROCESSING.md        # Admin handleiding
└── AI_STORY_TESTING.md         # AI configuratie
```

## 🐛 Troubleshooting

### Teams verschijnen niet op dashboard

**Oorzaak**: Missing Firestore composite index

**Oplossing**:
1. Check Firebase Console voor error message met index creation link
2. Klik de link en wacht ~5 minuten
3. OF: Deploy firestore indexes: `firebase deploy --only firestore:indexes`

Zie `DEBUG.md` voor uitgebreide troubleshooting.

### AI Verhalen werken niet

1. ✅ Check `.env` bestand bestaat met `REACT_APP_OPENAI_API_KEY`
2. ✅ Check OpenAI API key is geldig (niet verlopen)
3. ✅ Check OpenAI account heeft credits
4. ✅ Check browser console voor error messages

### Build/Deploy Errors

```bash
# Clear cache en rebuild
rm -rf node_modules package-lock.json build
npm install
npm run build
npm run deploy
```

### Geen toegang tot Admin pagina

1. Check of `isAdmin: true` is ingesteld in Firestore users collection
2. Refresh browser (admin status wordt gecached)
3. Check browser console voor errors

## 📚 Documentatie

- **SETUP.md** - Gedetailleerde Firebase setup instructies
- **DEBUG.md** - Troubleshooting guide voor teams niet zichtbaar
- **POINTS_PROCESSING.md** - Admin guide voor resultaten invoeren
- **AI_STORY_TESTING.md** - AI verhalen configuratie, testen en prompt aanpassen

## 🔒 Beveiliging

### Huidige Implementatie:
- ✅ OpenAI API key in environment variables (`.env` niet in git)
- ✅ Firebase Firestore rules implementeren role-based access control
- ✅ Admin routes beveiligd met ProtectedAdminRoute component
- ✅ User authentication via Firebase Auth
- ✅ Input validatie bij resultaten invoeren

### ⚠️ Productie Aanbevelingen:
De OpenAI API key is nog steeds in de frontend (browser heeft toegang). Voor volledige beveiliging:

1. **Implementeer Firebase Cloud Functions**
2. **Verplaats OpenAI calls naar backend**
3. **Gebruik environment secrets in Cloud Functions**

Zie `AI_STORY_TESTING.md` → "Security Considerations" voor implementatie instructies.

## 🎨 Categorie Systeem

De app gebruikt 25 categorieën met specifieke toegestane renners per categorie:

1. Klassementsrenner 1
2. Klassementsrenner 2
3. Klassementsrenner 3
4. Klassementsrenner 4
5. Klassementsrenner 5
6. Klassementsrenner 6
7. Klassementsrenner 7
8. Klassementsrenner 8
... (zie `src/data/categories.js` voor complete lijst)

## 🤝 Contributing

Contributions zijn welkom!

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je changes (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is gelicentieerd onder de MIT License.

## 👨‍💻 Auteur

**Jans Tigelaar**
- GitHub: [@JansTigelaar](https://github.com/JansTigelaar)

## 🙏 Credits

- Renner data gebaseerd op Tour de France 2024/2025
- AI verhalen powered by OpenAI GPT-4
- Icons by [Lucide React](https://lucide.dev/)
- Hosting door GitHub Pages
- Gebouwd met React en Firebase

## 📞 Support

Bij vragen of problemen:
- Open een [GitHub Issue](https://github.com/JansTigelaar/koerspoule/issues)
- Check de documentatie bestanden (`SETUP.md`, `DEBUG.md`, etc.)
- Bekijk de FAQ in `DEBUG.md`

## 🗺️ Roadmap

Toekomstige features:
- [ ] Automatische scraping van Procyclingstats
- [ ] Email notificaties bij nieuwe verhalen
- [ ] Social media sharing van verhalen
- [ ] Meerdere competities tegelijk
- [ ] Mobile app (React Native)
- [ ] Live score updates tijdens etappes
- [ ] Uitgebreide statistieken en grafieken

---

**Gemaakt met ❤️ voor Nederlandse wielerliefhebbers**

🚴‍♂️ Veel plezier met je Koerspoule! 🏆
