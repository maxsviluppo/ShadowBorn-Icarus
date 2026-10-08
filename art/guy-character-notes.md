# Personaggio dalla base fornita da Max

Sorgente: `personaggio base tipo guy.zip`, OBJ e texture PBR originali conservati in `art/guy-character/source`.

Il modello di gioco è `public/assets/3d/guy.glb`. La mesh viene ridotta a 90.000 triangoli conservando UV e texture colore a risoluzione originale. Non vengono rimodellati mani, dita, volto o spalle. Il corpo viene scalato uniformemente a 1,60 m dopo la conversione della posa A alla posa neutra; la dimensione del personaggio sul canvas resta 219,3975 px, come prima.

Il rig eredita Idle, Walk, Run, Turn, Jump e Crouch dal rig già corretto, con articolazioni riposizionate sul nuovo modello. Gli effetti sulle ossa per seduta, risveglio, consegna, lancio, uso degli oggetti e colpi con la tazza continuano a utilizzare lo stesso scheletro. I gesti casuali di capelli e manica sono definiti in `src/idleGestures.ts` e si interrompono ai comandi.

Riproduzione: `scripts/inspect-guy-model.py`, `scripts/build-guy.py`. `scripts/prepare-guy-preview.mjs` e `scripts/preview-guy-animated.py` producono i controlli visivi del GLB esportato. I file Blender di lavorazione restano in `art/guy-character`.
