# Barnaby e la cella — 0.11.0

- Personaggio: posa aperta fornita dall'utente, animazioni approvate, palmi verso il corpo e braccio distanziato dalla borsa. La versione web mantiene le sei clip e usa un atlante colore 2048; la sorgente originale resta fuori dalla build.
- Ambiente: ricostruzione 3D della cella del riferimento, con pavimento 5,6 × 5,6 m, letto, finestra, mobile, brocca, barile, topo, corda e porta con teschio. È un adattamento modellato, non una conversione automatica pixel per pixel dell'immagine.
- Interazioni: porta, coperchio del barile, ante e registro apribili; chiave raccoglibile; altri oggetti esaminabili. Il dialogo del teschio è ancora da sviluppare, ma la mandibola è separata nel modello.
- Navigazione: ingombri e punti d'approccio aggiornati. Rendering a risoluzione limitata e ingrandimento pixelato; texture del personaggio filtrata con mipmap per evitare sfarfallio.
- Colori: materiale di Barnaby non metallico, luce ambiente neutra e luce ambrata vicino alla finestra. Ombre ricevute sul personaggio disattivate per evitare macchie sulla texture dipinta.

Sorgente stanza: `art/Barnaby-Prison-Cell.blend`.
Generazione: `scripts/build-prison-cell.py`, `scripts/export-barnaby-game.py`.
Controlli: build TypeScript/Vite, suite npm, percorsi verso ogni oggetto, struttura delle cerniere, raycast sulla geometria esportata e verifica visiva browser.
