import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User Interface
 * Extends Mongoose Document to include MongoDB methods (_id, save, etc.)
 */
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  plan: 'free' | 'basic' | 'premium';
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema Definition
 * Defines the structure and validation rules for user documents
 */
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // Normalize to lowercase
      trim: true, // Remove whitespace
      match: [/.+@.+\..+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password in queries by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must not exceed 50 characters'],
    },
    plan: {
      type: String,
      enum: {
        values: ['free', 'basic', 'premium'],
        message: '{VALUE} is not a valid plan',
      },
      default: 'free',
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

/**
 * Indexes
 * Create index on email for fast lookups and enforce uniqueness
 */
userSchema.index({ email: 1 }, { unique: true });

/**
 * Pre-save Middleware
 * Hash password before saving to database
 * Only runs if password is new or modified
 */
userSchema.pre('save', async function (next) {
  // Only hash password if it's new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    // Cost factor of 10 balances security and performance
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Instance Method: Compare Password
 * Compares a candidate password with the hashed password
 * Used during login authentication
 *
 * @param candidatePassword - The password to verify
 * @returns Promise resolving to true if passwords match
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

/**
 * Instance Method: toJSON
 * Customize JSON serialization to exclude sensitive fields
 * Automatically called by res.json()
 */
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();

  // Remove sensitive/internal fields
  delete userObject.password;
  delete userObject.__v; // MongoDB version key

  return userObject;
};

/**
 * User Model
 * Export the compiled model
 */
const User = mongoose.model<IUser>('User', userSchema);

export default User;
