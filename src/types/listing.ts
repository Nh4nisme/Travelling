export type Listing = {
  id: string; title: string; city: string; country: string; region: 'Europe' | 'Asia' | 'Americas';
  category: 'Beach' | 'Mountain' | 'Camping'; type: 'Entire place' | 'Private room' | 'Dormitories';
  price: number; rating: number; reviews: number; bedrooms: number; images: string[]; facilities: string[]; desc: string;
};
