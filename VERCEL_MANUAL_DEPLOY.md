# Vercel - Manuell Deploy Guide

Om Vercel inte automatiskt detekterar din nya commit, följ dessa steg:

---

## ✅ Verifiera GitHub

1. Gå till: https://github.com/Performile1/GoalSquad
2. Kolla att senaste commit är synlig:
   ```
   3651ddb - fix: Update API route config for Next.js 14 compatibility
   ```
3. Om du INTE ser den, kör:
   ```bash
   git push origin master --force
   ```

---

## 🔄 Manuell Deploy i Vercel

### Metod 1: Via Vercel Dashboard (Rekommenderat)

1. Gå till: https://vercel.com/dashboard
2. Klicka på ditt projekt: **GoalSquad**
3. Klicka på **"Deployments"** tab
4. Klicka **"Redeploy"** knappen (högst upp)
5. Välj **"Use existing Build Cache"** = NO (viktigt!)
6. Klicka **"Redeploy"**

---

### Metod 2: Trigger från Git

1. Gå till Vercel Dashboard → **Settings** → **Git**
2. Kolla att **"Production Branch"** = `master`
3. Klicka **"Disconnect"** och sedan **"Connect"** igen
4. Detta tvingar Vercel att synka med GitHub

---

### Metod 3: Via Vercel CLI (Snabbast)

Om du har Vercel CLI installerat:

```bash
# Installera Vercel CLI (om inte redan installerat)
npm i -g vercel

# Logga in
vercel login

# Länka projekt
vercel link

# Deploya
vercel --prod
```

---

### Metod 4: Push en ny commit (Trigger)

Om inget annat fungerar, gör en liten ändring:

```bash
# Lägg till en kommentar i README
echo "# Updated $(date)" >> README.md

# Commit och push
git add README.md
git commit -m "chore: trigger Vercel rebuild"
git push origin master
```

Detta kommer garanterat trigga en ny deploy.

---

## 🔍 Kolla Deployment Status

### I Vercel Dashboard:

1. Gå till: https://vercel.com/dashboard
2. Välj projekt: **GoalSquad**
3. Se **"Deployments"** tab
4. Senaste deployment ska visa:
   ```
   Status: Building... / Ready
   Commit: 3651ddb
   Branch: master
   ```

### Förväntat:

**Building** (2-3 min):
```
⏳ Installing dependencies...
⏳ Running build...
⏳ Uploading...
```

**Success**:
```
✅ Build completed
✅ Deployment ready
🌐 https://goalsquad-xxx.vercel.app
```

---

## 🐛 Troubleshooting

### Problem: "Deployment not triggered"

**Lösning**:
1. Kolla att GitHub webhook är aktiverad:
   - GitHub → Settings → Webhooks
   - Ska finnas en webhook till Vercel
2. Kolla Vercel Git integration:
   - Vercel → Settings → Git
   - Ska vara "Connected"

### Problem: "Build still fails"

**Lösning**:
1. Kolla build logs i Vercel
2. Verifiera att senaste commit (3651ddb) används
3. Om gamla commit används, gör en force redeploy

### Problem: "Wrong commit deployed"

**Lösning**:
1. Vercel → Deployments
2. Hitta deployment med rätt commit (3651ddb)
3. Klicka **"Promote to Production"**

---

## ✅ Verifiering

När deployment är klar:

1. Besök: https://goalsquad-xxx.vercel.app
2. Öppna browser console
3. Kör:
   ```javascript
   console.log('Build version:', '3651ddb');
   ```
4. Testa API:
   ```javascript
   fetch('/api/products').then(r => r.json()).then(console.log);
   ```

---

## 📊 Expected Build Output

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (20/20)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         95 kB
├ ○ /api/products                        0 B            0 B
├ ○ /calculator                          8.1 kB        102 kB
└ ○ /products                            6.5 kB         98 kB

○  (Static)  prerendered as static content
```

---

**LYCKA TILL!** 🚀

Om problem kvarstår, använd Metod 4 (push ny commit) för att garanterat trigga rebuild.
