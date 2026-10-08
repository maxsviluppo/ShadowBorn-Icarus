# Personaggio camicia, 8 ottobre

Sorgente fornita: `personaggio 8_10 camicia cella.zip`, OBJ
`9bbfaf5e58881114800e6e81c19d154c.obj` e texture colore originale.
Le immagini mostrano fronte, retro e posa rilassata; il modello ha maniche
strappate corte e viene rispettato anche dove il video mostra maniche lunghe.

## Riferimenti di movimento

- `gemini_generated_video_d36b7138.mp4`: 8 secondi di camminata, busto quasi
  verticale, braccia basse e oscillazione contenuta.
- `gemini_generated_video_de3daadb.mp4`: 20 secondi, camminata nella prima parte
  e corsa da circa 11 secondi, gomiti piegati, ginocchia più sollevate,
  recupero del piede posteriore e lieve inclinazione del busto.
- Le pose sono ricostruite per il rig, non estratte con motion capture.
  I cicli sono in-place; il navigatore gestisce la traslazione nella stanza.

## Asset e rig

`public/assets/3d/shirt-hero.glb`, 90.000 triangoli, texture incorporata a
risoluzione originale, scala uniforme a 1,60 m. Dimensione su canvas invariata
(219,3975 px). Nessuna scala separata di testa, mani o spalle.

`scripts/inspect-shirt-model.py` importa la sorgente e rende fronte/retro/profilo.
`scripts/build-shirt.py` adatta posa a T, pesi, articolazioni e texture;
`scripts/animate-shirt.py` costruisce Idle, Walk e Run in loop, con appoggio
dei piedi risolto sulle lunghezze effettive delle nuove gambe.
I punti HandL/HandR permettono di ancorare gli oggetti alle nuove mani.
Le animazioni procedurali esistenti di risveglio e interazione usano lo stesso
schema di ossa. Respiro e gesti casuali restano attivi.

I file Blender, il modello OBJ e i fotogrammi di analisi rimangono locali in
`art/shirt-character`, esclusi dalla pubblicazione. Il materiale del gioco
mantiene il trattamento caldo e pixel della cella.
