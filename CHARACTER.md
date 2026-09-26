# Personaggio importato — 0.8.0

Sorgente scelta: OBJ d108fe4df634cbfb5984d5ed978e0f42.obj, fornito nello ZIP 361909979ac41b4a60a83e0d9992d09d.zip. Il file ha 749.715 vertici e 1.499.458 triangoli, UV e quattro mappe PBR da 4096 x 4096. Lo STL fornito ha 1.498.066 triangoli e non contiene UV o texture: non offre un vantaggio di risoluzione per questo utilizzo.

Il modello originale e completo a 360 gradi ed era in posa a T. La prima ispezione interrotta aveva mescolato coordinate locali e globali; le viste sono state rigenerate dopo l'applicazione delle trasformazioni.

## File

- `art/imported-character/Traveller-Original-HighRes.blend`: master locale ad alta risoluzione, con texture incorporate. Originale OBJ e mappe conservati nella stessa cartella. Esclusi da Git per dimensione; anche i due allegati nei Downloads restano intatti.
- `art/Traveller-Textured.blend`: sorgente modificabile del personaggio del gioco, mesh alleggerita, UV, texture, scheletro e azioni Idle, Walk e Run. Aprendo il file e premendo Play si vede Walk.
- `art/Shadowborn-Cartoon.blend`: stanza modificabile aggiornata con il nuovo personaggio.
- `public/assets/3d/traveller.glb`: modello usato dalla stanza, 48.000 triangoli (riduzione del 96,8%), texture originale ridimensionata a 2048 x 2048 e incorporata in JPEG, circa 3 MB.
- `art/Traveller-preview.png`: anteprima Blender della posa di attesa.
- `art/traveller-procedural.glb`: copia del personaggio precedente.

## Animazione e materiali

Scheletro a 14 articolazioni con pesi normalizzati, adattamento della posa a T, braccia abbassate e gambe riallineate. Si conserva la mesh continua, evitando la separazione visibile degli arti. La trama UV originale rimane associata ai vertici durante la riduzione.

Il gioco conserva velocita, corsa al doppio clic, accelerazione, frenata, rotazione graduale e contatti dei passi. Le lunghezze delle gambe e l'altezza del bacino sono lette dai metadati del GLB per adattare la cinematica inversa alle nuove proporzioni. I movimenti procedurali guidano lo scheletro; i tre cicli esportati sono disponibili per lo studio in Blender. Il giunto Backpack rimane per compatibilita, senza aggiungere uno zaino non presente nel modello.

La resa cartoon mantiene la mappa colore fornita; le mappe PBR originali restano nel master. Il materiale toon ora conserva le texture importate e l'ottimizzazione della stanza esclude le mesh deformabili.

## Riproduzione e verifiche

Con Blender 4.4, dalla cartella del progetto:

1. Estrarre lo ZIP originale in `art/imported-character`.
2. Eseguire `blender -b --python scripts/archive-character-source.py` per il master.
3. Eseguire `blender -b --python scripts/prepare-character.py` per normalizzazione e riduzione.
4. Eseguire `blender -b --python scripts/rig-imported-character.py` per scheletro, animazioni e GLB.
5. Eseguire `blender -b --python scripts/update-room-character.py` per aggiornare anche la scena Blender della stanza.
6. Facoltativo: `blender -b --python scripts/render-character-review.py` per le anteprime.
7. `npm test` e `npm run build`.

Se viene rigenerata la stanza con build-world.py, rieseguire poi rig-imported-character.py per ripristinare questo personaggio.

Verifiche: continuita dei pesi, UV e texture incorporate, numero di triangoli e dimensione del file, azioni esportate, cinematica inversa sulle nuove proporzioni, suite di navigazione/movimento/audio. Nel browser: arrivo davanti alla finestra, interazione e apertura del libro con audio, nessun errore console. Viste Blender di attesa, camminata e corsa controllate.
