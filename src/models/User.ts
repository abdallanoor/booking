import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUserDocument } from "@/types";
import { calculateProfileScore } from "@/lib/profile";

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["Guest", "Host", "Admin"],
      default: "Guest",
    },
    avatar: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },

    hasPassword: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // New Fields
    phoneNumber: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    nationalId: {
      type: String,
      required: false,
    },
    identityVerified: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    savedCards: {
      type: [
        {
          token: { type: String, required: true },
          last4: { type: String, required: true },
          brand: { type: String, required: true },
          mask: { type: String },
          createdAt: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
    bankDetails: {
      bankCode: { type: String, required: false },
      accountNumber: { type: String, required: false },
      iban: { type: String, required: false },
      fullName: { type: String, required: false },
    },
    // OTP fields for signup verification
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    pendingSignupData: {
      name: { type: String },
      password: { type: String }, // Pre-hashed password
      role: { type: String, enum: ["Guest", "Host"] },
    },
  },
  {
    timestamps: true,
    strict: false,
  },
);

// Hash password and validate before saving
userSchema.pre("save", async function () {
  // Allow saving without password if it's a pending signup with OTP
  if (this.pendingSignupData || this.otp) {
    if (!this.isModified("password")) {
      return;
    }
  }

  // Validation for local provider
  if (this.provider === "local") {
    // Skip checking password if it's a pending signup (checked above, but double safety)
    if (!this.password && this.isNew && !this.pendingSignupData && !this.otp) {
      // console.log("Password missing for new user", { otp: this.otp, pending: this.pendingSignupData });
      throw new Error("Password is required");
    }
    // Only check length if password is being modified
    if (
      this.isModified("password") &&
      this.password &&
      this.password.length < 6
    ) {
      throw new Error("Password must be at least 6 characters");
    }
  }

  // Update profileCompleted flag logic
  const score = calculateProfileScore(this);
  this.profileCompleted = score >= 100;

  // Check for skip hashing flag (used when transferring hashed password from pendingSignupData)
  if ((this as any)._skipHashing) {
    delete (this as any)._skipHashing;
    return;
  }

  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check profile completion based on action
userSchema.methods.checkProfileCompletion = function (
  action: "book" | "withdraw",
): boolean {
  const hasBasicInfo = !!(
    this.name &&
    this.email &&
    this.phoneNumber &&
    this.country
  );

  if (action === "book") {
    // Booking requires Basic Info + National ID
    // Credit Card is NOT required for profile completion check
    const hasBookingInfo = !!this.nationalId;

    return hasBasicInfo && hasBookingInfo;
  }

  if (action === "withdraw") {
    // Withdrawal requires Basic Info + National ID
    const hasHostInfo = !!this.nationalId;
    return hasBasicInfo && hasHostInfo;
  }

  return false;
};

// Indexes
// userSchema.index({ email: 1 }); // Removed to avoid duplicate index warning as unique:true already creates one
userSchema.index({ resetPasswordToken: 1 });

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);

export default User;
