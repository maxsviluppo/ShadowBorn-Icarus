# Conversione cartoon 3D — versione 0.4

## Risultato

La prova principale usa modelli 3D reali creati in Blender e visualizzati con Three.js. Camera ortografica, palette calda, ombreggiatura cartoon e ombre coerenti con il pavimento. La versione illustrata precedente rimane accessibile con `?mode=2d`.

Stanza ricostruita: pavimento in pietra, due pareti in blocchi, finestra con tende, arazzi, tavolo con lettera/tazza/chiave, scrittoio, armadietto, candelabri, baule con coperchio articolato e porta incernierata.

Il viaggiatore è una nuova interpretazione cartoon: capelli biondi, tunica verde, stivali, zaino e proporzioni più buffe. Non è la riproduzione identica delle immagini originali. Il rig è una gerarchia di oggetti articolati, non una mesh deformata da ossa. File Blender e script di generazione sono inclusi.

## Movimento e gioco

- Rotazione continua sul posto prima di camminare, senza passaggi fra spritesheet.
- Velocità massima 0,65 metri al secondo, accelerazione e frenata graduali.
- Ciclo delle gambe legato alla distanza percorsa, appoggio piantato e sollevamento del piede in avanzamento.
- Cinematica inversa a due segmenti per le gambe, suole mantenute orizzontali.
- Oscillazioni contenute di busto, testa, braccia e zaino; respiro in attesa.
- Passi sintetizzati su pietra attivati al contatto, senza suoni nelle rotazioni o da fermo.
- Navigazione A* con segmenti verificati contro gli ingombri dei mobili.
- Chiave, serratura, completamento dell'enigma, esame degli oggetti, apertura/chiusura del baule, reset ed Esc.

## Verifica

Controllati nel browser: caricamento della scena, porta chiusa senza chiave, raccolta della chiave, apertura della porta e completamento dell'enigma, baule aperto, reset, esame senza raccolta ed Esc. La scena è stata osservata su viewport desktop e stretto.

I test automatici verificano 346 segmenti di navigazione, angoli degli ostacoli, temporizzazione audio, gestione mute/autoplay, varianti audio e il nuovo risolutore delle gambe. La posizione dei piedi viene ricostruita indipendentemente con cinematica diretta; si controllano appoggio, suola orizzontale e numero di contatti a 24/30/60/120 Hz. Sono verificati anche i pivot necessari nei file GLB e la presenza dell'animazione esportata.

La scena raggruppa i pezzi per materiale mantenendo i pivot: circa 78 chiamate di disegno e 80 mila triangoli nei frame senza aggiornamento delle ombre; il passaggio ombre aggiunge lavoro. Rendering limitato a 30 aggiornamenti al secondo, risoluzione limitata a 1,25 volte quella CSS. Questo è un limite impostato, non una garanzia di 30 FPS su ogni dispositivo.

## Sorgenti e iterazioni

Aprire `art/Shadowborn-Cartoon.blend` in Blender. La timeline contiene un ciclo con appoggi derivati dallo stesso risolutore della versione web. `scripts/build-world.py` rigenera la scena; `scripts/animate-traveller.py` aggiorna il ciclo su una scena già aperta.

Il percorso GitHub → Vercel usa il ramo main e test prima della build. La grafica del personaggio, i tempi delle pose e l'illuminazione potranno essere rifiniti dopo la valutazione dell'utente. Non sono stati aggiunti trama completa, combattimenti o nuove stanze; Unreal non è richiesto per questa prova web.
