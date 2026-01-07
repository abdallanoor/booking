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
    verificationToken: {
      type: String,
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
    creditCard: {
      lastFour: String,
      token: String,
      provider: String,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      routingNumber: String,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password and validate before saving
userSchema.pre("save", async function () {
  // Validation for local provider
  if (this.provider === "local") {
    if (!this.password && this.isNew) {
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

  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check profile completion based on action
userSchema.methods.checkProfileCompletion = function (
  action: "book" | "withdraw"
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
    // Withdrawal requires Basic Info + National ID + Bank Details
    // (Note: User prompt says "When a host tries to withdraw money, they must complete their profile.")
    // And schema diff lists bankDetails as "Required for hosts"
    const hasHostInfo = !!this.nationalId;
    const hasBankDetails = !!(
      this.bankDetails &&
      this.bankDetails.bankName &&
      this.bankDetails.accountNumber &&
      this.bankDetails.routingNumber
    );

    return hasBasicInfo && hasHostInfo && hasBankDetails;
  }

  return false;
};

// Indexes
// userSchema.index({ email: 1 }); // Removed to avoid duplicate index warning as unique:true already creates one
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

// Prevent Mongoose overwrite warning in development by checking if model exists
// In development, we want to overwrite the model to ensure schema changes are reflected
if (process.env.NODE_ENV === "development") {
  if (mongoose.models.User) {
    delete mongoose.models.User;
  }
}

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);

export default User;
