# Museus Illes Balears - Web-App

**Pràctica final - Tecnologia Multimèdia - UIB**

## Introducció

- **Títol:** Museus Illes Balears - Guia de Museus d'Art i Disseny
- **URL:** (pendent de publicació)
- **Objectiu:** Centralitzar informació sobre espais museístics de Mallorca, Menorca, Eivissa i Formentera. Patrimoni històric, arqueològic i contemporani.
- **Públic objectiu:** Turistes culturals, residents, estudiants i docents, persones interessades en art i cultura.

## Estructura del projecte

```
├── index.html          # Pàgina principal
├── museu.html          # Fitxa detall (?id=M001)
├── css/styles.css      # Estils responsive, variables CSS
├── js/
│   ├── main.js        # Lògica principal, filtres, favorits, meteorologia, rutes
│   ├── utils.js       # Utilitats, Web Storage, toast
│   └── detail.js      # Pàgina de detall, museus relacionats
├── data/museus.json   # Dades Schema.org (JSON-LD)
├── docs/
│   ├── guia.html      # Guia d'ús
│   └── ARQUITECTURA.md
├── media/
│   ├── logo.svg
│   └── hero.svg
└── README.md
```

## Funcionalitats

### Principals
- Llistat de museus classificats per illa
- Fitxa detallada (descripció, horaris, preus, ubicació, contacte)
- Filtres i cerca per illa, tipologia, paraula clau, entrada gratuïta
- Mapa interactiu **Leaflet** + tiles OpenStreetMap (marcadors des de `geo` al JSON)
- Disseny responsive (Mobile First)

### Secundàries
- **Rutes culturals** recomanades per ubicació o temàtica
- **Sistema de favorits** (localStorage) amb feedback toast
- **Museus relacionats** a la fitxa de detall
- **Enllaços externs** (Wikipedia, webs oficials)
- **API meteorologia** (Open-Meteo, Palma)
- **Geolocalització** per ordenar per proximitat
- **Cercador persistent** (sticky en scroll)
- **Drawer menu** a mòbils
- **Text-to-Speech** a la fitxa de museu (llegeix la descripció)

### Estats de la interfície
- **Loading:** Skeleton cards durant la càrrega
- **Empty:** Missatge explicatiu i botó "Netejar filtres" quan no hi ha resultats
- **Error:** Missatge clar amb acció "Tornar a intentar"

## Tecnologies

- HTML5 semàntic, CSS3 (variables, Grid, Flexbox), JavaScript vanilla
- APIs: Web Storage, Geolocation, Web Speech, Fetch
- Open-Meteo API (meteorologia)
- Dades: JSON Schema.org

## Execució local

```bash
python -m http.server 8000
# Obrir http://localhost:8000
```

**Nota:** Cal servidor local per carregar el JSON (CORS).

## Accessibilitat

- Skip link, etiquetes ARIA, contrast adequat
- Navegació per teclat, TTS integrat
- Objectius WCAG
