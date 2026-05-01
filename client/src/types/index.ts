export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  isActive?: boolean;
  isFeatured?: boolean;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export * from "./inventory";
export * from "./procurement";
export * from "./crm";
