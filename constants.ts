
import { Category, Product, Vendor, Order, Review } from './types';

// Added status property to VENDORS to satisfy type requirement as defined in types.ts
export const VENDORS: Vendor[] = [
  { id: 'v1', name: 'Al-Ghanim Tech', rating: 4.8, location: 'Shuwaikh', joinedDate: '2023-01-15', totalSales: 15400, status: 'Active' },
  { id: 'v2', name: 'Kuwait Fashion Hub', rating: 4.5, location: 'Salmiya', joinedDate: '2023-03-22', totalSales: 8200, status: 'Active' },
  { id: 'v3', name: 'Industrial Pro', rating: 4.9, location: 'Ahmadi', joinedDate: '2023-05-10', totalSales: 21000, status: 'Active' },
  { id: 'v4', name: 'Digital Dreams', rating: 4.2, location: 'Hawally', joinedDate: '2023-06-05', totalSales: 4500, status: 'Active' },
];

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', userName: 'Faisal K.', rating: 5, comment: 'Excellent quality and fast delivery in Kuwait!', date: '2023-10-01' },
  { id: 'r2', userName: 'Muneera A.', rating: 4, comment: 'Very good product, but the box was slightly damaged.', date: '2023-10-05' },
  { id: 'r3', userName: 'Hamad S.', rating: 5, comment: 'Best price I found for this model. Recommended!', date: '2023-10-10' },
];

export const CATEGORY_HIERARCHY: Record<Category, string[]> = {
  [Category.DIGITAL]: ['E-Books', 'Software', 'Gift Cards'],
  [Category.CLOTHING]: ['Men', 'Women', 'Kids', 'Accessories'],
  [Category.HARDWARE]: ['Tools', 'Safety Gear', 'Fasteners'],
  [Category.ELECTRICAL]: ['Lighting', 'Cables', 'Pipes', 'Fixtures'],
  [Category.ELECTRONICS]: ['Smartphones', 'Laptops', 'Kitchen Appliances', 'TVs'],
};

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Ultra HD Smart TV 55"',
    price: 120.000,
    discountPrice: 99.900,
    category: Category.ELECTRONICS,
    subcategory: 'TVs',
    description: 'Cinematic experience with 4K resolution and smart features.',
    detailedDescription: 'Experience crystal clear visuals with our 55-inch 4K Ultra HD Smart TV. Features include built-in Netflix, YouTube, 3 HDMI ports, and voice control remote.',
    images: ['https://picsum.photos/seed/tv1/800/800', 'https://picsum.photos/seed/tv2/800/800', 'https://picsum.photos/seed/tv3/800/800'],
    vendorId: 'v1',
    vendor: VENDORS[0],
    rating: 4.7,
    reviewCount: 128,
    isFeatured: true,
    stock: 0, // Set to 0 to demonstrate "Out of Stock" feature
    sku: 'ELEC-TV-55',
    reviews: MOCK_REVIEWS
  },
  {
    id: 'p2',
    name: 'Pro Laptop 16GB RAM',
    price: 450.000,
    category: Category.ELECTRONICS,
    subcategory: 'Laptops',
    description: 'High performance laptop for professionals.',
    detailedDescription: 'Powered by the latest i7 processor, this laptop handles heavy multitasking with ease. 16GB RAM, 512GB SSD.',
    images: ['https://picsum.photos/seed/laptop1/800/800', 'https://picsum.photos/seed/laptop2/800/800'],
    vendorId: 'v1',
    vendor: VENDORS[0],
    rating: 4.9,
    reviewCount: 56,
    isFeatured: true,
    stock: 5,
    sku: 'ELEC-LAP-PRO',
    reviews: [MOCK_REVIEWS[0]]
  },
  {
    id: 'p3',
    name: 'Premium Cotton T-Shirt',
    price: 8.500,
    discountPrice: 5.000,
    category: Category.CLOTHING,
    subcategory: 'Men',
    description: 'Soft, breathable cotton perfect for summer.',
    detailedDescription: '100% Organic Cotton. Pre-shrunk fabric to ensure a perfect fit after washing.',
    images: ['https://picsum.photos/seed/shirt1/800/800', 'https://picsum.photos/seed/shirt2/800/800'],
    vendorId: 'v2',
    vendor: VENDORS[1],
    rating: 4.3,
    reviewCount: 200,
    stock: 50,
    sku: 'CLOTH-TSHIRT-M',
    reviews: [MOCK_REVIEWS[1]]
  },
  {
    id: 'p4',
    name: 'Designer Summer Dress',
    price: 25.000,
    category: Category.CLOTHING,
    subcategory: 'Women',
    description: 'Elegant floral print dress.',
    detailedDescription: 'Lightweight chiffon material with a beautiful floral pattern.',
    images: ['https://picsum.photos/seed/dress1/800/800'],
    vendorId: 'v2',
    vendor: VENDORS[1],
    rating: 4.6,
    reviewCount: 45,
    isFeatured: true,
    stock: 12,
    sku: 'CLOTH-DRESS-W',
    reviews: [MOCK_REVIEWS[2]]
  },
  {
    id: 'p5',
    name: 'Cordless Power Drill Set',
    price: 35.000,
    discountPrice: 28.500,
    category: Category.HARDWARE,
    subcategory: 'Tools',
    description: 'Heavy duty drill with 2 batteries included.',
    detailedDescription: '18V Cordless Drill with 2-speed transmission. Includes carrying case.',
    images: ['https://picsum.photos/seed/drill1/800/800', 'https://picsum.photos/seed/drill2/800/800'],
    vendorId: 'v3',
    vendor: VENDORS[2],
    rating: 4.8,
    reviewCount: 89,
    stock: 20,
    sku: 'HARD-DRILL-18V',
    reviews: MOCK_REVIEWS
  },
  {
    id: 'p6',
    name: 'Smart LED Bulb (RGB)',
    price: 4.500,
    category: Category.ELECTRICAL,
    subcategory: 'Lighting',
    description: 'WiFi enabled color changing bulb.',
    detailedDescription: 'Control your lights from anywhere with the mobile app.',
    images: ['https://picsum.photos/seed/bulb1/800/800'],
    vendorId: 'v3',
    vendor: VENDORS[2],
    rating: 4.4,
    reviewCount: 310,
    stock: 100,
    sku: 'ELEC-BULB-RGB',
    reviews: [MOCK_REVIEWS[0]]
  },
  {
    id: 'p7',
    name: 'Antivirus Software License (1 Year)',
    price: 10.000,
    discountPrice: 7.500,
    category: Category.DIGITAL,
    subcategory: 'Software',
    description: 'Total protection for your PC and Mobile.',
    detailedDescription: 'Instant delivery via email. Protects against malware and phishing.',
    images: ['https://picsum.photos/seed/soft1/800/800'],
    vendorId: 'v4',
    vendor: VENDORS[3],
    rating: 4.9,
    reviewCount: 500,
    stock: 999,
    sku: 'DIGI-AV-1Y',
    reviews: MOCK_REVIEWS
  }
];

export const HERO_SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
    title: 'Summer Collection Sale',
    subtitle: 'Up to 50% OFF on Apparel',
    cta: 'Shop Now',
    category: Category.CLOTHING
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?q=80&w=1600&auto=format&fit=crop',
    title: 'Next Gen Electronics',
    subtitle: 'Upgrade your home today',
    cta: 'Explore',
    category: Category.ELECTRONICS
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=1600&auto=format&fit=crop',
    title: 'Professional Tools',
    subtitle: 'Build with confidence',
    cta: 'View Deals',
    category: Category.HARDWARE
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-9921',
    date: '2023-10-25',
    estimatedDelivery: '2023-10-28',
    total: 107.500,
    status: 'Delivered',
    paymentMethod: 'KNET',
    customer: { fullName: 'Ali Al-Salem', email: 'ali@example.com', phone: '99999999', address: 'Block 4', area: 'Salmiya' },
    items: [
      { ...PRODUCTS[0], quantity: 1 },
      { ...PRODUCTS[5], quantity: 2 }
    ]
  },
  {
    id: 'ORD-9922',
    date: '2023-10-26',
    estimatedDelivery: '2023-10-29',
    total: 28.500,
    status: 'Processing',
    paymentMethod: 'CASH',
    customer: { fullName: 'Sarah Ahmed', email: 'sarah@example.com', phone: '98888888', address: 'Street 20', area: 'Hawally' },
    items: [
      { ...PRODUCTS[4], quantity: 1 }
    ]
  },
  {
    id: 'ORD-9923',
    date: '2023-10-27',
    estimatedDelivery: '2023-10-30',
    total: 7.500,
    status: 'Pending',
    paymentMethod: 'KNET',
    customer: { fullName: 'John Doe', email: 'john@example.com', phone: '55555555', address: 'Tower A', area: 'Kuwait City' },
    items: [
      { ...PRODUCTS[6], quantity: 1 }
    ]
  }
];
