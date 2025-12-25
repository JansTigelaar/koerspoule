# Automatische Punten Verwerking

Dit systeem berekent automatisch punten voor alle teams op basis van etappe resultaten.

## Hoe het werkt

1. **Admin** voert de etappe resultaten in
2. **Systeem** haalt alle teams op
3. **Systeem** controleert welke renners in elk team staan
4. **Systeem** berekent punten voor elke renner op basis van hun positie
5. **Systeem** update alle teams met nieuwe punten
6. **Leaderboard** wordt automatisch bijgewerkt

## Setup: Admin Rechten Krijgen

Voordat je etappe resultaten kunt invoeren, moet je admin zijn:

1. **Registreer** eerst via de website (als je dat nog niet hebt gedaan)
2. **Ga naar Firebase Console**: https://console.firebase.google.com/
3. Selecteer je project: **koerspoule-5d3bc**
4. Klik op **Firestore Database**
5. Zoek de **users** collection
6. Klik op jouw user document (je herkent het aan je email)
7. Klik op **Add field**
8. Field naam: `isAdmin`
9. Type: `boolean`
10. Value: `true` (vinkje aan)
11. Klik op **Save**
12. **Ververs je website** - je ziet nu een **"Admin"** knop in de navigatie

## Etappe Resultaten Invoeren

### Stap 1: Ga naar Admin Pagina

1. Klik op **Admin** in de navigatie (gele knop)
2. Je komt nu op de "Etappe Resultaten Invoeren" pagina

### Stap 2: Haal Resultaten Op van Procyclingstats

1. Ga naar: https://www.procyclingstats.com/
2. Zoek de etappe die je wilt verwerken
3. Bijvoorbeeld: "Tour de France 2025 Stage 1"
4. Bekijk de uitslag / results

### Stap 3: Formatteer de Resultaten

Je kunt de resultaten op verschillende manieren invoeren:

**Optie A: Met rugnummer tussen haakjes**
```
1. POGAČAR Tadej (1)
2. VINGEGAARD Jonas (11)
3. EVENEPOEL Remco (21)
4. VAN AERT Wout (17)
5. GANNA Filippo (64)
6. BUITRAGO Santiago (51)
7. MARTIN Guillaume (91)
8. VLASOV Aleksandr (76)
9. SIVAKOV Pavel (5)
10. ALMEIDA João (2)
```

**Optie B: Met # voor rugnummer**
```
1. POGAČAR Tadej (#1)
2. VINGEGAARD Jonas (#11)
3. EVENEPOEL Remco (#21)
```

**Belangrijk:**
- Elk resultaat op een nieuwe regel
- Formaat: `positie. NAAM (rugnummer)`
- Alleen de top 20 krijgt punten
- Maar je mag meer dan 20 invoeren als je wilt

### Stap 4: Invoeren in het Systeem

1. **Selecteer Event**: "Tour de France 2025" (of ander event)
2. **Etappe Nummer**: Vul het etappe nummer in (1, 2, 3, etc.)
3. **Resultaten**: Plak de geformatteerde resultaten in het tekstvak
4. Klik op **"Resultaten Verwerken"**

### Stap 5: Wacht op Bevestiging

Het systeem:
1. Parst de resultaten
2. Valideert de data
3. Haalt alle teams op
4. Berekent punten voor elk team
5. Update alle teams in de database
6. Toont een succesbericht

Je ziet: **"Succes! X teams bijgewerkt met punten voor etappe Y"**

## Puntensysteem

De punten per positie:

| Positie | Punten | Positie | Punten |
|---------|--------|---------|--------|
| 1       | 50     | 11      | 10     |
| 2       | 40     | 12      | 9      |
| 3       | 32     | 13      | 8      |
| 4       | 26     | 14      | 7      |
| 5       | 22     | 15      | 6      |
| 6       | 20     | 16      | 5      |
| 7       | 18     | 17      | 4      |
| 8       | 16     | 18      | 3      |
| 9       | 14     | 19      | 2      |
| 10      | 12     | 20      | 1      |

Positie 21 en lager: **0 punten**

## Voorbeeld Scenario

### Team "Super Ploeg" heeft deze renners:
- POGAČAR (#1) - in categorie "GC Aliens"
- VINGEGAARD (#11) - in categorie "God of n ex-Alien?"
- VAN AERT (#17) - in categorie "Klassieke Aliens & Ganna"
- etc. (totaal 25 renners)

### Etappe 1 Uitslag:
1. POGAČAR (#1) - 50 punten
2. EVENEPOEL (#21) - 40 punten
3. VINGEGAARD (#11) - 32 punten
15. VAN AERT (#17) - 6 punten

### Team "Super Ploeg" krijgt:
- 50 (Pogačar) + 32 (Vingegaard) + 6 (Van Aert) = **88 punten** voor etappe 1
- Totaal score wordt: vorige punten + 88 punten

## Wat gebeurt er automatisch?

Na het verwerken van een etappe:

1. **Alle teams** worden bijgewerkt met:
   - `stagePoints.stage1` = punten voor etappe 1
   - `stagePoints.stage2` = punten voor etappe 2
   - etc.
   - `totalPoints` = som van alle etappe punten

2. **Leaderboard** wordt automatisch bijgewerkt
   - Teams worden gesorteerd op `totalPoints`
   - Hoogste score bovenaan

3. **Dashboard** toont:
   - Je team naam
   - Je totaal aantal punten
   - Je positie in het klassement

## Veelgestelde Vragen

### Kan ik een etappe opnieuw verwerken?
Ja! Als je dezelfde etappe opnieuw invoert, worden de punten overschreven. Dit is handig als je een fout hebt gemaakt.

### Wat als ik een verkeerd rugnummer invoer?
Het systeem zal die renner gewoon negeren. Geen team krijgt punten voor een renner die niet bestaat.

### Kan ik etappes in willekeurige volgorde invoeren?
Ja! Je kunt etappe 5 invoeren voordat je etappe 4 hebt gedaan. Het systeem houdt bij welke etappes zijn verwerkt.

### Hoeveel tijd kost het verwerken?
Ongeveer 2-5 seconden, afhankelijk van het aantal teams.

### Moet ik exact 20 resultaten invoeren?
Nee, je kunt meer of minder invoeren. Maar alleen de top 20 krijgt punten.

## Troubleshooting

### "Fout: Results moet een array zijn"
Je hebt waarschijnlijk het verkeerde formaat gebruikt. Zorg dat elk resultaat op een nieuwe regel staat.

### "Fout: Result op index X mist position of riderNumber"
Een van de regels heeft niet het juiste formaat. Controleer of elk resultaat dit formaat heeft:
```
1. NAAM (rugnummer)
```

### "0 teams bijgewerkt"
Dit betekent dat er geen teams zijn voor dit event. Controleer of je het juiste event hebt geselecteerd.

### Error in console: "permission denied"
Je hebt geen admin rechten. Volg de stappen bij "Admin Rechten Krijgen".

## Toekomstige Uitbreidingen (Optioneel)

### Automatische Scraping
Later kunnen we een Cloud Function toevoegen die automatisch elke dag:
1. Procyclingstats.com bezoekt
2. De laatste etappe uitslag ophaalt
3. Automatisch verwerkt

Dit vereist:
- Firebase Cloud Functions (Blaze plan)
- Web scraping logica
- Scheduler setup

Voor nu is handmatig invoeren de snelste en meest betrouwbare methode.

## Support

Problemen? Check:
1. Console logs (F12 > Console tab)
2. Firebase Firestore Database (check of teams zijn bijgewerkt)
3. Firestore Rules (check of je write permissions hebt)

---

**Veel succes met je Koerspoule! 🚴‍♂️🏆**
