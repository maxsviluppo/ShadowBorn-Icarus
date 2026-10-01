# Cella di Barnaby — oggetti e sequenza approvata

Riferimento: istruzioni di Max, 30 settembre 2026. Immagini originali conservate in `public/assets/pixel/puzzle`; ritaglio e trasparenza applicati solo durante il rendering.

- **Brocca** sul mobile: Esamina e Prendi. Dopo la raccolta, Estrai contenuto dalla borsa aggiunge l'**occhio di cristallo** senza consumare la brocca.
- **Tazza** sul mobile: Esamina e Prendi; nessun uso successivo definito per ora.
- **Mobile**: Apri/Chiudi. La **bottiglia di grog** è visibile e raccoglibile solo quando aperto.
- **Strana maniglia**: hotspot separato sull'anta. Esamina segnala forma insolita e viti arrugginite, senza rivelarne la natura. Il teschio dà l'indizio provvisorio della mandibola: soltanto allora nome e descrizione la identificano.
- **Grog sulla maniglia**: scioglie la ruggine, lascia una bottiglia vuota. Ora Prendi stacca la maniglia. Consegnata al teschio, scompare dalla borsa e viene indossata; si abilita la risposta parlata provvisoria.
- **Bottiglia vuota**: dopo il grog sulle viti appare una nuova icona senza liquido. Usa sulla botte la rompe: i frammenti appaiono sulla botte, non nella borsa. Prendi sui frammenti aggiunge un solo vetro tagliente. Il grog ancora pieno viene rifiutato con un avvertimento sui danni corrosivi.
- **Corda** inchiodata: Prendi a mani nude fallisce. Usa frammento sulla corda (oppure Taglia dopo averlo ottenuto) aggiunge un solo pezzo alla borsa. Il resto inchiodato rimane sul pavimento.

Controlli: clic destro/pressione prolungata sugli oggetti della stanza; clic sugli oggetti nella borsa per Esamina, Usa e azioni speciali. Usa seleziona l'oggetto, poi si clicca il bersaglio nella stanza. Esc annulla. Le azioni fisiche nella stanza attendono l'arrivo di Barnaby.

I testi sono provvisori. Nessun dialogo definitivo, impiego dell'occhio o della tazza, né sblocco della porta sono stati inventati. Reset riparte dall'inizio; questa demo non salva ancora gli enigmi al ricaricamento.

File mascella ritrovato in `C:/Users/Max/Downloads/Elementi Icaro/maschella.jpg` (non nella radice Downloads).

## Revisione 1 ottobre 2026
Letto: trasparenza ottenuta con Canva, media MAHWtRD5dr8; la maschera disponibile dal connettore (200 x 109) viene applicata alla texture originale, che conserva i colori e i dettagli. Asset: public/assets/pixel/puzzle/bed-canva-alpha.png.
Bottiglia vuota: built-in image_gen, asset public/assets/pixel/puzzle/bottle-empty.png. Prompt: rimuovere tutto il liquido, le bolle e il bagliore verde mantenendo sagoma, proporzioni, tappo, cordino, medaglione, X e pixel art della bottiglia originale.
Ombre di contatto nere sfumate per gli arredi e Barnaby; passi sul posto sincronizzati alla rotazione, senza traslazione globale. Dialoghi senza virgolette.

## Lancio sulla botte
La bottiglia vuota si usa direttamente sulla botte. Dopo avvicinamento e orientamento, gesto del braccio, volo ad arco, impatto sonoro e caduta dei vetri (1,65 secondi). La raccolta si abilita solo a fine animazione. Reset interrompe senza consumare la bottiglia.


## Gesti contestuali
- Letto: Siediti (anche clic semplice), breve riposo e ritorno in piedi.
- Mobile: piegamento per aprire/chiudere, stato e suono cambiano al contatto.
- Corda: accovacciamento e taglio solo con frammento disponibile.
- Mandibola sul teschio: braccio proteso, oggetto in mano e clic al momento dell’aggancio.
- Durante un gesto i nuovi spostamenti sono sospesi; Ricomincia annulla il gesto.
- Bottiglia: campione utente bottlebroken.mp3, avvio a 60 ms per allineare l’impatto.
- Lente: scontorno Canva MAHWw0Dz15A; icona ricavata dall’anteprima trasparente, vetro al 25% circa di opacità.

## Puntatore, combinazioni e audio
Il nome del bersaglio segue il puntatore in alto a sinistra. Con un oggetto selezionato mostra Usa X con Y. Maniglia e oggetti piccoli hanno priorità rispetto ai mobili; la sagoma interattiva del mobile segue l’anta aperta.
Nella borsa, Usa seleziona l’oggetto e un clic su un altro prova la combinazione. Le combinazioni non previste danno una risposta e conservano entrambi gli oggetti e la selezione. Esc annulla. La borsa rimane aperta, con il dialogo sopra gli slot.
Sottofondo utente sottofondogame.mp3 in loop; regolatori separati effetti 100% e musica 20% all’avvio.
Chiave inglese scontornata con Canva MAHWyQhd2yc, usata nei menu e nel cursore azione.
