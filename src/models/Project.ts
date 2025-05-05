import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allows multiple null values (for older records)
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
  // Whether the project is for sale or just for showcase
  forSale: {
    type: Boolean,
    default: true,
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

// Function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

// Update the timestamp and generate slug on save
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Generate slug from title if not already set
  if (this.title && (!this.slug || this.isModified('title'))) {
    const baseSlug = generateSlug(this.title);
    this.slug = baseSlug;
  }

  next();
});

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;