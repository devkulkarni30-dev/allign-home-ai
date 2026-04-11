import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String },
  contact: { type: String },
  picture: { type: String },
  isAdmin: { type: Boolean, default: false },
  subscription: {
    plan: { type: String, default: 'basic' },
    usage: {
      single: { type: Number, default: 0 },
      compare: { type: Number, default: 0 },
      live: { type: Number, default: 0 }
    }
  },
  preferences: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);

const PropertySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String },
  type: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Property = mongoose.model('Property', PropertySchema);

const ReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  name: { type: String, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  preview: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Report = mongoose.model('Report', ReportSchema);

const FeedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String },
  email: { type: String },
  rating: { type: Number, required: true },
  category: { type: String, required: true },
  comment: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Feedback = mongoose.model('Feedback', FeedbackSchema);
