# Real-time Messaging i GoalSquad

**Status**: ✅ Implementerat  
**Datum**: 2026-05-31  
**Version**: 1.0.0

---

## 📊 Översikt

Real-time Messaging-systemet möjliggör live-uppdateringar av meddelanden utan polling, med hjälp av Supabase Realtime. Systemet inkluderar:

- **Live meddelanden**: Nya meddelanden visas direkt i realtid
- **Typing indicators**: Se när andra skriver
- **Optimistic UI**: Meddelanden visas omedelbart vid skickande
- **Auto-scroll**: Chatt rullar automatiskt till nyaste meddelandet

---

## 🏗️ Arkitektur

### Backend Komponenter

#### 1. Database Migrations

**073_enable_realtime_messaging.sql**
- Aktiverar Supabase Realtime för messaging-tabeller
- Lägger till tabeller i `supabase_realtime` publication
- Skapar performance-index för real-time queries
- Sätter upp RLS policies för real-time subscriptions

**074_typing_indicators.sql**
- Skapar `typing_indicators` tabell
- Aktiverar Realtime för typing status
- Skapar funktion för att uppdatera typing status
- Auto-cleanup av gamla typing indicators (10 sekunder)

#### 2. API Endpoints

**POST /api/messages/[conversationId]/typing**
- Uppdaterar användarens typing status
- Body: `{ isTyping: boolean }`
- Kräver autentisering och deltagande i konversation

### Frontend Komponenter

#### 1. RealtimeChat Component

**Filstation**: `app/components/RealtimeChat.tsx`

**Features**:
- Supabase Realtime subscription för nya meddelanden
- Typing indicator subscription
- Optimistic UI för meddelandeskick
- Auto-scroll till botten
- Visuell feedback för skickande/laddning

**Props**:
```typescript
interface RealtimeChatProps {
  conversationId: string;
  currentUserId: string;
}
```

**Usage**:
```tsx
<RealtimeChat 
  conversationId="uuid-here" 
  currentUserId="user-uuid-here" 
/>
```

#### 2. Messages Page

**Filstation**: `app/messages/page.tsx`

**Features**:
- Konversationslista med unread badges
- Välj konversation för att chatta
- Integrerar RealtimeChat-komponent
- Auto-hämtar current user ID

---

## 🔧 Installation

### 1. Kör Database Migrations

```bash
# Aktivera Realtime för messaging
psql -f supabase/migrations/073_enable_realtime_messaging.sql

# Lägg till typing indicators
psql -f supabase/migrations/074_typing_indicators.sql
```

### 2. Verifiera Realtime i Supabase Dashboard

1. Gå till Supabase Dashboard
2. Navigera till Database > Replication
3. Verifiera att följande tabeller finns i `supabase_realtime`:
   - `messages`
   - `conversations`
   - `conversation_participants`
   - `message_reads`
   - `typing_indicators`

### 3. Verifiera Environment Variables

Se till att följande variabler är satta i `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 💡 Användning

### Basic Usage

```tsx
import RealtimeChat from '@/app/components/RealtimeChat';

export default function MyChatPage() {
  const conversationId = 'some-uuid';
  const currentUserId = 'user-uuid';

  return (
    <div className="h-screen">
      <RealtimeChat 
        conversationId={conversationId} 
        currentUserId={currentUserId} 
      />
    </div>
  );
}
```

### Custom Styling

RealtimeChat-komponenten använder Tailwind CSS. Du kan anpassa styling genom att klona komponenten och modifiera klasserna.

---

## 🔍 Hur det Fungerar

### 1. Realtime Subscription Flow

```
1. Komponent monteras
   ↓
2. Ladda historiska meddelanden via REST API
   ↓
3. Öppna Supabase Realtime channel
   ↓
4. Prenumerera på INSERT events i messages-tabellen
   ↓
5. Prenumerera på * events i typing_indicators-tabellen
   ↓
6. När nytt meddelande kommer → Uppdatera state
   ↓
7. När typing status ändras → Uppdatera typing indicator
```

### 2. Optimistic UI Flow

```
1. Användare skriver meddelande
   ↓
2. Meddelande läggs till lokalt med pending=true
   ↓
3. API-anrop skickas
   ↓
4. Om lyckat → Ersätt pending med riktigt meddelande
   ↓
5. Om fel → Ta bort pending meddelande, återställ input
```

### 3. Typing Indicator Flow

```
1. Användare börjar skriva
   ↓
2. useEffect upptäcker input ändring
   ↓
3. POST /api/messages/[id]/typing med isTyping=true
   ↓
4. Database uppdateras
   ↓
5. Realtime pushar ändring till andra klienter
   ↓
6. Andra klienter visar "Någon skriver..."
   ↓
7. 3 sekunder utan typing → isTyping=false
   ↓
8. 10 sekunder auto-cleanup i databasen
```

---

## 🎨 UI Features

### 1. Message Bubbles

- **Egna meddelanden**: Blå bakgrund, högerjusterad
- **Andras meddelanden**: Vit bakgrund, vänsterjusterad
- **Pending meddelanden**: 60% opacitet, "Skickar..." text
- **Tidsstämpel**: Visas under varje meddelande

### 2. Typing Indicator

- Animerade tre punkter
- Text: "Någon skriver..." eller "X personer skriver..."
- Visas automatiskt när andra skriver
- Försvinner efter 10 sekunder

### 3. Input Field

- Auto-clear vid skickande
- Enter-tangent för att skicka
- Disabled state vid skickande
- Spinnande ikon vid skickande

---

## 🔐 Security

### RLS Policies

**Messages**:
- Användare kan bara se meddelanden från konversationer de deltar i
- Realtime subscriptions följer samma RLS policies

**Typing Indicators**:
- Användare kan bara se typing status i sina konversationer
- Användare kan bara uppdatera sin egen typing status

### Authentication

- Alla API-endpoints kräver autentisering
- Typing status verifierar deltagande i konversation
- Realtime subscriptions kräver giltig JWT token

---

## 🚀 Performance

### Optimizations

1. **Index för Realtime Queries**:
   ```sql
   CREATE INDEX idx_messages_realtime 
   ON messages(conversation_id, created_at DESC) 
   WHERE deleted_at IS NULL;
   ```

2. **Auto-cleanup**:
   - Typing indicators rensas automatiskt efter 10 sekunder
   - Förhindrar onödig dataaccumulation

3. **Efficient Subscriptions**:
   - Filter på conversation_id för att minska dataflöde
   - Endast INSERT events för messages
   - Alla events för typing indicators (för uppdateringar)

---

## 🧪 Testing

### Manual Testing

1. **Testa Realtime Messages**:
   - Öppna `/messages` i två olika webbläsare
   - Skicka meddelande i ena fönstret
   - Verifiera att det visas direkt i andra fönstret

2. **Testa Typing Indicators**:
   - Börja skriva i ena fönstret
   - Verifiera att "Någon skriver..." visas i andra fönstret
   - Sluta skriva och verifiera att det försvinner

3. **Testa Optimistic UI**:
   - Koppla bort nätverket
   - Skicka meddelande
   - Verifiera att det visas med "Skickar..." status
   - Återanslut nätverket och verifiera att det skickas

### Automated Testing (Framtida)

```typescript
// Vitest exempel
describe('RealtimeChat', () => {
  it('should subscribe to messages on mount', async () => {
    const { result } = renderHook(() => useRealtimeChat(conversationId));
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });
  });

  it('should show typing indicator when other user types', async () => {
    // Simulate typing event
    await supabase.from('typing_indicators').insert({
      conversation_id,
      user_id: 'other-user',
      is_typing: true,
    });
    
    await waitFor(() => {
      expect(screen.getByText('Någon skriver...')).toBeInTheDocument();
    });
  });
});
```

---

## 📈 Monitoring

### Loggning

Alla errors loggas via JSON-logger:

```typescript
logger.apiError('POST', '/api/messages/[conversationId]/typing', error, {
  conversationId,
  userId,
  isTyping
});
```

### Metrics att övervaka

- Realtime connection failures
- Typing indicator cleanup frequency
- Message delivery latency
- Subscription reconnection rate

---

## 🐛 Troubleshooting

### Problem: Meddelanden uppdateras inte i realtid

**Lösningar**:
1. Verifiera att tabeller är i `supabase_realtime` publication
2. Kontrollera att Realtime är aktiverat i Supabase Dashboard
3. Kontrollera browser console för connection errors
4. Verifiera att RLS policies tillåter subscriptions

### Problem: Typing indicators visas inte

**Lösningar**:
1. Verifiera att `typing_indicators` tabellen finns
2. Kontrollera att API-endpoint returnerar success
3. Verifiera att subscription filtrerar på rätt conversation_id
4. Kontrollera att user_id matchar korrekt

### Problem: Optimistic UI fastnar

**Lösningar**:
1. Kontrollera nätverksanslutning
2. Verifiera att API-endpoint svarar korrekt
3. Lägg till timeout för pending state
4. Implementera retry-logik

---

## 🔄 Migration från Polling

### Före (Polling)

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchMessages(conversationId);
  }, 3000); // Poll var 3 sekunder
  
  return () => clearInterval(interval);
}, [conversationId]);
```

### Efter (Realtime)

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => {
      setMessages(prev => [...prev, payload.new]);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [conversationId]);
```

**Fördelar**:
- Ingen onödig polling
- Omedelbar uppdatering
- Lägre server load
- Bättre batteriliv på mobil

---

## 🎯 Nästa Steg

### Short-term
- [ ] Lägg till online status indicators
- [ ] Implementera read receipts
- [ ] Lägg till message reactions (👍, ❤️, etc.)
- [ ] Stöd för message attachments

### Long-term
- [ ] Voice messages
- [ ] Video calls
- [ ] Message search
- [ ] Message threads/svar

---

## 📚 Referenser

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

**Status**: ✅ **KLART**  
**Redo för**: Production deployment  
**Testad**: Ja (manual testing)
