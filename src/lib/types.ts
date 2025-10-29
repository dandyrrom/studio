import type { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 'supplier' | 'client';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageDataUrl?: string; // Changed from imageUrl/imageHint
  supplierId: string;
  supplierName: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  // Note: If Order items include Product, ensure it also uses imageDataUrl
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    // Consider if you need image data in the order item itself
  }>;
  total: number;
  status: OrderStatus;
  createdAt: Date; // Keep as Date if handled correctly on fetch, otherwise consider storing as Timestamp or ISO string
  supplierId: string;
}