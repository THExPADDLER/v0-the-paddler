# THE PADDLER Production Launch Checklist

Use this before the final domain switch.

## Vercel Environment Variables

Add these in Vercel Project Settings -> Environment Variables for Production.

### Firebase

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Razorpay

- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Use live keys only after Razorpay live activation is complete.

### Shiprocket

- `SHIPROCKET_EMAIL`
- `SHIPROCKET_PASSWORD`
- `SHIPROCKET_API_BASE_URL`
- `SHIPROCKET_PICKUP_LOCATION`
- `SHIPROCKET_PICKUP_POSTCODE`
- `SHIPROCKET_DEFAULT_WEIGHT_KG`
- `SHIPROCKET_DEFAULT_LENGTH_CM`
- `SHIPROCKET_DEFAULT_BREADTH_CM`
- `SHIPROCKET_DEFAULT_HEIGHT_CM`
- `SHIPROCKET_DEFAULT_COURIER_ID`
- `SHIPROCKET_RETURN_NAME`
- `SHIPROCKET_RETURN_ADDRESS`
- `SHIPROCKET_RETURN_ADDRESS_2`
- `SHIPROCKET_RETURN_CITY`
- `SHIPROCKET_RETURN_STATE`
- `SHIPROCKET_RETURN_PINCODE`
- `SHIPROCKET_RETURN_EMAIL`
- `SHIPROCKET_RETURN_PHONE`

### Email

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

### Legacy PhonePe

PhonePe checkout is disabled. Keep these unset unless old PhonePe orders must be verified/refunded.

- `PHONEPE_CLIENT_ID`
- `PHONEPE_CLIENT_SECRET`
- `PHONEPE_CLIENT_VERSION`
- `PHONEPE_API_BASE_URL`
- `PHONEPE_WEBHOOK_USERNAME`
- `PHONEPE_WEBHOOK_PASSWORD`

## Firebase Console

- Add `thepaddler.in` to Firebase Authentication authorized domains.
- Add `www.thepaddler.in` to Firebase Authentication authorized domains.
- Confirm Google sign-in provider is enabled.
- Confirm Firestore rules prevent customers from writing admin data, inventory, coupons, reports, and other users.
- Confirm Storage rules allow customers to upload only their own return images and allow admins/staff to manage product/banner assets.

## Vercel Domain Switch

- Add `thepaddler.in`.
- Add `www.thepaddler.in`.
- Point DNS records from the domain provider to Vercel.
- Redeploy after adding production environment variables.
- Confirm `https://thepaddler.in/robots.txt`.
- Confirm `https://thepaddler.in/sitemap.xml`.

## Final Smoke Test

- Homepage loads on mobile and desktop.
- Shop page loads products.
- Product detail page loads images, sizes, pincode estimate, cart, and wishlist.
- Checkout requires login and address.
- Razorpay test/live low-value payment succeeds.
- Thank-you page shows order ID and invoice download.
- Invoice opens and `DOWNLOAD / SAVE PDF` works.
- Orders page shows payment, invoice, cancellation, return, and tracking actions.
- Admin dashboard loads for admin/staff only.
- Admin order status moves forward only.
- Inventory deducts only after payment success.
- Shiprocket order is created after successful payment.
- Return request creates a return record and updates order state.
- `npm audit`, `npm run lint`, `npx tsc --noEmit --pretty false`, and `npm run build` all pass.
