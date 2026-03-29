# Arquitectura - Museus Illes Balears

## Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                      │
├─────────────────────────────────────────────────────────────┤
│  index.html / museu.html                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   HTML5     │  │   CSS       │  │   JavaScript            │ │
│  │   Semántico │  │   Responsive│  │   main.js utils.js      │ │
│  ├─────────────┤  ├─────────────┤  │   detail.js             │ │
│  │ header      │  │ Variables   │  │   - fetch JSON          │ │
│  │ main        │  │ Grid/Flex   │  │   - Filtros             │ │
│  │ nav         │  │ Media       │  │   - Web Storage         │ │
│  │ section     │  │ queries     │  │   - Geolocation         │ │
│  │ article     │  │             │  │   - Speech Synthesis    │ │
│  └─────────────┘  └─────────────┘  └────────────┬────────────┘ │
│                                                  │             │
│  ┌──────────────────────────────────────────────▼────────────┐│
│  │ data/museus.json (Schema.org @graph)                      ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Estructura de carpetas

| Carpeta | Descripción |
|---------|-------------|
| `css/` | Estilos (styles.css). Variables CSS, diseño responsive, animaciones. |
| `js/` | Scripts: main.js (lógica principal), utils.js (helpers, storage), detail.js (página detalle). |
| `data/` | JSON con museos. Schema.org @graph. |
| `docs/` | Documentación técnica (ARQUITECTURA.md). |
| `media/` | Imágenes: logo.svg, hero.svg. |

## Gestión de datos (JSON)

### Estructura museus.json

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Museum", "TouristAttraction"],
      "identifier": "M001",
      "name": "...",
      "address": { "@type": "PostalAddress", ... },
      "geo": { "latitude": ..., "longitude": ... },
      "openingHours": "...",
      "aggregateRating": { "ratingValue": "...", "reviewCount": "..." },
      "additionalProperty": [
        { "name": "artStyle", "value": "..." },
        { "name": "foundingDate", "value": "..." }
      ]
    }
  ]
}
```

### Carga y procesamiento

- `fetch('data/museus.json')` → JSON
- `data['@graph']` → array de museos
- `Utils.getProperty(m, 'artStyle')` extrae de `additionalProperty`.

## APIs utilitzades

| API | Ús |
|-----|-----|
| **Web Storage** | Favorits a localStorage |
| **Geolocation** | Ordenar museus per proximitat |
| **Web Speech (TTS)** | Llegir contingut en veu alta |
| **Fetch** | Càrrega asíncrona de museus.json |
| **Open-Meteo** | Meteorologia (temperatura Palma) |

## Endpoints / Rutas

- `index.html` - Listado principal
- `museu.html?id=M001` - Detalle del museo M001

## Configuración

No requiere servidor backend. Solo servidor estático para servir archivos y evitar CORS en fetch del JSON.
