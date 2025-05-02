import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  paymentProof: {
    type: String,
    required: [true, 'Payment proof is required'],
  },
  // Email to deliver the project to
  deliveryEmail: {
    type: String,
    required: [true, 'Delivery email is required'],
    match: [/^[\w-\.]+@gmail\.com$/, 'Please provide a valid Gmail address'],
  },
  // Admin feedback when rejecting
  feedback: {
    type: String,
  },
  // Admin who approved/rejected the purchase
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
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
purchaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);

export default Purchase;
