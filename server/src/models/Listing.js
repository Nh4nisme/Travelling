const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    avatar: { type: Number, required: true },
  },
  { _id: false },
);

const listingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    region: { type: String, required: true, enum: ['Europe', 'Asia', 'Americas'] },
    category: { type: String, required: true, enum: ['Beach', 'Mountain', 'Camping'] },
    type: { type: String, required: true, enum: ['Entire place', 'Private room', 'Dormitories'] },
    price: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviews: { type: Number, required: true, min: 0 },
    reviewItems: { type: [reviewSchema], default: [] },
    bedrooms: { type: Number, required: true, min: 0 },
    beds: { type: Number, required: true, min: 0 },
    baths: { type: Number, required: true, min: 0 },
    maxGuests: { type: Number, required: true, min: 1 },
    images: { type: [String], required: true },
    facilities: { type: [String], default: [] },
    desc: { type: String, required: true },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String, required: true },
    checkInPolicy: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('Listing', listingSchema);
