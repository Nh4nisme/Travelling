const express = require('express');
const Listing = require('../models/Listing');

const router = express.Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (_req, res, next) => {
  try {
    const listings = await Listing.find().sort({ id: 1 }).lean();
    res.json(listings.map(({ _id, ...listing }) => listing));
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const minPrice = req.query.minPrice === undefined ? 0 : Number(req.query.minPrice);
    const maxPrice = req.query.maxPrice === undefined ? Number.MAX_SAFE_INTEGER : Number(req.query.maxPrice);
    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || minPrice < 0 || maxPrice < minPrice) {
      return res.status(400).json({ message: 'Invalid price range' });
    }

    const query = {};
    const term = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const region = typeof req.query.region === 'string' ? req.query.region : '';
    if (term) {
      const matcher = new RegExp(escapeRegex(term), 'i');
      query.$or = [{ title: matcher }, { city: matcher }, { country: matcher }];
    }
    if (region && region !== 'Anywhere') query.region = region;
    if (typeof req.query.category === 'string' && req.query.category) query.category = req.query.category;
    query.price = { $gte: minPrice, $lte: maxPrice };

    const types = typeof req.query.types === 'string' ? req.query.types.split(',').filter(Boolean) : [];
    const facilities = typeof req.query.facilities === 'string' ? req.query.facilities.split(',').filter(Boolean) : [];
    if (types.length) query.type = { $in: types };
    if (facilities.length) query.facilities = { $all: facilities };

    const listings = await Listing.find(query).sort({ id: 1 }).lean();
    res.json(listings.map(({ _id, ...listing }) => listing));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ id: req.params.id }).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    const { _id, ...result } = listing;
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
