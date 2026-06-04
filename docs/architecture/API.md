# GoalSquad API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://goalsquad.shop/api
```

---

## Authentication

Most endpoints require authentication via Supabase JWT:

```typescript
headers: {
  'Authorization': 'Bearer <supabase_jwt_token>',
  'Content-Type': 'application/json'
}
```

---

## Merchants

### POST /api/merchants/onboard

Create a new merchant account.

**Request:**
```json
{
  "merchantName": "My Store",
  "slug": "my-store",
  "description": "Best products in town",
  "email": "merchant@example.com",
  "phone": "+47 123 45 678",
  "addressLine1": "Main Street 123",
  "addressLine2": "Suite 456",
  "city": "Oslo",
  "postalCode": "0123",
  "country": "NO",
  "legalName": "My Store AS",
  "orgNumber": "123456789",
  "vatNumber": "NO123456789MVA",
  "userId": "uuid-of-user",
  "verificationMethod": "otp_email",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response (200):**
```json
{
  "success": true,
  "merchant": {
    "id": "uuid",
    "merchantName": "My Store",
    "slug": "my-store",
    "organizationId": "uuid"
  },
  "verification": {
    "otpHash": "hashed_otp",
    "method": "otp_email"
  }
}
```

**Errors:**
- `400` - Validation failed or slug already exists
- `500` - Server error

---

### POST /api/merchants/verify

Verify merchant onboarding with OTP.

**Request:**
```json
{
  "merchantId": "uuid",
  "otp": "123456",
  "otpHash": "hashed_otp_from_onboard_response",
  "userId": "uuid",
  "email": "merchant@example.com",
  "verificationMethod": "otp_email",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response (200):**
```json
{
  "success": true,
  "merchant": {
    "id": "uuid",
    "verified": true,
    "signatureId": "uuid"
  }
}
```

**Errors:**
- `400` - Invalid OTP
- `404` - Merchant not found
- `500` - Server error

---

## Products

### POST /api/products/create

Create a new product with GS1 dimensions.

**Request:**
```json
{
  "merchantId": "uuid",
  "sku": "GS-ABC123",
  "ean": "1234567890123",
  "gtin": "12345678901234",
  "name": "Nike Air Max 90",
  "description": "Classic sneaker",
  "category": "Footwear",
  "brand": "Nike",
  "basePrice": 1000.00,
  "retailPrice": 1500.00,
  "currency": "NOK",
  "weightGrams": 500,
  "lengthMm": 300,
  "widthMm": 200,
  "heightMm": 100,
  "stockQuantity": 100,
  "stockLocation": "Warehouse A",
  "images": ["https://example.com/image1.jpg"],
  "status": "active",
  "metadata": {}
}
```

**Response (200):**
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "sku": "GS-ABC123",
    "name": "Nike Air Max 90",
    "basePrice": 1000.00,
    "retailPrice": 1500.00,
    "dimensions": {
      "weight": 500,
      "length": 300,
      "width": 200,
      "height": 100,
      "volumetricWeight": 1200,
      "chargeableWeight": 1200
    },
    "status": "active"
  }
}
```

**Errors:**
- `400` - Validation failed or SKU already exists
- `403` - Merchant not verified
- `404` - Merchant not found
- `500` - Server error

---

## Orders (Future)

### POST /api/orders/create

Create a new order.

**Request:**
```json
{
  "customerId": "uuid",
  "customerEmail": "customer@example.com",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "addressLine1": "Street 123",
    "city": "Oslo",
    "postalCode": "0123",
    "country": "NO"
  },
  "billingAddress": { /* same structure */ }
}
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "orderNumber": "GS-2024-001234",
    "subtotal": 3000.00,
    "shippingTotal": 80.00,
    "taxTotal": 600.00,
    "total": 3680.00,
    "stripePaymentIntentId": "pi_xxx",
    "status": "pending"
  }
}
```

---

### POST /api/orders/[id]/complete

Complete order payment (called by Stripe webhook).

**Request:**
```json
{
  "orderId": "uuid",
  "stripePaymentIntentId": "pi_xxx"
}
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "status": "confirmed"
  },
  "split": {
    "transactionId": "uuid",
    "totalAmount": 3680.00,
    "splits": {
      "merchantPayout": 2000.00,
      "salesMargin": 1000.00,
      "handlingFee": 25.00,
      "shippingSpread": 20.00,
      "platformRevenue": 1045.00
    }
  }
}
```

---

## Wallets (Future)

### GET /api/wallets/[ownerId]/balance

Get wallet balance for an owner.

**Query Parameters:**
- `ownerType`: platform | merchant | carrier | hub

**Response (200):**
```json
{
  "success": true,
  "wallet": {
    "id": "uuid",
    "ownerType": "merchant",
    "ownerId": "uuid",
    "balance": 15000.00,
    "currency": "NOK",
    "status": "active"
  }
}
```

---

### GET /api/wallets/[ownerId]/transactions

Get transaction history.

**Query Parameters:**
- `ownerType`: platform | merchant | carrier | hub
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response (200):**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "transactionId": "uuid",
      "entryType": "credit",
      "amount": 2000.00,
      "category": "merchant_payout",
      "description": "Merchant payout for order GS-2024-001234",
      "createdAt": "2024-04-15T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Shipments (Future)

### POST /api/shipments/create

Create shipment for an order.

**Request:**
```json
{
  "orderId": "uuid",
  "originHubId": "uuid",
  "carrierName": "PostNord",
  "carrierService": "Express",
  "routeType": "direct"
}
```

**Response (200):**
```json
{
  "success": true,
  "shipment": {
    "id": "uuid",
    "shipmentNumber": "SHP-2024-001234",
    "trackingNumber": "1234567890",
    "trackingUrl": "https://postnord.no/track/1234567890",
    "status": "pending"
  }
}
```

---

### POST /api/shipments/[id]/update-status

Update shipment status (called by carrier webhook).

**Request:**
```json
{
  "shipmentId": "uuid",
  "status": "in_transit",
  "location": "Oslo Distribution Center",
  "timestamp": "2024-04-15T12:00:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "shipment": {
    "id": "uuid",
    "status": "in_transit",
    "updatedAt": "2024-04-15T12:00:00Z"
  }
}
```

---

## Webhooks

### POST /api/webhooks/stripe

Stripe webhook handler.

**Headers:**
```
stripe-signature: signature_from_stripe
```

**Events Handled:**
- `checkout.session.completed` - Triggers Split Engine
- `payment_intent.succeeded` - Updates order status
- `account.updated` - Updates merchant Stripe account

**Response (200):**
```json
{
  "received": true
}
```

---

## Split Engine

### Internal API (not exposed)

The Split Engine is triggered automatically when:
1. Stripe checkout completes
2. Order payment is confirmed

**Process:**
```typescript
SplitEngine.processOrderSplit(orderId)
  ↓
1. Fetch order with items
2. Calculate splits for each item
3. Calculate shipping spread
4. Create ledger entries
5. Update wallet balances
6. Return split result
```

**Ledger Entry Categories:**
- `sales_revenue` - Customer payment
- `sales_margin` - Platform markup
- `merchant_payout` - Merchant receives
- `handling_fee` - Platform fixed fee
- `shipping_spread` - Carrier arbitrage
- `carrier_payout` - Carrier receives
- `platform_revenue` - Platform total
- `refund` - Refund transaction
- `adjustment` - Manual adjustment

---

## Error Codes

### Standard HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "details": {
    "field": "Specific validation error"
  },
  "code": "ERROR_CODE"
}
```

---

## Rate Limiting (Future)

All endpoints will be rate limited:

- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Webhooks**: No limit

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1618308000
```

---

## Versioning

API version is included in the URL:

```
/api/v1/merchants/onboard
/api/v2/merchants/onboard
```

Current version: **v1** (implicit, no version in URL)

---

## Testing

### Test Credentials

**Merchant:**
- Email: `test@goalsquad.shop`
- OTP: Check terminal output

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Example cURL Requests

**Onboard Merchant:**
```bash
curl -X POST http://localhost:3000/api/merchants/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "merchantName": "Test Store",
    "slug": "test-store",
    "email": "test@example.com",
    "phone": "+47 123 45 678",
    "addressLine1": "Street 123",
    "city": "Oslo",
    "postalCode": "0123",
    "country": "NO",
    "userId": "00000000-0000-0000-0000-000000000002",
    "verificationMethod": "otp_email"
  }'
```

**Create Product:**
```bash
curl -X POST http://localhost:3000/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "uuid",
    "name": "Test Product",
    "basePrice": 100,
    "retailPrice": 150,
    "weightGrams": 500,
    "lengthMm": 300,
    "widthMm": 200,
    "heightMm": 100
  }'
```

---

## SDK (Future)

TypeScript SDK coming soon:

```typescript
import { GoalSquad } from '@goalsquad/sdk'

const client = new GoalSquad({
  apiKey: 'your_api_key',
  environment: 'production'
})

// Onboard merchant
const merchant = await client.merchants.onboard({
  merchantName: 'My Store',
  slug: 'my-store',
  // ...
})

// Create product
const product = await client.products.create({
  merchantId: merchant.id,
  name: 'Product Name',
  // ...
})
```

---

## Support

For API questions:
- Email: dev@goalsquad.shop
- Docs: https://docs.goalsquad.shop
- Status: https://status.goalsquad.shop
