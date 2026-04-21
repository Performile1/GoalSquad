# GoalSquad - Supabase Auth Setup Guide

## 1. Supabase Auth Configuration

### Step 1: Enable Email Authentication

1. Go to Supabase Dashboard → Authentication → Providers
2. Click on "Email" provider
3. Toggle "Enable Email provider" to ON
4. Configure settings:
   - **Confirm email**: OFF (for development) / ON (for production)
   - **Secure email change**: ON
   - **Double opt-in**: OFF
   - **Enable signup**: ON

### Step 2: Enable Magic Link

1. In the same "Email" provider settings
2. Toggle "Enable Magic Link" to ON
3. Magic link allows users to log in without password via email

### Step 3: Configure Google OAuth

1. Go to Google Cloud Console (console.cloud.google.com)
2. Create a new project or select existing
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://[your-project-ref].supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local dev)
5. Copy Client ID and Client Secret

6. In Supabase Dashboard → Authentication → Providers → Google:
   - Toggle "Enable Google provider" to ON
   - Paste Client ID
   - Paste Client Secret
   - Click Save

### Step 4: Configure Facebook OAuth

1. Go to Facebook Developers (developers.facebook.com)
2. Create a new app or select existing
3. Add Facebook Login product
4. Configure OAuth settings:
   - Valid OAuth Redirect URIs:
     - `https://[your-project-ref].supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local dev)
5. Copy App ID and App Secret

6. In Supabase Dashboard → Authentication → Providers → Facebook:
   - Toggle "Enable Facebook provider" to ON
   - Paste App ID
   - Paste App Secret
   - Click Save

### Step 5: Configure URL Settings

1. Go to Authentication → URL Configuration
2. Set:
   - **Site URL**: `http://localhost:3000` (dev) or your production URL
   - **Redirect URLs**: Add:
     - `http://localhost:3000/auth/callback`
     - `https://[your-domain]/auth/callback`

## 2. Email Templates with Branding

Supabase uses SendGrid for email templates. Configure in Supabase Dashboard:

### Step 1: Configure SendGrid

1. Go to Authentication → Email Templates
2. Click "Configure SMTP" or use SendGrid integration
3. Add SendGrid API key

### Step 2: Customize Email Templates

#### Confirm Signup Email Template
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; }
    .logo { color: white; font-size: 32px; font-weight: bold; margin: 0; }
    .content { padding: 40px; }
    h1 { color: #1e3a8a; margin-top: 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .button:hover { background: #2563eb; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    .icon { font-size: 24px; margin-right: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">🎯 GoalSquad</h1>
    </div>
    <div class="content">
      <h1>Välkommen till GoalSquad!</h1>
      <p>Hej {{ .Email }},</p>
      <p>Tack för att du registrerar dig hos GoalSquad. För att aktivera ditt konto, klicka på knappen nedan:</p>
      <a href="{{ .ConfirmationURL }}" class="button">Aktivera konto</a>
      <p>Eller kopiera och klistra in denna länk i din webbläsare:</p>
      <p>{{ .ConfirmationURL }}</p>
      <p>Länken är giltig i 24 timmar.</p>
    </div>
    <div class="footer">
      <p>© 2024 GoalSquad. Alla rättigheter förbehållna.</p>
    </div>
  </div>
</body>
</html>
```

#### Magic Link Email Template
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; }
    .logo { color: white; font-size: 32px; font-weight: bold; margin: 0; }
    .content { padding: 40px; }
    h1 { color: #1e3a8a; margin-top: 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .button:hover { background: #2563eb; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">🎯 GoalSquad</h1>
    </div>
    <div class="content">
      <h1>Din inloggningslänk</h1>
      <p>Hej {{ .Email }},</p>
      <p>Klicka på knappen nedan för att logga in på GoalSquad:</p>
      <a href="{{ .ConfirmationURL }}" class="button">Logga in</a>
      <p>Länken är giltig i 1 timme.</p>
    </div>
    <div class="footer">
      <p>© 2024 GoalSquad. Alla rättigheter förbehållna.</p>
    </div>
  </div>
</body>
</html>
```

#### Reset Password Email Template
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; }
    .logo { color: white; font-size: 32px; font-weight: bold; margin: 0; }
    .content { padding: 40px; }
    h1 { color: #1e3a8a; margin-top: 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .button:hover { background: #2563eb; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">🎯 GoalSquad</h1>
    </div>
    <div class="content">
      <h1>Återställ lösenord</h1>
      <p>Hej {{ .Email }},</p>
      <p>Klicka på knappen nedan för att återställa ditt lösenord:</p>
      <a href="{{ .ConfirmationURL }}" class="button">Återställ lösenord</a>
      <p>Länken är giltig i 1 timme.</p>
      <p>Om du inte begärde detta, vänligen ignorera detta email.</p>
    </div>
    <div class="footer">
      <p>© 2024 GoalSquad. Alla rättigheter förbehållna.</p>
    </div>
  </div>
</body>
</html>
```

## 3. Social Sharing Guide

### Sharing Products via Email

Create a shareable email template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; }
    .product-image { width: 100%; max-width: 400px; border-radius: 8px; }
    .content { padding: 40px; }
    .price { font-size: 24px; color: #1e3a8a; font-weight: bold; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 GoalSquad</h1>
    </div>
    <div class="content">
      <h2>{{ .ProductName }}</h2>
      <img src="{{ .ProductImage }}" alt="{{ .ProductName }}" class="product-image">
      <p>{{ .Description }}</p>
      <p class="price">{{ .Price }} kr</p>
      <a href="{{ .ProductURL }}" class="button">Köp nu</a>
    </div>
  </div>
</body>
</html>
```

### Sharing via SMS

Use a URL shortener service (like Bitly or TinyURL) for product links:

```
Hej! Kolla in denna produkt på GoalSquad: {{ shortLink }}
```

### Sharing via Social Media

#### Facebook Share
```
https://www.facebook.com/sharer/sharer.php?u={{ productURL }}
```

#### Twitter/X Share
```
https://twitter.com/intent/tweet?text={{ productName }}&url={{ productURL }}
```

#### LinkedIn Share
```
https://www.linkedin.com/sharing/share-offsite/?url={{ productURL }}
```

#### WhatsApp Share
```
https://api.whatsapp.com/send?text={{ productName }} - {{ productURL }}
```

### Implementation in Next.js

Create a share component:

```typescript
// app/components/ProductShare.tsx
'use client';

import { useState } from 'react';
import { Share2, Mail, MessageCircle, Facebook, Twitter, Linkedin } from 'lucide-react';

interface ProductShareProps {
  productName: string;
  productUrl: string;
  productImage?: string;
  price?: number;
}

export function ProductShare({ productName, productUrl, productImage, price }: ProductShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + productUrl : productUrl;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Kolla in ${productName} på GoalSquad`);
    const body = encodeURIComponent(`Hej!\n\nJag hittade denna produkt på GoalSquad som jag tror du skulle gilla:\n\n${productName}\n${price ? `Pris: ${price} kr` : ''}\n\nLänk: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`${productName} på GoalSquad`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${productName} - ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyLink}
        className="p-2 hover:bg-gray-100 rounded-full"
        title="Kopiera länk"
      >
        <Share2 className="w-5 h-5" />
      </button>
      <button
        onClick={shareEmail}
        className="p-2 hover:bg-gray-100 rounded-full"
        title="Dela via email"
      >
        <Mail className="w-5 h-5" />
      </button>
      <button
        onClick={shareWhatsApp}
        className="p-2 hover:bg-gray-100 rounded-full"
        title="Dela via WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
      <button
        onClick={shareFacebook}
        className="p-2 hover:bg-gray-100 rounded-full"
        title="Dela på Facebook"
      >
        <Facebook className="w-5 h-5" />
      </button>
      <button
        onClick={shareTwitter}
        className="p-2 hover:bg-gray-100 rounded-full"
        title="Dela på Twitter"
      >
        <Twitter className="w-5 h-5" />
      </button>
      {copied && <span className="text-sm text-green-600">Kopierad!</span>}
    </div>
  );
}
```

## 4. Create Test Users

After configuring auth, create test users:

```sql
-- Update roles for test users
UPDATE profiles SET role = 'admin' WHERE email = 'admin@test.com';
UPDATE profiles SET role = 'seller' WHERE email = 'seller@test.com';
UPDATE profiles SET role = 'merchant' WHERE email = 'merchant@test.com';
UPDATE profiles SET role = 'community_admin' WHERE email = 'community@test.com';
```

## 5. Environment Variables

Ensure these are in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

## Summary Checklist

- [ ] Enable Email provider in Supabase
- [ ] Enable Magic Link
- [ ] Configure Google OAuth
- [ ] Configure Facebook OAuth
- [ ] Set up URL configuration
- [ ] Configure SendGrid for emails
- [ ] Customize email templates with branding
- [ ] Create share component for products
- [ ] Create test users with correct roles
- [ ] Test login flow (email/password)
- [ ] Test magic link flow
- [ ] Test Google login
- [ ] Test Facebook login
