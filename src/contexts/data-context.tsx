export type Barber = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
  services: Service[];
  isFavorite?: boolean;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  isFavorite?: boolean;
}; 