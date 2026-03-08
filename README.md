---

## u_modif: 2026-03-08 | 02:56

```markdown
---

## u_modif: 2026-03-07 | 00:00

# Este repositorio recoge mis publicaciones

## Pauta

Los archivos se escriben en formato .mdx en obsidian, en la carpeta publicaciones. MDX acepta generación de figuras con plotly... Cada publicación tiene una carpeta asociada y si se mueve al repo publicaciones y se pushean quedan publicadas en mi landing page, en la sección (publicaciones). Todo se redacta desde mi vault, notebooks creados en carpeta notebooks.

Gestión citas:
`Z_library.bib` sincronizado con Zotero vive en la raíz del proyecto. Para citar, usa la sintaxis `[@citekey]` directamente en el `.mdx`. Las referencias se generan automáticamente al compilar.

---

## Cómo funciona el pipeline técnico

### Estructura esperada por publicación

```

Publicaciones/
└── mi-articulo/
    ├── index.mdx       ← artículo principal con frontmatter
    └── datos.json      ← (opcional) datos para gráficas Plotly

```

El frontmatter del `index.mdx`:

```yaml
---
titulo: Título del artículo         # obligatorio
fecha: 2026-03-01                   # obligatorio
resumen: Descripción breve          # obligatorio (meta description e índice)
ogImage: /images/og/mi-articulo.jpg # opcional — imagen Open Graph / Twitter Card
tags: [economía, datos]             # opcional — reservado para filtros futuros
published: false                    # opcional — omitir o true para publicar
---
```

`published: false` excluye el artículo del índice, del feed de la homepage y del build (no genera ruta). Útil para trabajar en borradores sin que aparezcan en producción.

### Stack utilizado


| Capa                            | Librería                             | Rol                                                                         |
| ------------------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| Parseo frontmatter (índice/RSS) | `front-matter`                       | Lee solo el frontmatter sin procesar el MDX completo                        |
| Renderizado MDX                 | `next-mdx-remote`                    | `serialize()` en servidor + `MDXRemote` en cliente                          |
| IDs en encabezados              | `rehype-slug`                        | Genera anchors para el TOC y los enlaces directos                           |
| Citas bibliográficas            | `rehype-citation`                    | Procesa `[@citekey]` y genera referencias en formato APA desde el `.bib`    |
| Slugs del TOC                   | `github-slugger`                     | Genera IDs idénticos a los de `rehype-slug` para sincronizar TOC y headings |
| Fechas                          | `dayjs`                              | Formateo de fecha en la cabecera del artículo                               |
| Gráficas interactivas           | `Grafica` + `GraficaDataProvider`    | Componente MDX personalizado que renderiza JSON de Plotly                   |
| Comentarios                     | `GiscusComments`                     | Comentarios vía GitHub Discussions                                          |
| RSS                             | `Next.js API route` (`/api/rss.xml`) | Feed RSS 2.0 con caché de 1 h en el edge                                    |


### Flujo de datos en build time

1. **Índice** (`/publicaciones`): se leen solo los frontmatters de cada `index.mdx` con `front-matter`, se ordena por fecha y se pasa a `PostFeedSection`.
2. **Artículo** (`/publicaciones/[slug]`): se lee el `index.mdx` completo, se preprocesa el `.bib` (normalización CRLF, eliminación de campos `file`/`abstract`, añadido de claves a entradas anónimas de Zotero), y se serializa con `next-mdx-remote/serialize` aplicando los plugins de rehype. Los `.json` de la carpeta se cargan como datos de gráficas.
3. **TOC**: se extrae por regex sobre el texto crudo del MDX (`/^(#{1,3})\s+(.+)$/gm`) antes de la serialización, y se slugifica con `github-slugger` para mantener coherencia con `rehype-slug`.
4. **SEO**: `<title>` desde `titulo`, `<meta name="description">` desde `resumen`. Open Graph (`og:title`, `og:description`, `og:type`, `og:image`) y Twitter Card generados automáticamente; `og:image` se activa solo si el frontmatter incluye `ogImage`. La URL base se toma de `NEXT_PUBLIC_SITE_URL`.

### Limitaciones actuales

- **SEO parcial**: Open Graph y Twitter Card implementados; falta JSON-LD (`Article` schema).
- **Sin sitemap**: las publicaciones no se incluyen en el `sitemap.xml` del sitio.
- **Rebuild completo para nuevo contenido**: no hay ISR (Incremental Static Regeneration), cualquier artículo nuevo requiere un redeploy.
- **TOC por regex**: falla si un heading contiene JSX o HTML inline (p. ej. `## Título con <code>código</code>`).
- **Preprocesado del `.bib` frágil**: se usa regex para limpiar entradas inválidas de Zotero; un `.bib` con estructura muy atípica puede romper `rehype-citation`.
- **Datos de gráficas en build**: los `.json` de Plotly se cargan en servidor y se serializan en el HTML. Archivos grandes inflan el bundle de la página.
- **TOC solo en desktop** (`xl` breakpoint): no hay versión móvil (colapsable o similar).
- `**tags` sin UI**: el campo existe en el frontmatter pero no hay páginas de categorías ni filtros todavía.

### Posibles mejoras

- Añadir JSON-LD de tipo `Article` para datos estructurados en buscadores.
- Integrar las publicaciones en el `sitemap.xml` generado por el sitio.
- Activar ISR (`revalidate`) para publicar sin rebuild completo.
- Reemplazar el preprocesado regex del `.bib` por un parser BibTeX real (p. ej. `@retorquere/bibtex-parser`).
- Mover la carga de datos de gráficas a una API route y fetchearlos en cliente para no inflar el HTML.
- TOC colapsable en móvil.
- Páginas de categorías (`/publicaciones/tag/[tag]`) aprovechando el campo `tags`.

```

```

