# Prima stanza dell'avventura — 0.10.0

La stanza deriva dall'OBJ e dalle texture forniti nello ZIP 0f3901b631e1d3a8af14920ca7fc6e69.zip. L'originale resta in art/imported-room/Room-Original.blend, escluso da Git; il file modificabile pronto per il gioco è art/First-Adventure-Room.blend.

Il pavimento misura circa 9 × 9 metri. La scala verticale usa la porta ad arco (circa 2,1 metri sopra la soglia) e mantiene il Traveller di circa 1,60 metri. Per ampliare lo spazio percorribile rispetto alla stanza precedente, la scala orizzontale è maggiore di quella verticale.

La mesh originale da 1.509.501 triangoli è ridotta a circa 220.000 triangoli. Le UV e l'atlante colore originale 4K sono conservati. La luce viene ricostruita: OBJ non contiene una scena di illuminazione. Le texture mantengono le ombre dipinte; le ombre dinamiche sono calcolate nel gioco.

Baule, ante inferiori, copertina e porta hanno cerniere separate. Le superfici interne mancanti sono state ricostruite. Gli altri arredi sono selezionabili per descrizioni. La navigazione considera ingombri, spazio di apertura delle ante e ringhiere; il personaggio segue l'altezza dei gradini.

Per rigenerare: inspect-imported-room.py importa il file originale; reduce-imported-room.py prepara la mesh ridotta; build-imported-room.py separa gli oggetti, conserva le texture ed esporta adventure-room.glb e la scena Blender. Le tre JPEG room-colour, room-normal e room-roughness in art/imported-room sono derivate dalle mappe originali rispettivamente a 4096, 1024 e 1024 pixel.

Il viewport, touch-action e gli eventi gesture impediscono pinch/doppio-tap zoom nel gioco su Safari mobile. La verifica sul browser desktop non sostituisce una prova su hardware iPhone/iPad.

Verifiche: npm test include percorsi raggiungibili, collisioni, cerniere, scala locomozione, atlante texture e viewport mobile. Prova web: baule aperto/chiuso e libreria aperta con audio sincronizzato.
