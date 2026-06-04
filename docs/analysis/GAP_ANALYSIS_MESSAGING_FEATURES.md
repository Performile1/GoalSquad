# Gap Analys: Messaging Features

**Datum**: 2026-05-31  
**Status**: Implementation klar, men saknar frontend integration

---

## 📊 Översikt

Tre funktioner har implementerats men saknar fullständig frontend integration och databas-setup.

---

## 1. Push Notifications

### ✅ Implementerat
- Service worker (`public/sw.js`)
- ServiceWorkerRegistration komponent
- Notification subscription API (`/api/notifications/subscribe`)
- SQL migration för push subscriptions och notifications (075)

### ❌ Saknas

**Frontend:**
- [ ] Notification permission request component
- [ ] Push notification subscription UI
- [ ] Notification display component in UI
- [ ] Notification settings page
- [ ] Notification preference management

**Backend:**
- [ ] Notification sending logic (Web Push API)
- [ ] Integration med order events (new order, order status changes)
- [ ] Integration med campaign events (campaign start, reminders)
- [ ] Notification scheduling system
- [ ] Notification template system

**Database:**
- [ ] SQL migration 075 behöver köras
- [ ] Verifiera att push_subscriptions tabellen existerar
- [ ] Verifiera att notifications tabellen existerar
- [ ] Verifiera RLS policies

**Integration:**
- [ ] Trigger notifications på order creation
- [ ] Trigger notifications på order status changes
- [ ] Trigger notifications på campaign events
- [ ] Trigger notifications på nya messages (optional)

---

## 2. Message Attachments

### ✅ Implementerat
- SQL migration för attachment columns (076)
- File upload API (`/api/messages/upload-attachment`)
- Attachment UI i RealtimeChat (file input, preview, remove)
- Optimistic UI för attachments

### ❌ Saknas

**Frontend:**
- [ ] Display av attachments i message bubbles
- [ ] Image preview i chat (click to expand)
- [ ] File download functionality
- [ ] File type icons
- [ ] File size display
- [ ] Attachment loading states

**Backend:**
- [ ] Storage bucket `message-attachments` behöver skapas i Supabase
- [ ] File validation enhancement (virus scanning)
- [ ] File compression for images
- [ ] Thumbnail generation for images
- [ ] File expiration/cleanup logic

**Database:**
- [ ] SQL migration 076 behöver köras
- [ ] Verifiera att attachment columns existerar i messages
- [ ] Verifiera att attachment_type check constraint fungerar

**Integration:**
- [ ] Update message display logic to show attachments
- [ ] Add attachment click handlers
- [ ] Add attachment download functionality

---

## 3. Voice Messages

### ✅ Implementerat
- SQL migration för audio columns (077)
- Audio recording API (`/api/messages/upload-audio`)
- Audio recording UI i RealtimeChat (record button, duration tracking)
- MediaRecorder API integration

### ❌ Saknas

**Frontend:**
- [ ] Audio playback i message bubbles
- [ ] Audio player controls (play/pause, seek)
- [ ] Audio duration display
- [ ] Audio waveform visualization
- [ ] Audio recording permission handling
- [ ] Audio quality settings

**Backend:**
- [ ] Storage bucket `voice-messages` behöver skapas i Supabase
- [ ] Audio format conversion (webm to mp3)
- [ ] Audio compression
- [ ] Audio transcription (AI, optional)
- [ ] Audio cleanup/expiration logic

**Database:**
- [ ] SQL migration 077 behöver köras
- [ ] Verifiera att audio columns existerar i messages
- [ ] Verifiera att message_type check constraint inkluderar 'audio'

**Integration:**
- [ ] Update message display logic to show audio player
- [ ] Add audio playback controls
- [ ] Add audio download functionality

---

## 4. RealtimeChat Component Gaps

### ❌ Saknas i Message Display

**Current State:**
- Message bubbles visar bara `content` text
- Ingen visning av attachments
- Ingen visning av audio messages

**Required:**
```typescript
// Lägg till i message display:
{msg.attachment_url && (
  <AttachmentPreview url={msg.attachment_url} type={msg.attachment_type} />
)}

{msg.audio_url && (
  <AudioPlayer url={msg.audio_url} duration={msg.audio_duration} />
)}
```

---

## 5. Database Setup Gaps

### ❌ Saknas

**Storage Buckets:**
- [ ] Skapa `message-attachments` bucket i Supabase Storage
- [ ] Skapa `voice-messages` bucket i Supabase Storage
- [ ] Konfigurera bucket policies (public vs private)
- [ ] Konfigurera bucket CORS policies

**Migrations:**
- [ ] Kör migration 075 (push notifications)
- [ ] Kör migration 076 (message attachments)
- [ ] Kör migration 077 (voice messages)
- [ ] Verifiera att alla tables skapades korrekt

---

## 📋 Plan för Steg 2, 3, 4

### Steg 2: Databas Setup (High Priority)

**Mål:** Säkerställa att databasen är redo för alla funktioner

**Tasks:**
1. Kör SQL migration 075, 076, 077 i Supabase
2. Skapa storage buckets i Supabase Dashboard
3. Verifiera att alla tables och columns existerar
4. Testa RLS policies
5. Testa storage bucket access

**Estimated Time:** 30 minuter

---

### Steg 3: Frontend Integration (High Priority)

**Mål:** Fullständig frontend integration för alla 3 funktioner

**Tasks:**

**3.1 Message Attachments Display:**
1. Skapa AttachmentPreview komponent
2. Lägg till attachment display i RealtimeChat message bubbles
3. Implementera image preview (click to expand)
4. Implementera file download
5. Lägg till file type icons
6. Lägg till file size display

**3.2 Voice Messages Display:**
1. Skapa AudioPlayer komponent
2. Lägg till audio player i RealtimeChat message bubbles
3. Implementera audio controls (play/pause, seek)
4. Lägg till audio duration display
5. Implementera audio download

**3.3 Push Notifications UI:**
1. Skapa NotificationPermissionRequest komponent
2. Skapa NotificationSettings komponent
3. Implementera notification subscription UI
4. Skapa NotificationDisplay komponent
5. Lägg till notification bell icon i navbar
6. Implementera notification dropdown

**Estimated Time:** 2-3 timmar

---

### Steg 4: Backend Integration & Testing (Medium Priority)

**Mål:** Fullständig backend integration och testing

**Tasks:**

**4.1 Push Notifications Integration:**
1. Implementera notification sending logic (Web Push API)
2. Integrera med order events (new order, status changes)
3. Integrera med campaign events (start, reminders)
4. Implementera notification scheduling
5. Testa push notifications på olika devices

**4.2 File Upload Enhancements:**
1. Implementera image compression
2. Implementera thumbnail generation
3. Lägg till file validation
4. Implementera file cleanup logic

**4.3 Audio Processing:**
1. Implementera audio format conversion
2. Implementera audio compression
3. Lägg till audio quality settings
4. Implementera audio cleanup logic

**4.4 Testing:**
1. Testa message attachments (images, files)
2. Testa voice messages (record, upload, playback)
3. Testa push notifications (subscribe, receive, display)
4. Testa edge cases (large files, network errors)
5. Testa på olika browsers (Chrome, Firefox, Safari)

**Estimated Time:** 3-4 timmar

---

## 🎯 Prioriteringsordning

1. **Steg 2 (Databas Setup)** - MUST DO FIRST
   - Allt annat beror på att databasen är korrekt konfigurerad

2. **Steg 3.1 (Message Attachments Display)** - HIGH PRIORITY
   - Visuell feedback för användare
   - Enklare att implementera än voice messages

3. **Steg 3.2 (Voice Messages Display)** - HIGH PRIORITY
   - Komplett voice message flow
   - Kräver audio player implementation

4. **Steg 3.3 (Push Notifications UI)** - MEDIUM PRIORITY
   - Nice-to-have men inte kritiskt för messaging
   - Kan göras senare

5. **Steg 4 (Backend Integration)** - MEDIUM PRIORITY
   - Förbättringar och optimeringar
   - Kan göras efter att grundfunktionen fungerar

---

## 📝 Summary

**Status:** 50% Complete

**Implementerat:**
- ✅ Database schema (migrations)
- ✅ Backend APIs
- ✅ Basic UI components
- ✅ Service worker

**Saknas:**
- ❌ Database setup (migrations körda, buckets skapade)
- ❌ Frontend display logic (attachments, audio, notifications)
- ❌ Backend integration (event triggers, processing)
- ❌ Testing

**Nästa steg:** Kör Steg 2 (Databas Setup)
