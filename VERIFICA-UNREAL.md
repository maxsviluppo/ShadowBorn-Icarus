# Verifica Unreal e scelta Blender

Unreal Engine 5.8.3 è installato. Un progetto diagnostico ha caricato il motore ed eseguito uno script Python, ma il processo ha restituito codice 1 perché Visual C++ Redistributable 14.44.35211.0 è precedente alla versione richiesta 14.50.35719.0. Il test usava NullRHI: non verifica la grafica o la fluidità dell’editor.

L’installer incluso è presente, versione 14.50.35719.0, firma digitale valida:
`C:\Program Files\Epic Games\UE_5.8\Engine\Extras\Redist\en-us\vc_redist.x64.exe`

Non è stato eseguito l’aggiornamento dei componenti di sistema. L’installazione può richiedere la conferma amministratore di Windows. Non occorre riscaricare il motore per correggere questo prerequisito.

PC: Intel N97, circa 16 GB RAM, Intel UHD integrata. Blender 4.4.1 installato e rispondente al comando di versione. Epic raccomanda 32 GB RAM e 8 GB di memoria grafica per UE5: sul PC presente è ragionevole preferire un progetto leggero e valutare le prestazioni prima di migrare il gioco.

Percorso consigliato: modello cartoon leggero in Blender, rig e animazioni, render ortografici trasparenti in 8 direzioni, atlanti 2D per la room web esistente. Nessun modello Blender è stato ancora creato. Il primo traguardo è una posa rifinita e una camminata completa, verificata nella room alla scala reale.

Fonti:
- https://dev.epicgames.com/documentation/unreal-engine/hardware-and-software-specifications-for-unreal-engine
- https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170
