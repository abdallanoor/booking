# Booking Application

A modern, full-stack property booking platform built with Next.js 16, MongoDB, and Tailwind CSS. This comprehensive application enables users to discover and book properties, manage wishlists, and become hosts to list their own properties. The platform includes role-based access control with Guest, Host, and Admin dashboards.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (via [Mongoose](https://mongoosejs.com/))
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Authentication:** Custom JWT Auth, Google OAuth 2.0
- **Payment Gateway:** Paymob (Unified Intention API)
- **Image Management:** Cloudinary
- **Email Service:** Nodemailer
- **UI Components:** React 19, Lucide Icons, Sonner (Toasts), React Day Picker, Embla Carousel
- **Validation:** Zod
- **Form Handling:** React Hook Form (via Radix UI)

## ✨ Key Features

### For Guests

- **Advanced Search & Filters:** Search listings by location, dates, guests, and property type
- **Interactive Booking System:** Select dates with an interactive calendar showing real-time availability
- **Secure Payments:** Integrated Paymob payment gateway supporting card payments
- **Booking Management:** View, track, and cancel bookings with payment status
- **Wishlists:** Save and organize favorite listings
- **Profile Management:** Complete profile with personal details, phone, and national ID
- **Email Verification:** Secure email verification system with resend functionality
- **Password Recovery:** Forgot password and reset password functionality

### For Hosts

- **Listing Management:** Create, edit, and delete property listings with detailed information
- **Image Upload:** Multi-image upload with Cloudinary integration
- **Booking Dashboard:** View and manage guest bookings
- **Revenue Tracking:** Monitor earnings and booking statistics
- **Bank Details:** Set up bank account information for payment withdrawals
- **Listing Analytics:** Track views, bookings, and revenue per listing
- **Approval System:** Listings require admin approval before going live

### For Admins

- **User Management:** View, manage, block/unblock users
- **Listing Approval:** Approve or reject new listing submissions
- **Booking Overview:** Monitor all platform bookings
- **Platform Statistics:** Dashboard with total users, listings, bookings, and revenue
- **Role Management:** Manage user roles (Guest, Host, Admin)

### Additional Features

- **Role-Based Access Control:** Three user roles with distinct permissions and dashboards
- **Responsive Design:** Fully optimized for mobile, tablet, and desktop
- **Dark Mode:** Theme toggle with system preference support
- **Real-time Availability:** Check listing availability before booking
- **Double Booking Prevention:** Automatic validation to prevent booking conflicts
- **Payment Webhooks:** Secure webhook handling for payment status updates
- **Profile Completion System:** Progressive profile completion for enhanced security
- **Become a Host:** Users can upgrade from Guest to Host role
- **Email Notifications:** Automated emails for verification, password reset, and bookings

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- MongoDB instance (local or Atlas)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/abdallanoor/booking.git
    cd booking
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add the following variables:

    ```env
    # Database
    MONGODB_URI=your_mongodb_connection_string

    # Authentication
    JWT_SECRET=your_jwt_secret_key

    # OAuth (Google)
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

    # Cloudinary
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # Email (Nodemailer)
    EMAIL_HOST=smtp.example.com
    EMAIL_PORT=587
    EMAIL_USER=your_email_user
    EMAIL_PASS=your_email_password
    EMAIL_FROM=noreply@yourdomain.com

    # Payment Gateway (Paymob)
    PAYMOB_SECRET_KEY=your_paymob_secret_key
    PAYMOB_API_KEY=your_paymob_api_key
    PAYMOB_PUBLIC_KEY=your_paymob_public_key
    PAYMOB_HMAC_SECRET=your_paymob_hmac_secret
    PAYMOB_INTEGRATION_ID=your_integration_id

    # App
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (admin)/             # Admin-only routes
│   │   └── admin/           # Admin dashboard, users, listings, bookings
│   ├── (auth)/              # Authentication routes
│   │   └── auth/            # Login, register, forgot/reset password
│   ├── (guest)/             # Guest user routes
│   │   ├── bookings/        # View bookings, payment results
│   │   ├── listings/        # Browse and view listings
│   │   ├── profile/         # User profile management
│   │   ├── search/          # Search listings
│   │   └── wishlist/        # Saved listings
│   ├── (host)/              # Host-only routes
│   │   └── hosting/         # Host dashboard, manage listings
│   └── api/                 # API routes
│       ├── auth/            # Authentication endpoints
│       ├── bookings/        # Booking management
│       ├── listings/        # Listing CRUD operations
│       ├── payments/        # Payment processing & webhooks
│       ├── search/          # Search functionality
│       └── wishlist/        # Wishlist operations
├── components/              # Reusable UI components
│   ├── auth/               # Authentication forms
│   ├── booking/            # Booking-related components
│   ├── hosting/            # Host dashboard components
│   ├── layout/             # Layout components (Header, Nav, etc.)
│   ├── listing/            # Listing cards and grids
│   ├── profile/            # Profile management components
│   ├── search/             # Search bar and filters
│   └── ui/                 # Reusable UI primitives (Radix UI)
├── contexts/               # React Context providers
├── lib/                    # Utility functions and configurations
│   ├── auth/              # Authentication utilities (JWT, middleware)
│   ├── email/             # Email templates and sender
│   ├── paymob/            # Payment gateway integration
│   └── validations/       # Zod validation schemas
├── models/                 # MongoDB/Mongoose models
│   ├── User.ts            # User model with roles
│   ├── Listing.ts         # Property listing model
│   ├── Booking.ts         # Booking model
│   ├── Payment.ts         # Payment transaction model
│   └── Wishlist.ts        # Wishlist model
├── services/              # Business logic layer
└── types/                 # TypeScript type definitions
```

## 🔐 User Roles & Permissions

### Guest (Default Role)

- Browse and search listings
- Make bookings and payments
- Manage personal profile
- Save listings to wishlist
- View booking history
- Upgrade to Host role

### Host

- All Guest permissions
- Create and manage property listings
- View and manage booking requests
- Access hosting dashboard with analytics
- Set up bank details for withdrawals
- Track earnings and revenue

### Admin

- Full platform access
- Manage all users (block/unblock)
- Approve or reject listing submissions
- View all bookings and transactions
- Access platform-wide statistics
- Manage user roles

## 💳 Payment System

The application uses **Paymob** payment gateway with the following features:

- **Secure Payment Processing:** PCI-compliant card payments
- **Payment Intentions:** Pre-authorized payment flow
- **Webhook Integration:** Real-time payment status updates
- **Multiple Payment States:** Pending, Paid, Failed, Refunded
- **Transaction Tracking:** Complete payment history with card details
- **Currency Support:** EGP (Egyptian Pound) by default
- **Payment Verification:** HMAC signature verification for webhooks

## 🔄 Booking Flow

1. **Search:** User searches for listings by location and dates
2. **Select:** User views listing details and checks availability
3. **Book:** User selects dates and number of guests
4. **Payment:** User is redirected to Paymob secure checkout
5. **Confirmation:** Upon successful payment, booking is confirmed
6. **Management:** User can view and manage bookings from dashboard

## 📧 Email Features

- Welcome email on registration
- Email verification with token
- Password reset emails
- Booking confirmations
- Payment receipts
- Listing approval/rejection notifications

## 🛡️ Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** bcrypt password encryption
- **Email Verification:** Required for account activation
- **Role-Based Access:** Protected routes based on user roles
- **HMAC Verification:** Webhook signature validation
- **Profile Completion:** Required for sensitive actions
- **Input Validation:** Zod schema validation on all inputs
- **MongoDB Injection Protection:** Mongoose sanitization
- **HTTP-Only Cookies:** Secure cookie storage for auth tokens
- **CORS Protection:** Configured for production environments

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `PUT /api/auth/update-password` - Update password (authenticated)
- `POST /api/auth/google` - Google OAuth authentication
- `POST /api/auth/become-host` - Upgrade to host role

### Listings

- `GET /api/listings` - Get all listings (with filters)
- `POST /api/listings` - Create listing (Host/Admin)
- `GET /api/listings/[id]` - Get listing by ID
- `PUT /api/listings/[id]` - Update listing (Host/Admin)
- `PATCH /api/listings/[id]` - Partial update (Admin for status)
- `DELETE /api/listings/[id]` - Delete listing (Host/Admin)
- `GET /api/listings/[id]/booked-dates` - Get booked dates

### Bookings

- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking (cancel)
- `POST /api/bookings/check-availability` - Check availability

### Payments

- `POST /api/payments/initiate` - Initiate payment
- `GET /api/payments/[id]` - Get payment details
- `POST /api/payments/webhook` - Paymob webhook handler

### Search

- `GET /api/search` - Search listings with filters

### Wishlist

- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist/[listingId]` - Add to wishlist
- `DELETE /api/wishlist/[listingId]` - Remove from wishlist

### Admin

- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/[id]` - Get user by ID
- `PATCH /api/admin/users/[id]` - Update user (block/unblock)

### Hosting

- `GET /api/hosting/stats` - Get host statistics

## 🚀 Deployment

### Prerequisites for Production

1. MongoDB Atlas cluster or production MongoDB instance
2. Cloudinary account for image hosting
3. Paymob merchant account with API credentials
4. SMTP server for email delivery
5. Google OAuth 2.0 credentials

### Environment Variables

Ensure all environment variables are set in your production environment. Refer to the `.env.local` example above.

### Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```
