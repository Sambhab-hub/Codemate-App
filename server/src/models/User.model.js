'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model
 *
 * DESIGN DECISIONS:
 *
 * 1. passwordHash has select:false
 *    By default, Mongoose excludes this field from query results.
 *    This means User.findById(id) never accidentally returns the password hash.
 *    To include it: User.findById(id).select('+passwordHash')
 *    This prevents accidentally leaking the hash in an API response.
 *
 * 2. email is lowercase + trimmed
 *    "John@GMAIL.com" and "john@gmail.com" are the same email.
 *    Normalizing prevents duplicate accounts.
 *
 * 3. comparePassword is an instance method
 *    Called on a User document: user.comparePassword('enteredPassword')
 *    It hashes the entered password with bcrypt and compares to the stored hash.
 *    bcrypt's .compare() is timing-safe — it takes the same time whether the
 *    password is wrong on the first byte or the last, preventing timing attacks.
 *
 * 4. toPublicJSON hides sensitive fields
 *    Returns a plain object safe to send in API responses — no passwordHash,
 *    no internal __v version field.
 *
 * WHY BCRYPT?
 * Regular hashing (SHA256 etc.) is too fast — an attacker with a GPU can
 * try billions of hashes per second. bcrypt is deliberately SLOW. The saltRounds
 * (work factor) controls how slow. 12 means 2^12 iterations.
 * Even if your database leaks, bcrypt hashes are practically uncrackable.
 */
const SALT_ROUNDS = 12;

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    // select:false — excluded from all queries unless explicitly requested
    passwordHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  },
);

// ── Instance Methods ───────────────────────────────────────────────────────────

/**
 * Hash a plain-text password and store it.
 * Called before saving a new user or changing password.
 */
UserSchema.methods.setPassword = async function (plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compare a plain-text password against the stored hash.
 * Returns true if they match, false otherwise.
 * You must select '+passwordHash' before calling this method.
 */
UserSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * Return a safe public representation of the user — no passwordHash.
 */
UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
