import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import env from '../../../configs/env.config.js';

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true, // Speeds up user identity lookup queries
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address.',
      ],
      index: true, // Critical for login and identification lookups
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false, // Prevents accidental password leaks in JSON responses
    },
    firstName: {
      type: String,
      required: [true, 'First name is required.'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required.'],
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: [
          'CUSTOMER',
          'PREMIUM_CUSTOMER',
          'SELLER',
          'VERIFIED_SELLER',
          'INVENTORY_MANAGER',
          'SUPPORT_AGENT',
          'ANALYTICS_MANAGER',
          'ADMIN',
          'SUPER_ADMIN',
        ],
        message: '{VALUE} is not a valid security role.',
      },
      default: 'CUSTOMER',
      index: true,
    },
    permissions: {
      type: [String],
      default: ['CREATE_ORDER', 'VIEW_PRODUCTS'], // Basic user scopes
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
      default: 'ACTIVE',
    },
    // Brute-force Prevention Logic
    failedLoginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true, // Generates createdAt and updatedAt automatically
    versionKey: false, // Disables unnecessary __v version variables
  }
);

// Virtual for fetching combined full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save lifecycle hook: Auto-hashes passwords on modifications
userSchema.pre('save', async function (next) {
  const user = this;

  // Only hash password if it was modified or is new
  if (!user.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(env.security.bcryptSaltRounds);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance Method: Safe comparison of candidate password with stored hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Since password is select: false, this.password must be populated
  if (!this.password) {
    throw new Error('Authentication comparison error: Stored password hash was not selected in query.');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Helper: Increments failed login count or locks account if limit reached
 */
userSchema.methods.handleFailedLogin = async function () {
  // If account is already locked and lock expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.failedLoginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.failedLoginAttempts += 1;
    // Lock for 1 hour if failed logins exceed 5 attempts
    if (this.failedLoginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 3600000); // 1 hour lock
    }
  }
  return this.save();
};

/**
 * Helper: Reset failed login tracking
 */
userSchema.methods.resetFailedAttempts = async function () {
  if (this.failedLoginAttempts === 0 && !this.lockUntil) {
    return this;
  }
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
