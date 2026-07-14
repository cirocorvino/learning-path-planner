# Dati utente locali

Questa cartella contiene i database personali e `db-configuration.json`, che identifica il database predefinito.

Tutto il contenuto, eccetto questo README, è escluso da Git. Quando l'app è servita via HTTP, se la configurazione contiene `defaultDatabase`, quel file ha la priorità più alta; altrimenti l'app prova `organizer-data.json` e infine l'esempio fittizio. Aprendo direttamente `index.html`, questa cartella non viene letta: **Apri database** importa il JSON nella copia IndexedDB del browser.

L'app non scrive direttamente in questa cartella. **Salva** scarica il database corrente e, per un database personalizzato, anche `db-configuration.json`; spetta all'utente copiare qui la configurazione e collocare il database nel percorso relativo dichiarato.

Con il fallback convenzionale viene scaricato soltanto `organizer-data.json` e non serve alcun file di configurazione. Svuotando il campo **Percorso database** nelle Impostazioni si ripristina questo comportamento. Non collocare dati personali in `data/examples/`, che contiene esclusivamente esempi fittizi e versionati.
