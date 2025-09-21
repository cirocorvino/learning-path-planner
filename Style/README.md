# 🎨 Cartella Style

Questa cartella contiene tutti gli asset di stile e design per l'applicazione Piano di Studio AI Development.

## File Contenuti

### CSS
- `styles.css` - Foglio di stile principale dell'applicazione

### Favicon e Icone
- `favicon.svg` - Icona principale in formato SVG (vettoriale)
- `favicon.ico` - Icona in formato ICO per compatibilità browser
- Supporta tutte le risoluzioni standard (16x16, 32x32, 48x48)

### PWA (Progressive Web App)
- `manifest.json` - Manifest per l'installazione come PWA
  - Nome app: "Piano di Studio AI Development"
  - Nome breve: "AI StudyPlan"
  - Tema colore: #6C5CE7 (viola)
  - Supporto installazione su dispositivi mobili

## Struttura Colori

### Colori Principali
- **Primario**: #6C5CE7 (viola)
- **Secondario**: #A29BFE (viola chiaro)
- **Background**: Gradiente viola-blu
- **Testo**: Bianco su background, nero su elementi chiari

### Utilizzo
- Header: Gradiente con testo bianco
- Pulsanti: Colori tematici con hover effects
- Cards: Background bianco con ombra

## Responsività

Il CSS include media queries per:
- Desktop (>1024px)
- Tablet (768px-1024px)
- Mobile (<768px)

## Favicon Generation

Per rigenerare le icone:
1. Modificare `favicon.svg`
2. Usare https://favicon.io/favicon-converter/
3. Sostituire `favicon.ico` con il file generato

## PWA Features

L'app supporta:
- ✅ Installazione su home screen
- ✅ Tema colore personalizzato
- ✅ Icone adaptive per Android/iOS
- ✅ Display standalone

## Note di Sviluppo

- Il CSS usa CSS Grid e Flexbox per il layout
- Variabili CSS per una facile manutenzione dei colori
- Animazioni smooth per migliorare UX
- Print styles per la stampa dei piani