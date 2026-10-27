import { u } from '@/data/images';
import type { Listing } from '@/types/listing';

const desc = 'Looking for the perfect place to relax and unwind? This stunning villa is the ultimate getaway. Located on a quiet street just minutes from the beach, this beautiful home offers everything you need for a luxurious and comfortable stay.';

const L = (id: string, title: string, city: string, country: string, region: Listing['region'], category: Listing['category'], type: Listing['type'], price: number, bedrooms: number, imgs: string[], facilities: string[]): Listing =>
  ({ id, title, city, country, region, category, type, price, rating: 5, reviews: 262, bedrooms, images: imgs.map(u), facilities, desc });

export const LISTINGS: Listing[] = [
  L('1', 'Apartment in Omaha', 'Omaha', 'USA', 'Americas', 'Beach', 'Entire place', 20, 1, ['1540541338287-41700207dee6', '1522708323590-d24dbb6b0267', '1505693416388-ac5ce068fe85'], ['Kitchen', 'Pool', 'Outdoor space', 'Internet access']),
  L('2', 'Apartment in San Jose', 'San Jose', 'USA', 'Americas', 'Beach', 'Entire place', 28, 1, ['1502672260266-1c1ef2d93688', '1505693416388-ac5ce068fe85', '1522708323590-d24dbb6b0267'], ['Kitchen', 'Gym', 'Internet access']),
  L('3', 'Apartment in Milwaukee', 'Milwaukee', 'USA', 'Americas', 'Beach', 'Private room', 20, 1, ['1505693416388-ac5ce068fe85', '1502672260266-1c1ef2d93688', '1540541338287-41700207dee6'], ['Kitchen', 'Internet access']),
  L('4', 'Balian treehouse', 'Bali', 'Indonesia', 'Asia', 'Beach', 'Entire place', 20, 1, ['1522708323590-d24dbb6b0267', '1537996194471-e657df975ab4', '1540541338287-41700207dee6'], ['Kitchen', 'Pool', 'Outdoor space', 'Internet access']),
  L('5', 'Alpine chalet', 'Chamonix', 'France', 'Europe', 'Mountain', 'Entire place', 120, 3, ['1518780664697-55e3ad937233', '1470071459604-3b5ec3a7fe05', '1505693416388-ac5ce068fe85'], ['Kitchen', 'Outdoor space', 'Internet access']),
  L('6', 'Cabin in the Dolomites', 'Cortina', 'Italy', 'Europe', 'Mountain', 'Private room', 75, 1, ['1449158743715-0a90ebb6d2d8', '1470071459604-3b5ec3a7fe05', '1502672260266-1c1ef2d93688'], ['Kitchen', 'Internet access']),
  L('7', 'Forest tent', 'Da Lat', 'Vietnam', 'Asia', 'Camping', 'Dormitories', 15, 1, ['1504280390367-361c6d9f38f4', '1478131143081-80f7f84ca84d', '1470071459604-3b5ec3a7fe05'], ['Outdoor space']),
  L('8', 'Lakeside camp', 'Banff', 'Canada', 'Americas', 'Camping', 'Entire place', 45, 1, ['1478131143081-80f7f84ca84d', '1504280390367-361c6d9f38f4', '1470071459604-3b5ec3a7fe05'], ['Outdoor space', 'Kitchen']),
];
