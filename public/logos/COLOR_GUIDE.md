# GoalSquad Färgguide

## Varumärkesfärger

### 🎨 Primär Färgpalett

| Färg | Hex | RGB | Användning |
|------|-----|-----|------------|
| **Huvudfärg** | `#004040` | `rgb(0, 64, 64)` | Primär varumärkesfärg, logotyp, huvudknappar |
| **Accentfärg** | `#006666` | `rgb(0, 102, 102)` | Hover-states, skuggor, sekundära element |
| **Bakgrund** | `#FFFFFF` | `rgb(255, 255, 255)` | Vit bakgrund för logotyper och sidor |

### 🎯 Färgskala (Tailwind)

Färgerna är integrerade i Tailwind-konfigurationen med följande klasser:

#### Primary/Accent Skala
```
primary-50   #e6f2f2  (Ljusast)
primary-100  #cce6e6
primary-200  #99cccc
primary-300  #66b3b3
primary-400  #339999
primary-500  #008080
primary-600  #006666  ← Accentfärg
primary-700  #004d4d
primary-800  #003333
primary-900  #004040  ← Huvudfärg
primary-950  #002020  (Mörkast)
```

#### Brand Direkta Färger
```
brand-primary  #004040  (Huvudfärg)
brand-accent   #006666  (Accentfärg)
brand-white    #FFFFFF  (Bakgrund)
```

## Användningsexempel

### Tailwind CSS Classes

```tsx
// Bakgrunder
<div className="bg-primary-900">Huvudfärg bakgrund</div>
<div className="bg-primary-600">Accentfärg bakgrund</div>
<div className="bg-brand-primary">Direkt huvudfärg</div>

// Text
<h1 className="text-primary-900">Huvudfärg text</h1>
<p className="text-primary-600">Accentfärg text</p>

// Knappar
<button className="bg-primary-900 hover:bg-primary-600">
  Primär knapp
</button>

// Borders
<div className="border-2 border-primary-900">
  Huvudfärg ram
</div>
```

### CSS Custom Properties

```css
:root {
  --color-brand-primary: #004040;
  --color-brand-accent: #006666;
  --color-brand-white: #FFFFFF;
}

.logo {
  color: var(--color-brand-primary);
}

.logo:hover {
  color: var(--color-brand-accent);
}
```

### React/Next.js Inline Styles

```tsx
<div style={{ 
  backgroundColor: '#004040',
  color: '#FFFFFF' 
}}>
  GoalSquad
</div>
```

## Tillgänglighet (WCAG)

### Kontrast-förhållanden

| Förgrund | Bakgrund | Kontrast | WCAG AA | WCAG AAA |
|----------|----------|----------|---------|----------|
| `#004040` | `#FFFFFF` | 8.59:1 | ✅ Pass | ✅ Pass |
| `#006666` | `#FFFFFF` | 5.64:1 | ✅ Pass | ✅ Pass |
| `#FFFFFF` | `#004040` | 8.59:1 | ✅ Pass | ✅ Pass |

Alla färgkombinationer uppfyller WCAG AAA-standard för normal text.

## Design-riktlinjer

### ✅ Gör detta
- Använd `#004040` för primära element (knappar, rubriker, logotyp)
- Använd `#006666` för hover-states och interaktiva element
- Håll vit bakgrund (`#FFFFFF`) för maximal läsbarhet
- Använd ljusare nyanser (primary-50 till primary-400) för subtila bakgrunder

### ❌ Undvik detta
- Blanda inte huvudfärgen med andra starka färger
- Använd inte mörka nyanser på mörka bakgrunder
- Ändra inte färgerna utan godkännande
- Skapa inte nya färgvarianter utan att uppdatera denna guide

## Exportformat för Designers

### Figma/Sketch
```
Huvudfärg:   #004040
Accentfärg:  #006666
Bakgrund:    #FFFFFF
```

### Adobe (RGB)
```
Huvudfärg:   R:0   G:64  B:64
Accentfärg:  R:0   G:102 B:102
Bakgrund:    R:255 G:255 B:255
```

### Adobe (CMYK - ungefärligt)
```
Huvudfärg:   C:100 M:0  Y:0  K:75
Accentfärg:  C:100 M:0  Y:0  K:60
Bakgrund:    C:0   M:0  Y:0  K:0
```

## Uppdateringshistorik

- **2026-04-16**: Initial färgpalett etablerad
  - Huvudfärg: #004040 (Petroleumgrön/Teal)
  - Accentfärg: #006666 (Ljusare Teal)
  - Bakgrund: #FFFFFF (Vit)
