# Booking Application

A modern, full-stack property booking application built with Next.js 16, MongoDB, and Tailwind CSS. This platform allows users to browse properties, make bookings, manage wishlists, and even become hosts to list their own properties.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database:** MongoDB (via [Mongoose](https://mongoosejs.com/))
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), `class-variance-authority`
- **Authentication:** Custom JWT Auth, Google OAuth
- **Image Management:** Cloudinary
- **Emails:** Nodemailer
- **State/UI:** React 19, Lucide Icons, Sonner (Toasts), React Day Picker

## ✨ Key Features

- **Property Discovery:** Search and filter properties.
- **Booking System:** select dates and book properties using an interactive calendar.
- **User Authentication:** Secure login/signup with email or Google.
- **Host Dashboard:** Manage listings and view bookings.
- **Wishlists:** Save favorite properties for later.
- **Review System:** (Implied by typical booking apps) Leave reviews for properties.
- **Responsive Design:** Fully optimized for mobile and desktop.

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
    GOOGLE_CLIENT_ID=your_google_client_id

    # Cloudinary
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # Email (Nodemailer)
    SMTP_HOST=smtp.example.com
    SMTP_PORT=587
    SMTP_USER=your_email_user
    SMTP_PASSWORD=your_email_password
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `src/app`: Application routes and pages.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions and database connections.
- `src/models`: Mongoose models.
- `src/actions`: Server actions.
