# Shadowborn — room di prova 01

Apri AVVIA.cmd con doppio clic. Avvia il gioco locale e apre il browser su http://127.0.0.1:4173. Se è già in esecuzione, apri direttamente quell'indirizzo. Per fermare il server avviato dal file, chiudi la sua finestra o premi Ctrl+C.

## Giocare
- Clic sul pavimento: cammina fino al punto, aggirando i mobili.
- Clic sulla chiave sul tavolo: si avvicina e la raccoglie.
- Clic sulla porta: si avvicina; con la chiave apre la serratura.
- Secondo clic sulla porta aperta: conclude la prova.
- Esamina + clic su un oggetto: descrizione.
- Clic sul baule: interazione facoltativa.
- Esc: interrompe camminata e interazione in coda.
- Mostra percorsi / D: mostra pavimento percorribile, ostacoli e percorso.
- Ricomincia: ripristina la stanza.

## Cosa contiene
Copia di lavoro indipendente. Gli originali in Downloads non sono stati modificati.
Personaggio: otto fogli direzionali di Shadowborn; 24 fotogrammi utilizzabili per direzione, ricomposti a 960×768 con punto dei piedi uniforme. Nuovo atlante generato per pose ferme e rotazione; nessun modello Blender in questa fase.
Stanza: stanza_vuota.png di Icarus. Tavolo e baule sono sprite illustrati generati, con ingombri di gioco separati. La porta resta una geometria provvisoria. Alcune maschere permettono il passaggio dietro ai candelabri.
Movimento: A* su piano isometrico, ostacoli allargati in base all'ingombro del personaggio, verifica esatta dei segmenti, velocità basata sul tempo, interazione solo dopo l'arrivo. Un nuovo clic sostituisce l'azione precedente.

## Limiti della prova
Gli sprite mantengono i difetti grafici e le variazioni di orientamento delle sorgenti. La posa ferma e le svolte usano il nuovo atlante turn.png. Una cella generata con orientamento incoerente è esclusa dalla sequenza. La room è un test di gameplay, non la grafica definitiva. Le maschere della stanza dipinta e gli ingombri dei mobili richiederanno una rifinitura artistica. Nessun salvataggio persistente, combattimento o cambio stanza reale: la porta conclude il test.

## Sviluppo
npm ci
npm run dev
npm test
npm run build

Codice nuovo: src/room.ts e src/navigation.ts. I moduli del precedente laboratorio sono conservati ma non avviati dalla nuova scena.
Per rigenerare gli atlanti (Python + Pillow):
python scripts/prepare-assets.py "C:\Users\Max\Downloads\A Codici Main\Shadowborn-main\public\assets\character"

## Passo successivo
Creare il personaggio in Blender prendendo come riferimento il ragazzo biondo con zaino: silhouette compatta, postura rilassata, camminata distratta. Prima idle e un ciclo di camminata coerente; poi render direzionali o esportazione 3D. Blender e Unreal non sono necessari per giocare questa prova web.

## Verifiche eseguite
- TypeScript e build di produzione completati.
- 346 segmenti di percorso verificati: aggiramento tavolo, punti bloccati, limiti stanza e conversione coordinate.
- Browser: esame senza raccolta, annullamento raccolta con nuovo clic, porta chiusa senza chiave, raccolta, apertura, completamento, reset e visualizzazione percorsi.
- Nessun errore JavaScript rilevato nella sessione di verifica.


## Aggiornamento movimento v2
- Eliminata l’ellisse sotto il personaggio. Il fondino grigio/bianco incorporato nei vecchi fogli viene escluso dal rendering, soltanto nella fascia dei piedi; i PNG originali restano intatti.
- Piedi riallineati dopo la rimozione del fondino.
- Velocità massima 84 px/s invece di 145 px/s; accelerazione e frenata progressive.
- Cadenza dei fogli: circa 5,6 fotogrammi/s a velocità massima, invece di circa 24. I fogli originali contengono più passi ripetuti.
- Rotazione sul posto prima della partenza, lungo l’arco più breve; 180° richiedono circa 0,8 secondi.
- Nuove pose ferme e di rotazione con piedi ancorati alla posizione di gioco. Le dissolvenze sono state rimosse nella v3 per evitare lampeggi.
- Orientamento verso l’oggetto prima di completare l’interazione.
- Le pose nuove e le vecchie camminate restano disegni differenti: il futuro modello animato Blender consentirà ulteriore uniformità.

Asset e prompt di generazione: ART_ASSETS.md. I test includono rotazione senza spostamento, cadenza, accelerazione, frenata e indipendenza dalla frequenza del monitor.


## Cartella principale e aggiornamento v3
La cartella principale del progetto è ora:
C:\Users\Max\Downloads\A Codici Main\Shadowborn-Room-Test
La preview http://127.0.0.1:4173/ usa questa cartella. AVVIA.cmd avvia il progetto locale.

- Rendering del personaggio con un solo sprite opaco: nessuna dissolvenza di trasparenza a ogni cambio fotogramma.
- Tavolo e baule ridisegnati come immagini isometriche, con legno e ferramenta. Generati tramite imagegen, non tramite Canva; prompt in PROPS_PROMPT.md.
- Passi sintetizzati per stivali su pietra: quattro varianti brevi, attivate dai fotogrammi di contatto 2 e 5 del ciclo ripetuto. Nessun loop sonoro indipendente dall’animazione.
- Pulsante Passi: attivi/spenti. Il browser abilita l’audio dopo un clic dell’utente. Nessun passo nelle rotazioni sul posto o da fermo.
- Nessun modello 3D o rig Blender è stato creato. La camminata resta quella dei fogli originali, con pose ferme/di rotazione aggiuntive. Rimangono possibili variazioni di disegno tra pose: per uniformarle davvero serve un personaggio animato coerente.
