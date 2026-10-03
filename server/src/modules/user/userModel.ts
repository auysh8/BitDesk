// server/src/modules/user/user.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import appConfig from "../../config/config.js";
import { USER_ROLES, type UserRole } from "../../constants/roles.js";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  isVerified: boolean;
  isApproved: boolean;
  otpHash?: string | null;
  otpExpiresAt?: Date | null;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Prevents password from being returned in queries by default
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    otpHash: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate short-lived JWT Access Token
userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    appConfig.JWT_ACCESS_SECRET,
    {
      expiresIn: appConfig.JWT_ACCESS_EXPIRES_IN as any,
    },
  );
};

// Instance method to generate long-lived JWT Refresh Token
userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    {
      id: this._id,
    },
    appConfig.JWT_REFRESH_SECRET,
    {
      expiresIn: appConfig.JWT_REFRESH_EXPIRES_IN as any,
    },
  );
};

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
