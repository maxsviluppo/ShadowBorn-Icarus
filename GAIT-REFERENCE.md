# Movimento dal riferimento GIF — 0.9.0

Riferimento fornito: 21B0FE79-9431-478B-9FAC-45D49BAE3BD8.GIF, 220 x 220 pixel, 80 fotogrammi da 80 ms, durata totale 6,4 secondi.

La lettura dei fotogrammi mostra corsa nella prima parte (ciclo di circa 8 frame / 0,64 s), passaggio alla camminata attorno ai frame 30-37, camminata centrale (circa 12 frame / 0,96 s) e ritorno alla corsa negli ultimi frame. La tabella dei tempi e il foglio dei fotogrammi sono in art/gait-reference.

E una ricostruzione visiva del movimento, non motion capture 3D: dalla singola vista non si possono estrarre esattamente profondita e rotazioni nascoste. Texture e geometria del personaggio sono preservate.

Applicati due cicli distinti:
- Walk: recupero basso del piede, almeno un appoggio continuo, braccia rilassate e piccola oscillazione del busto.
- Run: recupero piu alto del tallone, ginocchio in avanti, gomiti piegati, braccia contrapposte alle gambe, busto inclinato e brevi fasi senza appoggio.
- Transizione continua secondo velocita e arresto. La fase avanza con la distanza percorsa; i suoni scattano ai contatti alternati dei piedi. Il personaggio torna con gambe quasi dritte a riposo.

Cadenza adattata alle velocita del gioco e alla lunghezza delle gambe: falcata completa di 1,10 m per Walk e 1,38 m per Run, circa 0,77 e 0,51 secondi alle velocita massime attuali. Non viene riprodotta la durata della GIF alla lettera, per evitare un passo inadatto alle proporzioni del personaggio.

Un'unica funzione TypeScript produce le pose runtime e i campioni per Blender:
1. node scripts/export-reference-gait.mjs
2. blender -b --python scripts/apply-reference-gait.py
3. blender -b --python scripts/update-room-character.py
4. Facoltativo: blender -b --python scripts/render-character-review.py

Eseguire questa sequenza dopo un'eventuale rigenerazione con rig-imported-character.py. I cicli GLB Idle/Walk/Run e le azioni Blender Reference_Idle/Reference_Walk/Reference_Run sono aggiornati; la scena della stanza contiene lo stesso rig.

Verifica: suite automatica, controllo pose renderizzate in Blender. Il browser ha negato l'accesso all'anteprima locale; la verifica interattiva non e stata effettuata. La pubblicazione resta bloccata dalle autorizzazioni della sessione, come per la precedente versione.
