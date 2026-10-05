# swiftSMM - Vercel & Firebase Deployment Guide

This guide covers end-to-end deployment of **swiftSMM** to Vercel with Google Firebase Firestore backend.

---

## 1. Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Enter your project name: `swiftsmm-production` (or your preferred name).
4. (Optional) Enable Google Analytics and click **Create Project**.

---

## 2. Create Firestore Database
1. In your Firebase console sidebar, navigate to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a location closest to your target audience (e.g., `asia-south1` for Mumbai / India).
4. Select **Start in production mode** (we will deploy our secure security rules).
5. Click **Enable**.

---

## 3. Register Web App & Get Firebase Credentials
1. In Project Overview, click the **Web icon (</>)** to register a web app.
2. Enter app nickname: `swiftSMM Web`.
3. Click **Register app**.
4. You will see a `firebaseConfig` object with:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## 4. Configure Firebase Security Rules
1. In Firebase Console, go to **Firestore Database > Rules**.
2. Copy the contents of the `firestore.rules` file in this repository:
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /plans/{planId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /offers/{offerId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /settings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /orders/{orderId} {
      allow create: if request.resource.data.customerName is string
                    && request.resource.data.mobileNumber is string
                    && request.resource.data.amount is number
                    && request.resource.data.targetUrl is string;
      allow read: if true;
      allow update, delete: if request.auth != null && request.auth.token.admin == true;
    }
    match /supportTickets/{ticketId} {
      allow create: if request.resource.data.customerName is string
                    && request.resource.data.mobileNumber is string
                    && request.resource.data.message is string;
      allow read, update, delete: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```
3. Click **Publish**.

---

## 5. Add Environment Variables on Vercel
When importing your repository into Vercel, go to **Settings > Environment Variables** and add:

| Variable Name | Value | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-app.firebaseapp.com` | Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-app.appspot.com` | Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789...` | Sender ID |
| `VITE_FIREBASE_APP_ID` | `1:123...:web:...` | Web App ID |
| `VITE_ADMIN_PASSWORD` | `skaliop80` | Password required to unlock Admin panel |
| `ADMIN_PASSWORD` | `skaliop80` | Server-side admin secret |

---

## 6. Configure Payment Gateway (Razorpay / Cashfree / UPI)
- Enter your payment gateway key IDs in Vercel environment variables:
  - `PAYMENT_GATEWAY_KEY_ID`: Your merchant key id
  - `PAYMENT_SECRET_KEY`: Your private merchant secret (never exposed to client)
- The application includes an automated and interactive payment sheet supporting Google Pay, PhonePe, Paytm, and cards.

---

## 7. Deploy to Vercel
1. Push your code to your GitHub / GitLab repository.
2. In [Vercel Dashboard](https://vercel.com/), click **Add New > Project**.
3. Select your repository.
4. Framework Preset: **Vite** (Build command: `npm run build`, Output directory: `dist`).
5. Ensure environment variables from Step 5 are added.
6. Click **Deploy**.

---

## 8. Add Custom Domain
1. In Vercel Project Settings > **Domains**.
2. Add your custom domain (e.g., `swiftsmm.com` or `panel.yourbrand.com`).
3. Point your DNS A / CNAME records as directed by Vercel.
4. SSL certificates are generated automatically.

---

## 9. Test Admin Panel & Catalog Control
1. Open `https://your-domain.com/#admin` (or click Admin Panel from hamburger menu).
2. Enter password: `skaliop80`.
3. Try:
   - Adding or editing a Category image URL.
   - Adjusting prices on a plan (e.g. 1K Instagram Followers).
   - Toggling banner visibility.
   - Saving and verifying immediate reflect on customer view!

---

## 10. Test Customer Checkout & Order Tracking
1. Open the homepage on your mobile phone or browser.
2. Select **Instagram > Followers**.
3. Choose a plan and click to open checkout.
4. Enter Name, Mobile Number, and Instagram link.
5. Proceed to payment and complete checkout.
6. Notice the instant celebratory confirmation screen with `#SWF...` ID and 24-hour completion notification.
7. Go to **Orders** tab, enter exact Name + Mobile Number, and view the live processing order.
8. Open Admin Panel > Orders > Mark order as **Completed** with delivery note.
9. Check customer tracking page to verify status changed to **Completed** with note!
