export enum Category {
  DIGITAL = 'Digital Products',
  CLOTHING = 'Clothing & Apparels',
  HARDWARE = 'Hardware & Accessories',
  ELECTRICAL = 'Electrical & Plumbing',
  ELECTRONICS = 'Electronics & Home Appliances'
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Vendor {
  id: string;
  name: string;
  rating: number;
  location: string;
  joinedDate: string;
  totalSales: number;
  email?: string;
  status: 'Active' | 'Pending' | 'Suspended';
}

export interface VendorApplication {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  appliedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Product {
  id: string;
  name: string;
  price: number; // In KD
  discountPrice?: number;
  category: Category;
  subcategory: string;
  description: string;
  detailedDescription: string;
  images: string[];
  vendorId: string;
  vendor: Vendor;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  stock: number;
  sku: string;
  reviews?: Review[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface FilterState {
  category: string | null;
  subcategories: string[];
  minPrice: number;
  maxPrice: number;
  vendorIds: string[];
  search: string;
}

export interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  area: string;
}

export type PaymentMethod = 'KNET' | 'CASH';

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  date: string;
  estimatedDelivery?: string;
  total: number;
  status: OrderStatus;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  customer: UserDetails;
}