# Cella pixel art — 0.12.0

Lo sfondo è una copia byte per byte di `Untitled design.png` (1024 × 559). Non viene illuminato, ricolorato o ricostruito in 3D. Il ritaglio di visualizzazione rimuove soltanto i margini laterali vuoti.

Barnaby usa il modello e le animazioni approvate, renderizzati su un livello trasparente. Una proiezione affine associa il pavimento dipinto alla navigazione; letto, mobile e barile hanno ingombri separati dalle aree cliccabili. Le sagome in primo piano vengono ridisegnate dall'immagine originale per le sovrapposizioni.

Nove aree invisibili: porta, teschio, finestra, letto, mobile, brocca/tazza, barile, topo, corda. Clic o tastiera per avvicinarsi e osservare, Esamina per leggere la descrizione senza muoversi. Clic sul pavimento per camminare, doppio clic per correre, frenata conservata.

Questa fase non finge aperture sullo sfondo statico: porta, ante e barile richiedono livelli separati e immagini dello spazio retrostante. I comandi Apri/Chiudi sono nascosti nella nuova cella. Il dialogo del teschio resta da sviluppare.

La precedente ricostruzione 3D è conservata con `?mode=3d`; l'archivio precedente con `?mode=2d`.

Test: hash originale, proiezione/inversione, selezione dei contorni, accessibilità degli approcci e segmenti di percorso liberi da ostacoli; build TypeScript/Vite e anteprima browser.
