import mongoose, { Schema, Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export interface IView extends Document {
  projectId: ObjectId | string;
  deviceId: string;
  createdAt: Date;
  updatedAt: Date;
}

const viewSchema = new Schema<IView>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required']
    },
    deviceId: {
      type: String,
      required: [true, 'Device ID is required']
    }
  },
  { timestamps: true }
);

// Prevent duplicate views from the same device for the same project within 24 hours
viewSchema.index({ projectId: 1, deviceId: 1 }, { unique: true });

// Create a TTL index to automatically delete views after 30 days
viewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const View = mongoose.models.View || mongoose.model<IView>('View', viewSchema);

export default View;
