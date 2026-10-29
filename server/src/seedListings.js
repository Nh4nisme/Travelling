require('./config/loadEnv');
const mongoose = require('mongoose');
const Listing = require('./models/Listing');
const listings = require('./data/listings.json');

async function seedListings() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const operations = listings.map((listing) => ({
    updateOne: {
      filter: { id: listing.id },
      update: { $set: listing },
      upsert: true,
    },
  }));
  const result = await Listing.bulkWrite(operations);
  console.log(`Seeded ${listings.length} listings (${result.upsertedCount} inserted, ${result.modifiedCount} updated).`);
}

seedListings()
  .catch(() => {
    console.error('Listing seed failed. Verify MONGODB_URI, Atlas network access, and database credentials.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
