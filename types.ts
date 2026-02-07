
export interface ProductImage {
  id: string;
  url: string;
  order: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  categoryId: string;
  images: ProductImage[];
  isFeatured: boolean;
  createdAt: number;
}

export interface CartItem extends Product {
  quantity: number;
}
