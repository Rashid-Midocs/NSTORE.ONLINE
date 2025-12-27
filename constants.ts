import { Category, Product, Vendor, Order, Review, UserProfile } from './types';

export const MOCK_USER: UserProfile = {
  id: 'u123',
  name: 'Ahmed Al-Kuwaiti',
  email: 'ahmed@nstore.online',
  phone: '+965 9000 1234',
  isSubscribed: true,
  joinDate: '2023-08-12',
  points: 450,
  avatar: 'https://i.pravatar.cc/150?u=u123'
};

export const VENDORS: Vendor[] = [
  { id: 'v1', name: 'Al-Ghanim Tech', rating: 4.8, location: 'Shuwaikh', joinedDate: '2023-01-15', totalSales: 15400, status: 'Active' },
  { id: 'v2', name: 'Kuwait Fashion Hub', rating: 4.5, location: 'Salmiya', joinedDate: '2023-03-22', totalSales: 8200, status: 'Active' },
  { id: 'v3', name: 'Industrial Pro', rating: 4.9, location: 'Ahmadi', joinedDate: '2023-05-10', totalSales: 21000, status: 'Active' },
  { id: 'v4', name: 'Digital Dreams', rating: 4.2, location: 'Hawally', joinedDate: '2023-06-05', totalSales: 4500, status: 'Active' },
];

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', userName: 'Faisal K.', rating: 5, comment: 'Excellent quality and fast delivery in Kuwait!', date: '2023-10-01' },
  { id: 'r2', userName: 'Muneera A.', rating: 4, comment: 'Very good product, but the box was slightly damaged.', date: '2023-10-05' },
];

export const CATEGORY_HIERARCHY: Record<Category, string[]> = {
  [Category.DIGITAL]: ['E-Books', 'Software', 'Gift Cards', 'Gaming Credits'],
  [Category.CLOTHING]: ['Men', 'Women', 'Kids', 'Accessories', 'Footwear'],
  [Category.HARDWARE]: ['Tools', 'Safety Gear', 'Fasteners', 'Power Tools'],
  [Category.ELECTRICAL]: ['Lighting', 'Cables', 'Pipes', 'Fixtures'],
  [Category.ELECTRONICS]: ['Smartphones', 'Laptops', 'Kitchen Appliances', 'TVs', 'Audio'],
  [Category.LIFESTYLE]: ['Home Decor', 'Furniture', 'Kitchenware', 'Gifts'],
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
    detailedDescription: 'Experience crystal clear visuals with our 55-inch 4K Ultra HD Smart TV.',
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v1', vendor: VENDORS[0], rating: 4.7, reviewCount: 128, isFeatured: true, stock: 10, sku: 'ELEC-TV-55', reviews: MOCK_REVIEWS
  },
  {
    id: 'p8',
    name: 'Noise Cancelling Headphones Pro',
    price: 85.000,
    discountPrice: 72.000,
    category: Category.ELECTRONICS,
    subcategory: 'Audio',
    description: 'Immersive sound with industry-leading noise cancellation.',
    detailedDescription: 'The ultimate audio companion for commuters and office workers.',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v1', vendor: VENDORS[0], rating: 4.9, reviewCount: 340, isFeatured: true, stock: 15, sku: 'ELEC-HEAD-PRO'
  },
  {
    id: 'p9',
    name: 'NSTORE Gift Card - 50 KD',
    price: 50.000,
    category: Category.DIGITAL,
    subcategory: 'Gift Cards',
    description: 'The perfect gift for any occasion.',
    detailedDescription: 'Instantly delivered to your email. Can be used for any product on NSTORE.',
    images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v4', vendor: VENDORS[3], rating: 5.0, reviewCount: 1200, isFeatured: true, stock: 999, sku: 'DIGI-GC-50'
  },
  {
    id: 'p10',
    name: 'Modern Velvet Armchair',
    price: 145.000,
    discountPrice: 110.000,
    category: Category.LIFESTYLE,
    subcategory: 'Furniture',
    description: 'Luxurious comfort for your living space.',
    detailedDescription: 'Ergonomically designed with high-quality velvet fabric and solid wood legs.',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v2', vendor: VENDORS[1], rating: 4.6, reviewCount: 28, isFeatured: true, stock: 4, sku: 'LIFE-CHAIR-VEL'
  },
  {
    id: 'p11',
    name: 'Smart Watch Series X',
    price: 65.000,
    category: Category.ELECTRONICS,
    subcategory: 'Smartphones',
    description: 'Track your health and stay connected.',
    detailedDescription: 'AMOLED display, heart rate monitor, sleep tracking, and 7-day battery life.',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v1', vendor: VENDORS[0], rating: 4.4, reviewCount: 89, isFeatured: false, stock: 25, sku: 'ELEC-WATCH-X'
  },
  {
    id: 'p15',
    name: 'Mechanical Gaming Keyboard',
    price: 35.000,
    discountPrice: 28.500,
    category: Category.ELECTRONICS,
    subcategory: 'Audio',
    description: 'RGB Backlit, Blue Switches for the perfect click.',
    detailedDescription: 'Experience precise gaming and comfortable typing with our high-grade mechanical keyboard.',
    images: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v1', vendor: VENDORS[0], rating: 4.8, reviewCount: 45, isFeatured: true, stock: 20, sku: 'ELEC-KB-RGB'
  },
  {
    id: 'p16',
    name: 'Organic Cotton Summer Tee',
    price: 12.000,
    category: Category.CLOTHING,
    subcategory: 'Men',
    description: 'Breathable, eco-friendly cotton for Kuwaiti summers.',
    detailedDescription: '100% GOTS certified organic cotton, available in multiple shades.',
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v2', vendor: VENDORS[1], rating: 4.5, reviewCount: 82, isFeatured: false, stock: 50, sku: 'CLOTH-TEE-ORG'
  },
  {
    id: 'p17',
    name: 'Pro DSLR Camera Body',
    price: 450.000,
    discountPrice: 410.000,
    category: Category.ELECTRONICS,
    subcategory: 'TVs',
    description: 'Capture life in stunning high resolution.',
    detailedDescription: 'Full-frame sensor with incredible low-light performance and 4K video capabilities.',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v1', vendor: VENDORS[0], rating: 4.9, reviewCount: 15, isFeatured: true, stock: 3, sku: 'ELEC-CAM-PRO'
  },
  {
    id: 'p18',
    name: 'Electric Power Drill 18V',
    price: 48.000,
    category: Category.HARDWARE,
    subcategory: 'Power Tools',
    description: 'Heavy-duty performance for any construction job.',
    detailedDescription: 'Brushless motor with 2.0Ah battery pack and fast charger included.',
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v3', vendor: VENDORS[2], rating: 4.7, reviewCount: 64, isFeatured: false, stock: 12, sku: 'HARD-DRILL-18V'
  },
  {
    id: 'p13',
    name: 'Essential Home Tool Kit',
    price: 45.000,
    category: Category.HARDWARE,
    subcategory: 'Tools',
    description: '150 pieces for all your DIY needs.',
    detailedDescription: 'Includes hammer, screwdrivers, pliers, wrench, and more in a durable case.',
    images: ['https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v3', vendor: VENDORS[2], rating: 4.5, reviewCount: 230, isFeatured: false, stock: 40, sku: 'HARD-TOOL-KIT'
  },
  {
    id: 'p14',
    name: 'Designer Leather Wallet',
    price: 18.000,
    category: Category.CLOTHING,
    subcategory: 'Accessories',
    description: 'Genuine leather with RFID protection.',
    detailedDescription: 'Slim design with space for 8 cards and cash. Hand-stitched for durability.',
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=800&auto=format&fit=crop'],
    vendorId: 'v2', vendor: VENDORS[1], rating: 4.7, reviewCount: 412, isFeatured: false, stock: 100, sku: 'CLOTH-WALL-LTH'
  }
];

export const HERO_SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
    title: 'Summer Fashion Drop',
    subtitle: 'Up to 50% OFF on the hottest apparel trends in Kuwait.',
    cta: 'Explore Now',
    category: Category.CLOTHING
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?q=80&w=1600&auto=format&fit=crop',
    title: 'Future Tech is Here',
    subtitle: 'Upgrade your digital lifestyle with high-end gadgets.',
    cta: 'Shop Electronics',
    category: Category.ELECTRONICS
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=1600&auto=format&fit=crop',
    title: 'Premium Home Living',
    subtitle: 'Exquisite furniture pieces designed for comfort and class.',
    cta: 'View Collection',
    category: Category.LIFESTYLE
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
    customer: { fullName: 'Ahmed Al-Kuwaiti', email: 'ahmed@nstore.online', phone: '90001234', address: 'Block 4', area: 'Salmiya' },
    items: [
      { ...PRODUCTS[0], quantity: 1 },
    ]
  }
];