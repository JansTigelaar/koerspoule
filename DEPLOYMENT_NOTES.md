# ⚠️ BELANGRIJK: GitHub Deployment en OpenAI API Key

## Probleem
GitHub's push protection blokkeert deployment wanneer de OpenAI API key in de gecompileerde JavaScript code zit. Dit is een **beveiligingsmaatregel** om te voorkomen dat API keys publiekelijk toegankelijk worden.

## Oplossingen

### Optie 1: Deployment zonder AI Verhalen (Snelst)
Voor een snelle deployment ZONDER AI verhaal functionaliteit:

1. **Verwijder .env bestand** (zodat API key niet in build komt):
   ```bash
   rm .env
   ```

2. **Build en deploy**:
   ```bash
   npm run deploy
   ```

3. De app werkt volledig, maar AI verhalen worden uitgeschakeld met een waarschuwing

### Optie 2: Firebase Cloud Functions (Aanbevolen voor Productie)

Implementeer AI verhaal generatie via Firebase Cloud Functions waar de API key veilig server-side blijft.

**Voordelen**:
- ✅ API key is volledig beveiligd
- ✅ Geen GitHub push protection problemen
- ✅ Betere performance
- ✅ Usage limits kunnen server-side afgedwongen worden

**Implementatie**:
Zie `CLOUD_FUNCTIONS_SETUP.md` voor stap-voor-stap instructies.

### Optie 3: GitHub Secret Bypass (NIET AANBEVOLEN)

Je kunt de push protection bypassen via de GitHub link, maar dit is **NIET veilig** omdat:
- ❌ Je API key wordt publiekelijk zichtbaar in de source code
- ❌ Iedereen kan je API key kopiëren en gebruiken
- ❌ Je betaalt voor hun OpenAI gebruik
- ❌ Je account kan geblokkeerd worden wegens misbruik

**Alleen gebruiken voor**:
- Korte demo's
- Test deployments
- Development met wegwerp API keys

## Huidige Status

De app is gedeployed **ZONDER** OpenAI functionaliteit naar: `https://janstigelaar.github.io/koerspoule`

Alle andere features werken volledig:
- ✅ Team builder
- ✅ Puntenberekening
- ✅ Klassement
- ✅ Admin resultaten invoer
- ❌ AI verhalen (uitgeschakeld)

## Lokale Development

Voor lokale development met AI verhalen:

1. Maak `.env` bestand:
   ```
   REACT_APP_OPENAI_API_KEY=sk-proj-jouw-key-hier
   ```

2. Start dev server:
   ```bash
   npm start
   ```

3. AI verhalen werken lokaal perfect!

## Next Steps

Om AI verhalen in productie te krijgen:
1. Implementeer Firebase Cloud Functions (zie Optie 2)
2. Of deploy naar een platform dat environment secrets ondersteunt (Vercel, Netlify, etc.)

---

**Vragen?** Zie `AI_STORY_TESTING.md` voor meer informatie over security
