# GoalSquad Logos

## Färgpalett

### Huvudfärg
- **Hex:** `#004040`
- **Beskrivning:** En djup, mörk petroleumgrön/teal
- **Användning:** Primär varumärkesfärg, huvudlogotyp

### Accentfärg
- **Hex:** `#006666`
- **Beskrivning:** En något ljusare nyans av teal
- **Användning:** Skuggor, detaljer, hover-states

### Bakgrund
- **Hex:** `#FFFFFF`
- **Beskrivning:** Ren vit
- **Användning:** Bakgrund för att logotypen ska smälta in på vita sidor

## Logotypvarianter

Placera följande logotypfiler i denna mapp:

- `goalsquad-logo.svg` - Huvudlogotyp (SVG för skalbarhet)
- `goalsquad-logo.png` - PNG-version för kompatibilitet
- `goalsquad-icon.svg` - Ikon/symbol endast
- `goalsquad-icon.png` - Ikon PNG-version
- `goalsquad-logo-white.svg` - Vit version för mörka bakgrunder (om behövs)

## Användning i kod

```tsx
import Image from 'next/image';

// Huvudlogotyp
<Image 
  src="/logos/goalsquad-logo.svg" 
  alt="GoalSquad" 
  width={200} 
  height={60} 
/>

// Ikon
<Image 
  src="/logos/goalsquad-icon.svg" 
  alt="GoalSquad" 
  width={40} 
  height={40} 
/>
```

## CSS-variabler

Lägg till dessa färger i din Tailwind-konfiguration eller CSS:

```css
:root {
  --color-primary: #004040;
  --color-accent: #006666;
  --color-background: #FFFFFF;
}
```

## Tailwind-konfiguration

```js
// tailwind.config.ts
colors: {
  primary: '#004040',
  accent: '#006666',
}
```
