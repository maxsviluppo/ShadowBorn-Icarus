# Shadowborn — una piccola distrazione

Prova giocabile di un'avventura punta e clicca: una stanza del custode in 3D cartoon, camera ortografica e un viaggiatore distratto. Creata in Blender e visualizzata nel browser con Three.js. La precedente versione Phaser rimane disponibile con `?mode=2d`.

## Giocare

- Clic sul pavimento: cammina evitando gli arredi.
- Clic sul tavolo: raggiungilo e raccogli la chiave.
- Clic sulla porta: raggiungila, sbloccala e clicca ancora per completare la prova.
- Clic sul baule: apri o richiudi il coperchio.
- **Esamina**: osserva un oggetto senza raccoglierlo.
- **Esc**: interrompi il percorso. **D**: visualizza ostacoli e percorso.
- **Passi**: attiva/disattiva l'audio, sbloccato dal primo clic.

## Avvio locale

`npm ci`, poi `npm run dev -- --host 127.0.0.1 --port 4173`.

Verifica: `npm test` e `npm run build`.

## Sorgenti 3D

- `art/Shadowborn-Cartoon.blend`: scena Blender 4.4, camera, materiali, personaggio e ciclo di camminata.
- `scripts/build-world.py`: costruzione riproducibile dei modelli originali e loro esportazione.
- `public/assets/3d/custodian-room.glb`: stanza e pivot per porta, baule e chiave.
- `public/assets/3d/traveller.glb`: personaggio articolato con pivot nominati.
- `src/gait3d.ts`: appoggi dei piedi risolti con cinematica inversa a due segmenti; il ciclo segue la distanza percorsa.

Rig a oggetti articolati, non una mesh deformata da armatura: permette di modificare le parti in Blender e controllare le articolazioni nel browser. Il personaggio è una nuova interpretazione cartoon del riferimento Shadowborn, non una ricostruzione identica delle illustrazioni originali.

Per rigenerare: `blender --background --python-exit-code 1 --python scripts/build-world.py`. Non è necessario avere Blender installato per giocare o per pubblicare il sito: i GLB sono già inclusi.

## Pubblicazione

Repository: https://github.com/maxsviluppo/ShadowBorn-Icarus

Progetto Vercel: https://vercel.com/castromassimo-4092s-projects/shadow-born-icarus

Sito: https://shadow-born-icarus.vercel.app/

Il ramo `main` è collegato alla produzione. Vercel usa `npm ci`, esegue i test, poi crea la build Vite. Gli aggiornamenti importanti vanno verificati prima di commit e push. Non sono necessarie credenziali nel repository.

## Limiti della prova

Una stanza e un enigma introduttivo, senza trama completa, combattimenti o salvataggio. I passi sono sintetizzati. La resa artistica resta iterabile dai sorgenti Blender; Unreal non è richiesto per questa versione web.

### Aggiornamento 0.4.1
Scena +10%; camminata +10% (0,715 m/s). Doppio clic per correre (1,35 m/s), con frenata progressiva anche prima delle curve e dei cambi di destinazione. Esc rallenta fino a fermarsi.

### Aggiornamento 0.5.0
Camminata 1,43 m/s e corsa 2,70 m/s, con accelerazione e frenata adattate. Apri/Chiudi o clic diretto su libro, baule e mobile delle candele. Copertina e ante sono modellate e incernierate in Blender. La chiave si raccoglie cliccandola direttamente; il tavolo apre il libro.

### Audio 0.6
Musica Gemini e campioni forniti dall'utente sincronizzati a passi, libro, baule, mobile, porta e serratura. Dettagli e provenienza in AUDIO.md.
