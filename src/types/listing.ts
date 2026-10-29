export type Listing = {
  id: string; title: string; city: string; country: string; region: 'Europe' | 'Asia' | 'Americas';
  category: 'Beach' | 'Mountain' | 'Camping'; type: 'Entire place' | 'Private room' | 'Dormitories';
  price: number; rating: number; reviews: number; reviewItems: ListingReview[]; bedrooms: number; beds: number; baths: number; maxGuests: number; images: string[]; facilities: string[]; desc: string;
  checkInTime: string; checkOutTime: string; checkInPolicy: string;
};

export type ListingReview = { name: string; stars: number; text: string; avatar: number };
