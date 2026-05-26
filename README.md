# Museus Illes Balears · Web-App SPA

**Pràctica final · Tecnologia Multimèdia · UIB**

## Introducció

- **Títol:** Museus Illes Balears — Guia de Museus d'Art i Disseny
- **URL pública:** _(pendent de publicació a GitHub Pages — actualitzar després del deploy)_
- **Repositori GitHub:** _(URL del repositori públic — actualitzar)_
- **Objectiu:** Centralitzar informació sobre espais museístics de Mallorca, Menorca, Eivissa i Formentera. Patrimoni històric, arqueològic i contemporani.
- **Públic objectiu:** Turistes culturals, residents, estudiants i docents, persones interessades en art i cultura.

## Tecnologies

- **HTML5 semàntic** (header / nav / main / section / article / footer / dialog)
- **CSS3** (variables, Grid, Flexbox, media queries, `prefers-reduced-motion`)
- **JavaScript vanilla modular** (sense bundler, IIFE per mòdul, namespace `MuseusApp`)
- **APIs HTML5:** Web Storage (favorits), Web Speech (TTS), Geolocation (proximitat), Forms API (cerca + filtres)
- **APIs externes:** Open-Meteo (meteorologia), Leaflet + OpenStreetMap (mapes)
- **Dades:** Schema.org JSON-LD propi (`data/museus.json`, `data/rutes.json`)
- **PWA:** `manifest.webmanifest` + Service Worker amb estratègia cache-first / network-first

## Estructura del projecte

```
.
├── index.html                # SPA: una sola pàgina, modal <dialog> per al detall
├── manifest.webmanifest      # PWA
├── sw.js                     # Service Worker (cache + offline)
├── offline.html              # Fallback offline
├── robots.txt
├── sitemap.xml
├── css/
│   └── styles.css            # Variables CSS, Grid/Flex, responsive Mobile-First
├── js/
│   ├── utils.js              # Helpers: escapeHtml, fetchJSON, normalize, haversine, debounce, storage, showToast
│   ├── state.js              # Estat compartit (museums, filtres, sortBy, userCoords)
│   ├── data.js               # loadMuseums(), loadRutes() amb gestió d'error visible
│   ├── render.js             # renderMuseums, renderRutes, createMuseumCard, JSON-LD inject
│   ├── modal.js              # <dialog> + focus-trap + deep-link #museu=Mxxx + popstate
│   ├── filters.js            # Form únic: cerca text + 3 selects + validació HTML5
│   ├── map.js                # Leaflet (OSM tiles, marcadors per museu)
│   ├── favorites.js          # Persistència localStorage + sincronització grid/llista
│   ├── weather.js            # Open-Meteo amb timeout (AbortController)
│   ├── geolocation.js        # Ordenar per proximitat (Haversine)
│   ├── speech.js             # Web Speech API (TTS de la descripció)
│   ├── pwa.js                # Registre del Service Worker
│   └── main.js               # Bootstrap: hero, scrollspy, drawer, orquestració
├── data/
│   ├── museus.json           # 11 museus en format Schema.org/Museum
│   ├── rutes.json            # 4 rutes culturals (TouristTrip)
│   └── images/
│       ├── manifest.json     # id → llista de fitxers
│       └── {M001..M012}/01.jpg
└── media/
    ├── logo.svg
    └── images/inici/0X.jpg   # Carrusel del hero
```

## Funcionalitats principals

- 🔍 **Cerca + filtres** dins un únic `<form role="search">` amb validació HTML5 (debounce, normalització NFD)
- 📍 **Geolocalització:** botó "Ordenar per proximitat" amb càlcul Haversine
- 🗺️ **Mapa interactiu** Leaflet amb 10+ marcadors (popup amb enllaç al modal)
- ⭐ **Favorits** persistents (localStorage) amb feedback toast
- 🛣️ **Rutes culturals** recomanades per illa
- 🔊 **Text-to-Speech** (Web Speech API) a la fitxa de museu
- 🌤️ **Meteorologia** actual de Palma (Open-Meteo) amb timeout
- 📱 **Drawer menú** lateral a mòbils + carrusel hero amb dots
- 🔗 **Deep-link** al detall via fragment `#museu=Mxxx` (botó enrere natiu funciona)
- 📰 **JSON-LD** Schema.org/Museum + Schema.org/WebSite injectats
- 📲 **PWA instal·lable** amb offline funcional

## Estats de la interfície

- **Loading:** Skeleton cards durant la càrrega del JSON
- **Empty:** Missatge explicatiu + botó "Netejar filtres" quan no hi ha resultats
- **Error:** Missatge + botó "Tornar a intentar"
- **Offline:** `offline.html` quan no hi ha xarxa ni cache

## Execució local

```bash
python -m http.server 8000
# Obrir http://localhost:8000
```

_Cal servidor local: el SW i `fetch('data/…')` no funcionen amb `file://`._

## Desplegament a GitHub Pages

1. Pujar el repo a GitHub (públic).
2. Settings → Pages → Source: branch `main`, root.
3. Esperar el deploy. URL: `https://USERNAME.github.io/UIB-TeconologiaMultimedia-PracticaFinal/`
4. Actualitzar `<link rel="canonical">`, `og:url` i `og:image` d'`index.html`, així com `sitemap.xml` i `robots.txt` amb la URL real.

## Accessibilitat

- Skip-link, etiquetes ARIA, `aria-live` per a feedback dinàmic
- Navegació per teclat amb foco visible (`:focus-visible` + outline daurat)
- **Focus-trap** al `<dialog>` modal (Tab i Shift+Tab cicliquen)
- Contrast WCAG AA en colors principals
- `prefers-reduced-motion` respectat per a animacions i transicions
- TTS integrat per a usuaris amb dificultats visuals

## Checklist (estat)

| # | Item | Estat |
|---|---|---|
| 1 | URL pública HTTPS sense errors crítics | _Pendent deploy_ |
| 2 | Versió mòbil usable i navegació funcional | ✅ |
| 3 | HTML semàntic + jerarquia coherent | ✅ |
| 4 | CSS separat + propi/framework justificat | ✅ |
| 5 | JS separat i organitzat en mòduls | ✅ |
| 6 | Manipulació DOM real | ✅ |
| 7 | Esdeveniments d'usuari (filtres, botons, etc.) | ✅ |
| 8 | fetch/async/await per dades i APIs | ✅ |
| 9 | Control d'errors visible | ✅ |
| 10 | JSON propi estructurat | ✅ |
| 11 | JSON extern o API | ✅ Open-Meteo, OSM |
| 12 | Normalitzar/filtrar/cercar/ordenar | ✅ |
| 13 | APIs HTML5 (Storage, Geo, Forms, Speech) | ✅ |
| 14 | APIs externes funcionals | ✅ |
| 15 | Multimedia propi i optimitzat | ✅ |
| 16 | Imatges amb alt i carrega eficient | ✅ |
| 17 | Formularis amb labels, validació, errors | ✅ |
| 18 | Navegable per teclat amb focus visible | ✅ |
| 19 | Contrast i legibilitat acceptables | ✅ |
| 20 | SEO bàsic + URLs raonables | ✅ |
| 21 | JSON-LD validat i aplicat | ✅ |
| 22 | PWA: manifest + SW + offline | ✅ |
| 23 | GitHub públic + URL | _Pendent deploy_ |
| 24 | Nota de grup proposada | _Vegeu a sota_ |
| 25 | Vot al millor grup extern | _Vegeu a sota_ |


