import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  provider: "local" | "google";
  googleId?: string;
  role: "Guest" | "Host" | "Admin";
  avatar?: string;
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
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
  return bcrypt.compare(candidatePassword, this.password);
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

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
