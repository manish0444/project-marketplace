import mongoose, { Schema, Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export interface IReview extends Document {
  projectId: ObjectId | string;
  userId: ObjectId | string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    }
  },
  { timestamps: true }
);

// Remove the unique index since it might be causing issues
// reviewSchema.index({ projectId: 1, userId: 1 }, { unique: true });

// Instead use a normal index for better query performance
reviewSchema.index({ projectId: 1, userId: 1 });

const Review = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);

export default Review;
