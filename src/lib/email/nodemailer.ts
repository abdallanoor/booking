import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
import { formatDate } from "@/lib/utils";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  console.warn("Email configuration is missing. Email sending will fail.");
}

// Create transporter lazily
function getTransporter() {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Booking Platform" <${EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #000;
              color: #fff!;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Verify Your Email Address</h1>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    // console.log("Verification email sent to:", email);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Booking Platform" <${EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #000;
              color: #fff;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset Your Password</h1>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <div class="footer">
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    // console.log("Password reset email sent to:", email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: {
    listingTitle: string;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
    transactionId: string;
  }
) {
  const mailOptions = {
    from: `"Booking Platform" <${EMAIL_USER}>`,
    to: email,
    subject: "Booking Confirmed! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              margin: 0;
              padding: 0;
              background-color: #f4f7f6;
            }
            .wrapper {
              width: 100%;
              table-layout: fixed;
              background-color: #f4f7f6;
              padding-bottom: 40px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              margin-top: 40px;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .header {
              background-color: #000000;
              color: #ffffff;
              padding: 40px 20px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 10px;
              display: block;
            }
            h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            p {
              margin: 0 0 20px 0;
              color: #4a4a4a;
            }
            .booking-details {
              background-color: #f9f9f9;
              border: 1px solid #e5e5e5;
              border-radius: 8px;
              padding: 24px;
              margin: 30px 0;
            }
            .listing-title {
              font-size: 20px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 20px;
              display: block;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
            }
            .info-table td {
              padding: 12px 0;
              border-bottom: 1px solid #eeeeee;
            }
            .info-table tr:last-child td {
              border-bottom: none;
            }
            .label {
              font-size: 13px;
              color: #888888;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
            }
            .value {
              font-size: 15px;
              color: #1a1a1a;
              font-weight: 500;
              text-align: right;
            }
            .total-row td {
              padding-top: 20px;
              border-bottom: none !important;
            }
            .total-label {
              font-size: 18px;
              font-weight: 700;
              color: #1a1a1a;
            }
            .total-value {
              font-size: 24px;
              font-weight: 800;
              color: #000000;
              text-align: right;
            }
            .btn {
              display: block;
              background-color: #000000;
              color: #ffffff !important;
              text-decoration: none;
              text-align: center;
              padding: 16px 20px;
              border-radius: 8px;
              font-weight: 600;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 13px;
              color: #999999;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <div class="success-icon">✔️</div>
                <h1>Booking Confirmed</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>Your reservation has been successfully confirmed. We've received your payment and everything is set for your stay.</p>
                
                <div class="booking-details">
                  <span class="listing-title">${
                    bookingDetails.listingTitle
                  }</span>
                  
                  <table class="info-table">
                    <tr>
                      <td class="label">Check-in</td>
                      <td class="value">${formatDate(
                        bookingDetails.checkIn,
                        "full"
                      )}</td>
                    </tr>
                    <tr>
                      <td class="label">Check-out</td>
                      <td class="value">${formatDate(
                        bookingDetails.checkOut,
                        "full"
                      )}</td>
                    </tr>
                    <tr>
                      <td class="label">Transaction ID</td>
                      <td class="value">${bookingDetails.transactionId}</td>
                    </tr>
                    <tr class="total-row">
                      <td class="total-label">Total Paid</td>
                      <td class="total-value">EGP ${bookingDetails.totalPrice.toLocaleString()}</td>
                    </tr>
                  </table>
                </div>

                <p>You can manage your booking and see more details by logging into your dashboard.</p>
                
                <a href="${APP_URL}/bookings" class="btn">View Booking Details</a>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Booking Platform. All rights reserved.</p>
                <p>If you have any questions, please contact our support.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    // console.log("Booking confirmation email sent to:", email);
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    throw new Error("Failed to send booking confirmation email");
  }
}

export async function sendPaymentFailedEmail(
  email: string,
  bookingDetails: {
    listingTitle: string;
    checkIn: Date;
    checkOut: Date;
    errorMessage?: string;
  }
) {
  const mailOptions = {
    from: `"Booking Platform" <${EMAIL_USER}>`,
    to: email,
    subject: "Payment Failed - Action Required",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 2px solid #ef4444;
              margin-bottom: 20px;
            }
            .error-badge {
              display: inline-block;
              background-color: #ef4444;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 14px;
              margin-bottom: 10px;
            }
            .booking-card {
              background-color: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #000;
              color: #fff;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="error-badge">Payment Failed</span>
              <h1>Your Payment Could Not Be Processed</h1>
            </div>
            
            <p>Unfortunately, we were unable to process your payment for the following booking:</p>
            
            <div class="booking-card">
              <h2 style="margin-top: 0;">${bookingDetails.listingTitle}</h2>
              <p><strong>Check-in:</strong> ${formatDate(
                bookingDetails.checkIn,
                "full"
              )}</p>
              <p><strong>Check-out:</strong> ${formatDate(
                bookingDetails.checkOut,
                "full"
              )}</p>
              ${
                bookingDetails.errorMessage
                  ? `<p><strong>Reason:</strong> ${bookingDetails.errorMessage}</p>`
                  : ""
              }
            </div>
            
            <p>Please try again with a different payment method or contact your bank if the issue persists.</p>
            
            <a href="${APP_URL}/bookings" class="button">View Your Bookings</a>
            
            <div class="footer">
              <p>If you need assistance, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    // console.log("Payment failed email sent to:", email);
  } catch (error) {
    console.error("Error sending payment failed email:", error);
    throw new Error("Failed to send payment failed email");
  }
}

export async function sendReviewInvitationEmail(
  email: string,
  reviewDetails: {
    listingTitle: string;
    listingId: string;
    guestName: string;
  }
) {
  const reviewUrl = `${APP_URL}/listings/${reviewDetails.listingId}?review=true`;

  const mailOptions = {
    from: `"Booking Platform" <${EMAIL_USER}>`,
    to: email,
    subject: "Share Your Experience - Leave a Review",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              margin: 0;
              padding: 0;
              background-color: #f4f7f6;
            }
            .wrapper {
              width: 100%;
              table-layout: fixed;
              background-color: #f4f7f6;
              padding-bottom: 40px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              margin-top: 40px;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .header {
              background-color: #000000;
              color: #ffffff;
              padding: 40px 20px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            p {
              margin: 0 0 20px 0;
              color: #4a4a4a;
            }
            .listing-title {
              font-size: 20px;
              font-weight: 700;
              color: #1a1a1a;
              margin: 20px 0;
            }
            .btn {
              display: inline-block;
              background-color: #000000;
              color: #ffffff !important;
              text-decoration: none;
              text-align: center;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 13px;
              color: #999999;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Share Your Experience</h1>
              </div>
              <div class="content">
                <p>Hello ${reviewDetails.guestName},</p>
                <p>We hope you had a wonderful stay! Your feedback helps other travelers make informed decisions and helps our hosts improve their listings.</p>
                
                <div class="listing-title">${reviewDetails.listingTitle}</div>
                
                <p>Please take a moment to share your experience by leaving a review. Your opinion matters!</p>
                
                <div style="text-align: center;">
                  <a href="${reviewUrl}" class="btn">Leave a Review</a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  Or copy and paste this link into your browser:<br>
                  <span style="word-break: break-all; color: #000;">${reviewUrl}</span>
                </p>
                
                <div class="footer">
                  <p>Thank you for being part of our community!</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    // console.log("Review invitation email sent to:", email);
  } catch (error) {
    console.error("Error sending review invitation email:", error);
    throw new Error("Failed to send review invitation email");
  }
}

export async function sendQuestionReplyEmail(
  email: string,
  replyDetails: {
    listingTitle: string;
    question: string;
    answer: string;
    listingId: string;
  }
) {
  const listingUrl = `${APP_URL}/listings/${replyDetails.listingId}`;

  const mailOptions = {
    from: `"Booking Platform" <${EMAIL_USER}>`,
    to: email,
    subject: "New Answer to Your Question",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              margin: 0;
              padding: 0;
              background-color: #f4f7f6;
            }
            .wrapper {
              width: 100%;
              table-layout: fixed;
              background-color: #f4f7f6;
              padding-bottom: 40px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              margin-top: 40px;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .header {
              background-color: #000000;
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 700;
            }
            .qa-box {
              background-color: #f9f9f9;
              border: 1px solid #e5e5e5;
              border-radius: 8px;
              padding: 24px;
              margin: 20px 0;
            }
            .question {
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 10px;
            }
            .answer {
              color: #4a4a4a;
              padding-top: 10px;
              border-top: 1px dashed #cccccc;
            }
            .label {
              font-size: 12px;
              color: #888888;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
              display: block;
            }
            .btn {
              display: block;
              background-color: #000000;
              color: #ffffff !important;
              text-decoration: none;
              text-align: center;
              padding: 14px 24px;
              border-radius: 8px;
              font-weight: 600;
              margin-top: 25px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 13px;
              color: #999999;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>New Answer Received</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>The host has answered your question about <strong>${
                  replyDetails.listingTitle
                }</strong>.</p>
                
                <div class="qa-box">
                  <span class="label">Your Question</span>
                  <div class="question">"${replyDetails.question}"</div>
                  
                  <br>
                  
                  <span class="label">Host Answer</span>
                  <div class="answer">"${replyDetails.answer}"</div>
                </div>

                <a href="${listingUrl}" class="btn">View Listing</a>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Booking Platform. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    // console.log("Question reply email sent to:", email);
  } catch (error) {
    console.error("Error sending question reply email:", error);
  }
}
