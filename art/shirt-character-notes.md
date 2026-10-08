# Personaggio attuale: posa rilassata, 9 ottobre

La versione attiva deriva da `df9772838e3372cd8f7ab4dc4a59d6df.obj`, contenuto
nei due ZIP `b61953a9e55139436fb39ad79682a572`. I due archivi hanno lo stesso
SHA-256. Il GLB `01cb11d34f927d9bf570daa77bab5194.glb` contiene la stessa
immagine colore (SHA-256 `698f4024a68a7fe1702f5d46da4c8fbe2f6452a3b4a47a60c373c3f798781d0a`)
e non contiene scheletro o animazioni. Scelta la sorgente OBJ per lavorare
sulla geometria e sulle texture separate.

- Scala uniforme a 1,60 m; dimensione su canvas invariata: 219,3975 px.
- Mani e spalle mantengono geometria, proporzioni e posa della nuova sorgente.
  Il vecchio script che scambiava/scalava le mani non viene eseguito.
- La sorgente unisce il polsino al fianco: separata soltanto la superficie di
  contatto nascosta, chiusa nuovamente e ricalcolati i pesi bone heat.
- Rig con articolazioni della posa rilassata; Idle, Walk e Run in-place sono
  ricostruiti sulle nuove lunghezze. Le pose procedurali di raccolta, consegna,
  risveglio, taglio e gesti spontanei usano lo stesso schema di ossa.
- Texture colore originale, UV mantenute, materiale opaco; schiarimento dei
  mezzitoni nel materiale runtime, senza sostituire i dettagli della texture.

Pipeline attiva: `scripts/inspect-relaxed-model.py`,
`scripts/build-relaxed-character.py`, `scripts/animate-shirt.py`.
Revisioni offline: `scripts/prepare-relaxed-preview.mjs`,
`scripts/preview-relaxed-character.py`, `scripts/preview-relaxed-material.py`,
`scripts/preview-wake.py`, `scripts/validate-relaxed-rig.py`.
Il controllo della superficie deformata copre i gesti e le interazioni:
un controllo delle sole ossa non rileverebbe un polsino saldato al fianco.
Le anteprime Blender dei materiali sono indicative, non schermate del browser.
Sorgenti e Blender restano locali in `art/relaxed-character`; viene pubblicato
soltanto `public/assets/3d/shirt-hero.glb` (nome del percorso mantenuto).

---

## Archivio della versione precedente

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
(219,3975 px). Altezza complessiva invariata. Nell'ultima revisione richiesta,
le mani sono scambiate, orientate con i pollici in avanti e scalate al 70%;
le spalle e le braccia scendono di 0,035 unità sorgente, circa 5 cm in gioco.

`scripts/inspect-shirt-model.py` importa la sorgente e rende fronte/retro/profilo.
`scripts/build-shirt.py` adatta posa a T, pesi, articolazioni e texture;
`scripts/correct-shirt-hands.py` conserva le UV delle mani e ricongiunge i polsi;
`scripts/animate-shirt.py` costruisce Idle, Walk e Run in loop, con appoggio
dei piedi risolto sulle lunghezze effettive delle nuove gambe.
I punti HandL/HandR permettono di ancorare gli oggetti alle nuove mani.
Le animazioni procedurali esistenti di risveglio e interazione usano lo stesso
schema di ossa. Respiro e gesti casuali restano attivi.

I file Blender, il modello OBJ e i fotogrammi di analisi rimangono locali in
`art/shirt-character`, esclusi dalla pubblicazione. Il materiale del gioco
mantiene il trattamento caldo e pixel della cella.
