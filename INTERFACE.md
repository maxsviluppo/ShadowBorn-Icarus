# Interfaccia fantasy 0.7

Cornice originale generata con Gemini Immagini nel conto dell'utente:
https://gemini.google.com/app/b56827c565697845

Asset: public/assets/ui/ornate-frame.webp. Immagine quadrata 2048 px, ottimizzata in WebP a 1024 px. La composizione usa cornici CSS a nove sezioni, preservando gli angoli mentre i bordi si adattano ai pannelli. Testo, inventario, azioni e gioco rimangono elementi interattivi reali.

Riferimento visivo fornito dall'utente: Gemini_Generated_Image_r8mhk2r8mhk2r8mh (1).jpg. Ripresi ferro scuro, pergamena, targhette, impaginazione con gioco sopra e inventario/dialoghi/menu sotto. La scena resta il diorama Blender esistente.

Desktop: logo, indicatore del viaggiatore, pianta della stanza con posizione dinamica, diario e pannelli inferiori. Mobile: logo compatto, diario apribile, dialoghi e azioni sempre visibili, inventario ridotto e controlli audio in basso. Nessuna mappa di citta o statistica di combattimento fittizia.

Diario e aiuto sono finestre modali accessibili, chiudibili con pulsante, Esc e clic esterno. Al completamento della prova si apre il diario con gli obiettivi aggiornati. I comandi esistenti conservano gli stessi identificatori e il motore del gioco.

## Distanze e selezione degli oggetti
Muri, davanzale e tende hanno margini di collisione che includono spalle e zaino. I clic sulle pareti raggiungono il punto libero vicino alla superficie visibile. La selezione rispetta le occlusioni della stanza. Etichette al passaggio del mouse, cerchio di destinazione e contorni diagnostici degli oggetti sono nascosti; il cursore resta sensibile agli oggetti interattivi.
Verifica: test di navigazione con pareti e finestra, suite completa e build; prova nel browser davanti al davanzale.
