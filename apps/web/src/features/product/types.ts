export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  sold: number;
  category: string;
  isNew?: boolean;
};

export type Category = {
  id: string;
  name: string;
  image: string;
  count: number;
};

export type Faq = {
  question: string;
  answer: string;
};

export type Review = {
  name: string;
  product: string;
  rating: number;
  text: string;
};
