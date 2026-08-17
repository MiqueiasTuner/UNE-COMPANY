# FIKTA — SVG Brand Pack

## Arquivos
- fikta-symbol.svg
- fikta-wordmark.svg
- fikta-lockup-horizontal.svg
- fikta-lockup-stacked.svg
- fikta-app-icon.svg
- fikta-favicon.svg
- fikta-symbol-monochrome.svg
- fikta-lockup-reverse.svg
- fikta-palette.svg

## Cores via código
Os SVGs usam variáveis CSS:

```css
--fikta-primary: #0B1D3A;
--fikta-accent: #FFC629;
--fikta-bg: #FFFFFF;
--fikta-secondary: #667085;
```

Quando o SVG estiver inline no HTML, você pode sobrescrever essas variáveis no elemento pai.

Exemplo:

```html
<div style="--fikta-primary:#111827; --fikta-accent:#F59E0B;">
  <!-- SVG inline -->
</div>
```

O wordmark principal foi reconstruído com formas vetoriais, sem depender de fonte.
O subtítulo “editora digital” usa Inter/Arial como fallback.
