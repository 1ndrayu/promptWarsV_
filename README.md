# Nexus Portal

Nexus Portal is a production-hardened, high-performance Event Management and Identity Verification system. Built with a "Material Minimalist" design philosophy, it provides a seamless, Google-inspired experience for both event attendees and administrators.

## 🚀 Features

- **Material Design UI**: Clean, accessible, and professional interface inspired by Google Workspace.
- **Secure Authentication**: Integrated with Firebase Auth supporting Google and Email/Password flows.
- **Dynamic Identity**: Real-time attendee dashboard with encrypted QR code generation.
- **Manager Command Center**: Advanced QR scanner (Nexus Lens) for instant identity verification and access control management.
- **Production-Ready**: Hardened with security headers, Zod schema validation, and structured Google Cloud Logging.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database/Auth**: [Firebase](https://firebase.google.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Logging**: Google Cloud Logging
- **Validation**: Zod

## 💻 Local Development

To run the project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/1ndrayu/nexus-portal.git
   cd nexus-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the portal.

## 🌐 Global Deployment & Production

To prepare the project for global production deployment (e.g., Google Cloud Run):

1. **Build the production bundle:**
   ```bash
   npm run build
   ```

2. **Run the production server:**
   ```bash
   npm start
   ```

### Deployment Strategy
This project is configured for **Google Cloud Run**. It includes a CI/CD pipeline via **Cloud Build** that automatically triggers a new deployment whenever changes are pushed to the `main` branch.

## 🔒 Security

- **CSP & Security Headers**: Implemented in `next.config.mjs` to mitigate XSS and clickjacking.
- **Zod Validation**: Strict schema enforcement for all data payloads.
- **Mock Fallback**: Safe build-time pre-rendering even when environment variables are restricted.

---