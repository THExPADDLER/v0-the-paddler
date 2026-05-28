# THE PADDLER

THE PADDLER is a custom streetwear ecommerce platform built with Next.js, TypeScript, Firebase, Razorpay, and Shiprocket. The app covers the full customer journey from browsing products to checkout, payment confirmation, order tracking, invoices, returns, and admin operations.

## Current Status

The main website work is functional. The remaining production steps are primarily domain, live payment keys, final environment setup, and real-world courier/payment testing.

## Tech Stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Firebase Authentication and Cloud Firestore
- Razorpay payment gateway
- Shiprocket order creation and logistics sync
- Nodemailer SMTP email notifications
- Tailwind CSS and custom UI styling

## Core Customer Features

- Responsive landing page with animated hero, featured products, brand sections, and WhatsApp chat access
- Product listing, product detail page, multiple product images, image zoom, size selection, and delivery estimate
- Cart, wishlist, coupon application, and checkout flow
- Google login, email/password signup, password visibility toggle, re-enter password validation, and mobile OTP verification
- Saved addresses with landmark, city, state dropdown, pincode, and formatted `+91 XXXXX XXXXX` phone numbers
- Razorpay prepaid checkout with retry payment support
- Thank-you page after successful payment
- Customer order dashboard with invoice download, animated order timeline, cancellation rules, and return request flow
- Return request form with reason dropdown, description, and image upload

## Admin Features

- Admin dashboard with role-based access for admin, staff, and customer
- Product creation and editing with image upload support
- Product tags such as new arrival, bestseller, limited, and featured products
- Shared color-size inventory model so stock deducts across designs using the same color and size base
- Inventory page for stock visibility and updates
- Orders page with payment status, shipment status, invoice, cancellation, and order-status controls
- Forward-only order status flow: paid, processing, shipped, transit, delivered
- Order filtering by payment and shipment stage
- Returns management with unread request badge
- Coupon management with once-per-user coupon usage enforcement
- User management with registered users and ordered users separated
- Banner and homepage content management, including hero image slots and countdown controls
- Maintenance mode controls
- Download report flow with date range selection and PDF export

## Payment Flow

Razorpay is the active payment gateway.

1. Customer creates an order from checkout.
2. Razorpay payment is started from the client.
3. Payment success is verified through backend API routes.
4. Firestore order payment status is updated to success.
5. Inventory is deducted only after successful payment.
6. The customer is redirected to the thank-you page.
7. The order appears in the customer and admin order dashboards.

PhonePe is no longer part of the active checkout flow.

## Shiprocket Flow

Shiprocket is used for logistics order creation after successful payment.

1. The site creates a Shiprocket order after Razorpay success.
2. The Shiprocket order/shipment ID is saved in Firestore.
3. Courier partner selection and shipping action are handled manually inside the Shiprocket panel.
4. The website does not automatically mark an order as shipped when the Shiprocket order is created.
5. The admin order status chain controls what the customer sees.

Required environment variables are stored in `.env.local` locally and in Vercel Environment Variables for production.

## Environment Variables

Copy `.env.example` to `.env.local` for local development, then fill the values. Do not commit secrets.

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_API_BASE_URL=
SHIPROCKET_PICKUP_LOCATION=
SHIPROCKET_PICKUP_POSTCODE=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Firebase config values are public client configuration, but keeping them in environment variables makes local, Vercel, and future Firebase project changes safer to manage. Secret credentials must stay server-side only.

## Development

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Type-check before release:

```bash
npx tsc --noEmit --pretty false
```

Build for production:

```bash
npm run build
```

## Production Checklist

- Follow the detailed launch checklist in `docs/PRODUCTION_LAUNCH_CHECKLIST.md`.
- Add the final domain `thepaddler.in` and `www.thepaddler.in`
- Add the production domain to Firebase authorized domains
- Replace Razorpay test keys with live keys after Razorpay live approval
- Verify Razorpay webhook/signature flow in production
- Confirm Shiprocket credentials and pickup location in Vercel
- Redeploy after every environment variable change
- Place one real low-value test order
- Confirm Firestore order, invoice, inventory deduction, Shiprocket order creation, email notification, and customer order timeline

## Notes

- `.env.local` and runtime logs must not be committed.
- Admin-only actions must stay protected through role checks.
- Shiprocket AWB/courier selection is intentionally manual unless a default courier ID is configured later.
