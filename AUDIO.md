# Audio della stanza - 0.6

Musica generata con lo strumento Crea musica nell'account Gemini dell'utente, conversazione https://gemini.google.com/app/f5ce550d7622fa20 . Il selettore mostrava Gemini 3.8 Flash; nessuna modalita Medium disponibile. Il generatore musicale ha restituito circa 66 secondi. Preparato un loop di circa 64,5 secondi con giunzione sfumata e volume di sottofondo.

Gli effetti attualmente usati provengono ESCLUSIVAMENTE dai cinque MP3 forniti dall'utente. Gli originali sono conservati in art/audio-user. Il file public/assets/audio/sources.json documenta segmenti, nomi e durate. scripts/prepare-user-audio.py ricrea i WAV (richiede numpy e imageio_ffmpeg).

- passi_interni_pietra.mp3: quattro contatti separati, sincronizzati agli appoggi.
- apri libro.mp3: apertura e colpo finale adattato alla chiusura.
- apertura baule.mp3: apertura e colpo finale adattato alla chiusura.
- apertura porta.mp3: porta e, con segmento piu breve, ante del mobile; colpi finali adattati alle chiusure.
- chiave apre porta.mp3: sblocco prima del movimento della porta; non ripetuto dopo lo sblocco.

La durata del campione e la linea temporale dell'oggetto sono condivise. I colpi di chiusura iniziano quando l'oggetto raggiunge la battuta, lasciando decadere la coda. Le richieste Apri/Chiudi sullo stato gia raggiunto non ripetono l'effetto; un'inversione interrompe il campione precedente. Audio disattiva tutto, Musica controlla solo il sottofondo. Nessuna riproduzione prima del primo gesto dell'utente.

Gemini non poteva generare foley direttamente; aveva fornito scripts/gemini-sfx.py per una prima sintesi, poi sostituita con le registrazioni dell'utente. Lo script resta solo come sorgente storica; eseguirlo sovrascriverebbe i WAV, da rigenerare quindi con prepare-user-audio.py.
