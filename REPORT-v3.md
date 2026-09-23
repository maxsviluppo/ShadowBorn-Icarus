# Shadowborn — report aggiornamento v3

## Progetto e avvio
Cartella principale: `C:\Users\Max\Downloads\A Codici Main\Shadowborn-Room-Test`.
La preview locale `http://127.0.0.1:4173/` ora usa questa cartella. Per gli avvii successivi, doppio clic su `AVVIA.cmd` al suo interno. Le cartelle originali `Shadowborn-main` e `project-icarus-main` non sono state modificate.

## Personaggio e lampeggio
Il personaggio è ancora 2D. Non è stato creato un modello 3D, uno scheletro o un progetto Blender. La camminata usa i fogli originali di Shadowborn; sosta e rotazioni usano il nuovo atlante illustrato.

Il lampeggio di opacità dipendeva dalle dissolvenze tra due sprite. A metà dissolvenza, due sagome semitrasparenti lasciavano intravedere lo sfondo; il fenomeno si ripeteva a ogni fotogramma. Ora viene disegnato un solo sprite, a opacità costante. La rotazione continua a usare le pose intermedie, con i piedi fermi al suolo.

Restano possibili differenze di silhouette e disegno fra fotogrammi originali e nuove pose. Il prossimo intervento strutturale consigliato è creare in Blender un personaggio con rig e animazioni di attesa, camminata e rotazione, poi produrre tutte le direzioni dalla stessa sorgente. Tale lavoro non è ancora stato eseguito.

## Tavolo, baule e Canva
Tavolo e baule sono stati sostituiti con immagini isometriche illustrate: venature del legno, bordi consumati, gambe lavorate, fasce metalliche, borchie e serratura. Mantengono collisioni e interazioni nella room. La porta è ancora provvisoria, in attesa dell’immagine dell’utente.

È stato esaminato il connettore Canva disponibile: offre strumenti per design e impaginati, ma non una generazione diretta di sprite di gioco. Per questi due asset è stato quindi usato **imagegen integrato**, non Canva. Canva rimane una possibile superficie di composizione e revisione artistica; non è stato creato alcun design Canva in questa sessione.

File del progetto:
- `public/assets/props/table.png`
- `public/assets/props/chest.png`
- `public/assets/props/furniture-source.png`
- `PROPS_PROMPT.md`: prompt completo e provenienza della generazione.

## Passi sul pavimento in pietra
Aggiunti quattro suoni sintetizzati brevi per l’appoggio di stivali su pietra, con variazioni alternate. Sono suoni provvisori creati proceduralmente, non registrazioni dal vivo.

La riproduzione è agganciata ai fotogrammi di appoggio scelti nella camminata (2 e 5 del ciclo ripetuto di sei pose), anziché a un timer indipendente. La cadenza segue quindi l’avanzamento dell’animazione. Il personaggio non produce passi da fermo o nelle rotazioni sul posto.

Il pulsante **Passi: attivi / Passi: spenti** consente di disattivarli. Il primo clic dell’utente sblocca l’audio del browser; non viene riprodotto audio all’apertura della pagina.

## Verifiche
- Controllo TypeScript e build di produzione.
- Enigma provato nel browser: esame, annullamento di un’azione con un nuovo clic, porta chiusa, raccolta chiave, apertura, uscita e reset.
- Opacità del personaggio costante in 20 campioni durante il movimento.
- AudioContext attivo e sette eventi sonori riprodotti nella prova di camminata.
- Nessun evento sonoro nella rotazione iniziale o durante l’attesa; comando di disattivazione verificato.
- Test automatici su contatti dei piedi, assenza di duplicati, gestione autoplay, mute, varianti audio senza clipping.
- Nessun errore JavaScript segnalato nella sessione browser.

La coerenza artistica fra tutti i fotogrammi e il timbro definitivo dei passi restano aspetti da valutare giocando: i controlli automatici verificano il funzionamento, non sostituiscono la valutazione percettiva.
