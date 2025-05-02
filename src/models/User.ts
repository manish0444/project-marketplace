import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: false, // Changed to false to allow creating users without passwords for reviews
    validate: {
      validator: function(v: string | undefined) {
        // Skip validation if password is not provided (for temp users created for reviews)
        if (!v) return true;
        // Otherwise check length
        return v.length >= 6;
      },
      message: 'Password must be at least 6 characters long'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  const user = this as unknown as IUser;
  if (!user.isModified('password') || !user.password) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcryptjs.genSalt(10);
    // Hash password
    const hashedPassword = await bcryptjs.hash(user.password, salt);
    // Replace plain text password with hashed password
    user.password = hashedPassword;
    next();
  } catch (error: any) {
    return next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // If the user has no password (temp user for reviews), always return false
    if (!this.password) return false;
    
    return await bcryptjs.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;