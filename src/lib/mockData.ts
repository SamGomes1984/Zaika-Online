import cakeImage from "@/assets/product-cake.jpg";
import croissantImage from "@/assets/product-croissant.jpg";
import macaronsImage from "@/assets/product-macarons.jpg";
import cookiesImage from "@/assets/product-cookies.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  ingredients: string[];
  isNew?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Chocolate Berry Delight",
    price: 850,
    image: cakeImage,
    category: "Cakes",
    description:
      "Indulgent chocolate cake layered with fresh berries and cream. Perfect for celebrations and special moments.",
    ingredients: ["Premium Chocolate", "Fresh Berries", "Cream", "Flour", "Sugar", "Eggs"],
    isNew: true,
  },
  {
    id: "2",
    name: "Golden Butter Croissants",
    price: 180,
    image: croissantImage,
    category: "Pastries",
    description:
      "Flaky, buttery croissants baked to golden perfection. A French classic made with authentic techniques.",
    ingredients: ["Butter", "Flour", "Yeast", "Milk", "Salt", "Sugar"],
    isNew: false,
  },
  {
    id: "3",
    name: "Artisan Macarons Box",
    price: 450,
    image: macaronsImage,
    category: "Desserts",
    description:
      "Delicate French macarons in assorted flavors. Each piece is a perfect balance of crunch and cream.",
    ingredients: ["Almond Flour", "Sugar", "Egg Whites", "Natural Flavors", "Food Colors"],
    isNew: true,
  },
  {
    id: "4",
    name: "Classic Chocolate Chip Cookies",
    price: 220,
    image: cookiesImage,
    category: "Cookies",
    description:
      "Freshly baked cookies with generous chocolate chips. Soft, chewy, and absolutely irresistible.",
    ingredients: ["Flour", "Butter", "Chocolate Chips", "Brown Sugar", "Eggs", "Vanilla"],
    isNew: false,
  },
  {
    id: "5",
    name: "Red Velvet Cake",
    price: 920,
    image: cakeImage,
    category: "Cakes",
    description:
      "Classic red velvet cake with cream cheese frosting. A luxurious treat for any occasion.",
    ingredients: ["Cocoa Powder", "Red Velvet", "Cream Cheese", "Butter", "Sugar", "Flour"],
    isNew: false,
  },
  {
    id: "6",
    name: "Almond Croissants",
    price: 200,
    image: croissantImage,
    category: "Pastries",
    description:
      "Buttery croissants filled with sweet almond cream and topped with sliced almonds.",
    ingredients: ["Butter", "Almond Paste", "Flour", "Sugar", "Eggs", "Sliced Almonds"],
    isNew: true,
  },
];

export const categories = [
  "All",
  "Cakes",
  "Pastries",
  "Cookies",
  "Desserts",
  "Breads",
];

export interface CartItem extends Product {
  quantity: number;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Priya Sharma",
    rating: 5,
    comment:
      "The best bakery I've ever ordered from! The cakes are not just delicious but beautifully crafted. Highly recommend!",
    date: "2 weeks ago",
  },
  {
    id: "2",
    name: "Rajesh Kumar",
    rating: 5,
    comment:
      "Fresh, authentic, and absolutely delicious. The croissants remind me of my Paris trip. Worth every rupee!",
    date: "1 month ago",
  },
  {
    id: "3",
    name: "Anita Desai",
    rating: 5,
    comment:
      "Amazing quality and taste! My family loved the chocolate cake. Will definitely order again for special occasions.",
    date: "3 weeks ago",
  },
];
