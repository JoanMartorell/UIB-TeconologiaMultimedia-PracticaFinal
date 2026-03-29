# Diseño del Front-End - Museus Illes Balears

## Consistencia

- **Header:** Logo + navegación en todas las páginas
- **Footer:** Copyright y enlace Schema.org
- **Botones:** .btn-primary, .btn-secondary, .btn-favorite
- **Tarjetas:** .museum-card con estructura uniforme

## Diagrama de navegación

```
index.html
├── #museus (listado)
├── #mapa (mapa)
├── #favoritos (favoritos)
└── museu.html?id=X (detalle)
```

## HTML5

- **header:** Cabecera del sitio
- **main:** Contenido principal
- **nav:** Navegación
- **section:** Secciones (hero, filtros, museos, mapa, favoritos)
- **article:** Tarjetas de museo, artículo de detalle
- **footer:** Pie de página

## CSS

- **Variables:** `--color-primary`, `--font-sans`, `--radius`, etc.
- **Responsive:** breakpoints 900px y 768px
- **Grid:** `museums-grid` con `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`
- **Media queries:** Menú hamburguesa en móvil

## Efectos y animaciones

- `fadeIn` en tarjetas al cargar
- `transition` en hover de botones y tarjetas
- `scroll-behavior: smooth` en html
