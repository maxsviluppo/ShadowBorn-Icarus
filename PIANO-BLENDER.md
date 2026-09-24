# Personaggio Blender: percorso consigliato

## Scelta
Creare un personaggio 3D cartoon in Blender e renderizzare sprite 2D da integrare nella room Phaser. Il gioco rimane 2D e leggero; la sorgente delle animazioni diventa un modello unico e coerente. Non è ancora stato creato un modello o un rig.

## Riferimento artistico
Ragazzo di Shadowborn: capelli biondi spettinati, occhi espressivi, tunica verde trapuntata, stivali e zaino di cuoio. Silhouette compatta, postura rilassata, atteggiamento distratto. Lo stile va validato in un render fermo prima di produrre molte animazioni.

## Sequenza di produzione
1. Modello base leggero: proporzioni, silhouette, testa, capelli, vestiti e zaino.
2. Materiali cartoon: pochi livelli di ombreggiatura, palette coerente con la stanza, contorni controllati. Test a dimensione reale del personaggio nella room.
3. Rig: bacino, colonna, braccia, gambe e piedi; controlli dei piedi per mantenere il contatto con il terreno. Lo zaino segue il corpo con un movimento secondario contenuto.
4. Una sola camminata completa: appoggio, trasferimento del peso, oscillazione delle braccia, lieve ritardo del busto e dello zaino. La goffaggine deve derivare da pose e tempi intenzionali.
5. Attesa, avvio, arresto, svolta di 90/180 gradi e raccolta di un oggetto.
6. Render con camera ortografica coerente con il pavimento della room, sfondo trasparente e riferimento dei piedi fisso. Inizialmente 8 direzioni per la camminata e pose intermedie per le svolte.
7. Esportazione dei PNG e impaginazione automatica in atlanti. Mantenere dimensioni, scala e origine costanti in tutti i fotogrammi; non ricentrare ogni sagoma indipendentemente.
8. Integrazione nella room e calibrazione di velocità/ampiezza del passo. Suoni attivati agli eventi di contatto dei piedi.

## Cosa cambia rispetto alle immagini indipendenti
Proporzioni, abiti, zaino e illuminazione derivano dalla stessa sorgente. Si modifica il ciclo una volta e si rigenerano tutte le direzioni. Si possono renderizzare pose intermedie reali. Il miglioramento grafico non è automatico: dipende dalla modellazione, dai materiali e dalla rifinitura artistica.

## Alternativa 3D in tempo reale
È possibile mantenere il modello animato in un motore con camera fissa. Permette rotazioni continue ma richiede un nuovo sistema di rendering e materiali adatti al motore. Non è un semplice caricamento di un file Blender dentro la room Phaser. I materiali cartoon specifici di Blender possono dover essere ricostruiti nel motore di destinazione.

## PC verificato
Intel N97, circa 16 GB RAM, Intel UHD integrata. Blender 4.4.1 risponde al comando di versione. Unreal Engine 5.8.3 è presente con gli eseguibili dell’editor. Per questo hardware e l’attuale obiettivo, è consigliato mantenere il gioco web 2D e usare Blender per produrre gli asset.
