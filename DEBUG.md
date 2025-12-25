# Debug Instructies: Teams verschijnen niet op Dashboard

Als je team niet verschijnt op het dashboard na opslaan, volg deze stappen om het probleem te identificeren:

## Stap 1: Check de Console Logs

1. Open de applicatie in je browser
2. Open Developer Tools (F12 of Cmd+Option+I op Mac)
3. Ga naar het **Console** tabblad
4. Probeer een team op te slaan

### Bij het opslaan zie je:

```
=== SAVE DEBUG ===
Team naam: [jouw team naam]
Aantal geselecteerde renners: [aantal]
Totaal aantal categorieën: 25
Selections: [object met renner selecties]
Event ID: [event id]
User ID: [user id]
User Name: [jouw naam]
```

**LET OP:** Je moet **ALLE 25 categorieën** vullen voordat je kunt opslaan!

## Stap 2: Controleer het aantal geselecteerde renners

Op de team builder pagina zie je nu onderaan:
```
Geselecteerde renners: X / 25
```

De opslaan knop is alleen actief als je alle 25 renners hebt geselecteerd.

### De 25 categorieën zijn:

**Etappes (9):**
1. GC Aliens
2. God of n ex-Alien?
3. Klassieke Aliens & Ganna
4. Doen leuk mee
5. Deze willen ook leuk meedoen
6. Geef ze nog een kans!
7. Superknecht
8. Super superknecht
9. Tweelingenexperiment

**Sprinters (5):**
10. Supersprinter
11. Super supersprinter
12. Sprinter
13. Nog n sprinter
14. EN NOG EEN?!

**Puncheurs (2):**
15. Puncheurs 1
16. Puncheurs 2

**Special (1):**
17. Paret-Peintre of Paret-Peintre?

**Andere (6):**
18. Rittenkapers
19. Klimmers
20. Klassieke Belg
21. Nederlander om aan te moedigen
22. Rouleurs 1
23. Rouleurs 2

**Jokers (2):**
24. Joker 1
25. Joker 2

## Stap 3: Check Firebase Permissions

### Als je een error ziet zoals "permission-denied":

1. Ga naar Firebase Console: https://console.firebase.google.com/
2. Selecteer je project
3. Ga naar **Firestore Database** > **Rules**
4. Controleer of je deze regel hebt:

```javascript
match /teams/{teamId} {
  allow read: if true;
  allow create: if request.auth != null;  // <-- Deze is belangrijk!
  allow update, delete: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
}
```

5. Klik op **Publish** als je wijzigingen hebt gemaakt

## Stap 4: Check of het team daadwerkelijk is opgeslagen

1. Ga naar Firebase Console > Firestore Database
2. Klik op de **teams** collection
3. Zoek naar een document met jouw `userId`
4. Check de velden:
   - `teamName`: jouw team naam
   - `eventId`: het event ID
   - `userId`: jouw user ID
   - `selections`: object met 25 renner selecties
   - `createdAt`: timestamp
   - `totalPoints`: 0

### Als het team WEL in Firebase staat maar NIET op dashboard:

Check de dashboard console logs:

```
=== DASHBOARD LOAD DEBUG ===
Loading dashboard data voor user: [user id]
Gevonden events: [aantal] [events array]
Teams query voor userId: [user id]
Aantal teams gevonden: [aantal]
Teams data: [teams array]
```

### Mogelijke problemen:

1. **userId komt niet overeen**: Het team is opgeslagen met een ander userId dan waarmee je bent ingelogd
2. **Index ontbreekt**: Je ziet een error over "requires an index"
   - Klik op de link in de error om automatisch de index aan te maken
   - Of deploy via: `firebase deploy --only firestore:indexes`

## Stap 5: Check of je bent ingelogd

1. Kijk rechtsboven in de navigatie
2. Zie je je naam? Dan ben je ingelogd
3. Zie je "Login / Registreren"? Dan moet je eerst inloggen

## Stap 6: Hard Refresh

Soms helpt het om de cache te legen:

- **Windows/Linux**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R

## Stap 7: Controleer de Browser Console voor errors

Let op rode error berichten in de console. Veelvoorkomende errors:

### "Failed to get document because the client is offline"
- Check je internetverbinding
- Firebase is mogelijk geblokkeerd door een firewall/adblocker

### "Missing or insufficient permissions"
- Check Firestore Rules (zie Stap 3)

### "The query requires an index"
- Deploy de indexes: `firebase deploy --only firestore:indexes`
- Of klik op de link in de error message

## Nog steeds problemen?

Stuur de volgende informatie:

1. Screenshot van de console logs bij het opslaan
2. Screenshot van de console logs bij het laden van het dashboard
3. Screenshot van je Firestore Rules
4. Screenshot van de teams collection in Firebase Console

## Succesvolle opslag ziet er zo uit:

**Console bij opslaan:**
```
=== SAVE DEBUG ===
Team naam: Mijn Super Team
Aantal geselecteerde renners: 25
Totaal aantal categorieën: 25
...
Nieuw team aanmaken...
Team succesvol aangemaakt met ID: abc123xyz
```

**Console bij dashboard laden:**
```
=== DASHBOARD LOAD DEBUG ===
Loading dashboard data voor user: xyz789
Gevonden events: 1 [...]
Teams query voor userId: xyz789
Aantal teams gevonden: 1
Teams data: [{id: 'abc123xyz', teamName: 'Mijn Super Team', ...}]
```

**Dashboard UI:**
- Je team naam is zichtbaar bij het event
- Je ziet "Team bewerken" knop in plaats van "Team maken"
- Je totaal aantal punten wordt getoond (standaard 0)
