import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  images: {
    type: [String],
    required: [true, 'At least one image is required'],
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'At least one image URL is required',
    },
  },
  technologies: {
    type: [String],
    required: [true, 'At least one technology is required'],
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'At least one technology is required',
    },
  },
  projectType: {
    type: String,
    required: [true, 'Project type is required'],
    enum: ['Web Application', 'Mobile App', 'Desktop Application', 'Other'],
  },
  features: {
    type: [String],
    required: [true, 'At least one feature is required'],
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'At least one feature is required',
    },
  },
  demoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\//.test(v);
      },
      message: 'Demo URL must be a valid URL starting with http:// or https://',
    },
  },
  githubUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/github\.com\//.test(v);
      },
      message: 'GitHub URL must be a valid GitHub repository URL',
    },
  },
  // Project zip file for download after purchase
  projectFile: {
    type: String,
    trim: true,
  },
  // Payment QR code image
  paymentQrCode: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the timestamp on save
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;