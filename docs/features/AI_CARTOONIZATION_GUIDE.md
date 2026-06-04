# AI Cartoonization API Guide

## 🎨 Rekommenderade API:er för Avatar Cartoonization

---

## Option 1: Replicate.com (⭐ REKOMMENDERAT)

### Varför Replicate?
- ✅ Bäst kvalitet på cartoon-konvertering
- ✅ Många färdiga modeller
- ✅ Pay-per-use (ingen månadskostnad)
- ✅ Snabb processing (~5-10 sekunder)

### Setup
```bash
npm install replicate
```

### Environment Variable
```env
REPLICATE_API_TOKEN=r8_your_token_here
```

### Pricing
- **$0.0023 per sekund** GPU-tid
- Typisk cartoon: ~10 sekunder = **$0.023 per bild**
- 1000 avatars = **$23**

### Rekommenderade Modeller

#### 1. **Toonify** (Bäst för realistiska ansikten)
```typescript
const output = await replicate.run(
  "rosebud-ai/toonify:latest",
  {
    input: {
      image: imageBase64,
      style: "pixar" // eller "disney", "anime", "comic"
    }
  }
);
```

#### 2. **CartoonGAN**
```typescript
const output = await replicate.run(
  "cjwbw/cartoongan:latest",
  {
    input: {
      image: imageBase64,
      style: "hayao" // Miyazaki-style
    }
  }
);
```

#### 3. **AnimeGAN**
```typescript
const output = await replicate.run(
  "cjwbw/animegan:latest",
  {
    input: {
      image: imageBase64
    }
  }
);
```

### Implementation
```typescript
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function cartoonizeWithReplicate(imageBase64: string) {
  const output = await replicate.run(
    "rosebud-ai/toonify:latest",
    {
      input: {
        image: imageBase64,
        style: "pixar"
      }
    }
  );
  
  return output; // URL to cartoonized image
}
```

---

## Option 2: Stability AI (Stable Diffusion)

### Varför Stability AI?
- ✅ Mycket flexibel (custom prompts)
- ✅ Hög kvalitet
- ✅ Bra för stylized avatars

### Setup
```bash
# Ingen npm package behövs, använd fetch
```

### Environment Variable
```env
STABILITY_API_KEY=sk-your-key-here
```

### Pricing
- **$0.002 per bild** (1024x1024)
- 1000 avatars = **$2**
- ✅ Billigare än Replicate

### Implementation
```typescript
async function cartoonizeWithStability(imageBase64: string) {
  const base64Data = imageBase64.split(',')[1];
  
  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        init_image: base64Data,
        text_prompts: [
          {
            text: 'cartoon style, pixar animation, colorful, friendly, cute avatar, 3D rendered',
            weight: 1,
          },
          {
            text: 'realistic, photograph, ugly, blurry',
            weight: -1,
          }
        ],
        cfg_scale: 7,
        image_strength: 0.35, // Hur mycket av original som behålls
        steps: 30,
      }),
    }
  );
  
  const result = await response.json();
  return `data:image/png;base64,${result.artifacts[0].base64}`;
}
```

---

## Option 3: OpenAI DALL-E 3 (Image Editing)

### Varför OpenAI?
- ✅ Mycket bra på att följa instruktioner
- ✅ Konsistent kvalitet
- ❌ Dyrare än andra alternativ

### Setup
```bash
npm install openai
```

### Environment Variable
```env
OPENAI_API_KEY=sk-your-key-here
```

### Pricing
- **$0.040 per bild** (1024x1024)
- 1000 avatars = **$40**

### Implementation
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function cartoonizeWithOpenAI(imageBase64: string) {
  const response = await openai.images.edit({
    image: imageBase64,
    prompt: "Transform this person into a cute Pixar-style cartoon character with big eyes and friendly smile",
    n: 1,
    size: "1024x1024",
  });
  
  return response.data[0].url;
}
```

---

## Option 4: Cloudinary AI (Simplast)

### Varför Cloudinary?
- ✅ Enklast att implementera
- ✅ Ingen ML-kunskap behövs
- ✅ Bra för enkel cartoon-effekt
- ❌ Mindre avancerad än AI-modeller

### Setup
```bash
npm install cloudinary
```

### Environment Variables
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Pricing
- **Gratis tier**: 25,000 transformations/månad
- **$0.0008 per transformation** efter det

### Implementation
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function cartoonizeWithCloudinary(imageUrl: string) {
  const result = cloudinary.url(imageUrl, {
    effect: 'cartoonify',
    transformation: [
      { effect: 'oil_paint:50' },
      { effect: 'outline:15' },
      { effect: 'saturation:50' }
    ]
  });
  
  return result;
}
```

---

## Option 5: Local Processing (Canvas/Sharp) - GRATIS

### Varför Local?
- ✅ Helt gratis
- ✅ Ingen external API
- ✅ Snabbt (ingen network latency)
- ❌ Lägre kvalitet än AI

### Setup
```bash
npm install sharp
```

### Implementation
```typescript
import sharp from 'sharp';

async function cartoonizeLocal(imageBuffer: Buffer) {
  const processed = await sharp(imageBuffer)
    // Öka kontrast och saturation
    .modulate({
      brightness: 1.1,
      saturation: 1.5,
      hue: 0
    })
    // Sharpen edges
    .sharpen({
      sigma: 2,
      m1: 0,
      m2: 3,
      x1: 3,
      y2: 15,
      y3: 15
    })
    // Posterize (reduce colors)
    .toColorspace('srgb')
    .toBuffer();
  
  return processed;
}
```

---

## 📊 Jämförelse

| API | Kvalitet | Pris/Bild | Setup | Speed | Rekommendation |
|-----|----------|-----------|-------|-------|----------------|
| **Replicate** | ⭐⭐⭐⭐⭐ | $0.023 | Lätt | 5-10s | ✅ Bäst overall |
| **Stability AI** | ⭐⭐⭐⭐⭐ | $0.002 | Medel | 10-15s | ✅ Billigast AI |
| **OpenAI** | ⭐⭐⭐⭐ | $0.040 | Lätt | 15-20s | ❌ För dyrt |
| **Cloudinary** | ⭐⭐⭐ | $0.0008 | Lätt | 1-2s | ✅ Snabbast |
| **Local (Sharp)** | ⭐⭐ | Gratis | Svår | <1s | ✅ Budget option |

---

## 🎯 Min Rekommendation

### För Production: **Replicate.com + Cloudinary Fallback**

**Varför?**
1. **Replicate** för bästa kvalitet (använd för 90% av användare)
2. **Cloudinary** som fallback om Replicate är nere
3. Kombinationen ger bästa UX och reliability

### Implementation Strategy
```typescript
async function cartoonizeAvatar(imageBase64: string) {
  try {
    // Try Replicate first (best quality)
    return await cartoonizeWithReplicate(imageBase64);
  } catch (error) {
    console.error('Replicate failed, falling back to Cloudinary');
    try {
      // Fallback to Cloudinary
      return await cartoonizeWithCloudinary(imageBase64);
    } catch (error2) {
      console.error('Cloudinary failed, using local processing');
      // Final fallback to local
      return await cartoonizeLocal(imageBase64);
    }
  }
}
```

---

## 🚀 Quick Start

### 1. Skapa Replicate Account
```
1. Gå till https://replicate.com
2. Sign up (gratis)
3. Gå till Account > API Tokens
4. Kopiera token
```

### 2. Installera Dependencies
```bash
npm install replicate
```

### 3. Sätt Environment Variable
```env
REPLICATE_API_TOKEN=r8_your_token_here
```

### 4. Testa
```bash
curl -X POST http://localhost:3000/api/avatar/cartoonize \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,...", "userId": "user-id"}'
```

---

## 💰 Kostnadskalkyl

### Scenario: 10,000 användare skapar avatars

| API | Kostnad |
|-----|---------|
| Replicate | $230 |
| Stability AI | $20 |
| OpenAI | $400 |
| Cloudinary | $8 |
| Local | $0 |

**Rekommendation**: Använd Stability AI för bästa pris/kvalitet ($20 för 10k användare)

---

## 📚 Resurser

- **Replicate Docs**: https://replicate.com/docs
- **Stability AI Docs**: https://platform.stability.ai/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **Cloudinary Docs**: https://cloudinary.com/documentation

---

**Min slutliga rekommendation**: Börja med **Stability AI** ($0.002/bild) för bästa pris/kvalitet, med **Cloudinary** som fallback.
