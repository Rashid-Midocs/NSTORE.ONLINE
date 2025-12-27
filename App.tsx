
import React, { useState, useEffect, useMemo, Component, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, useSearchParams, Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Package, Star, ShoppingCart, ChevronRight, ChevronLeft, 
  Filter, Check, Store, Search, Menu, X, User, 
  ArrowRight, Heart, RefreshCw, AlertCircle, Sparkles, TrendingUp,
  MapPin, Clock, Truck, ShieldCheck, Minus, Plus, Trash2, Maximize2,
  LayoutDashboard, PlusCircle, LogOut, PieChart, Users, ShoppingBag, 
  CreditCard, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { FilterState, Category, Product, CartItem, Order, Review, Vendor, VendorApplication } from './types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORY_HIERARCHY, VENDORS as INITIAL_VENDORS, HERO_SLIDES, MOCK_ORDERS } from './constants';

// --- Contexts ---

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface StoreContextType {
  products: Product[];
  vendors: Vendor[];
  applications: VendorApplication[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  applyAsVendor: (app: Omit<VendorApplication, 'id' | 'appliedAt' | 'status'>) => void;
  approveApplication: (appId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};

// --- Providers ---

const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('nstore_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS.map(v => ({...v, status: 'Active'})));
  
  const [applications, setApplications] = useState<VendorApplication[]>(() => {
    const saved = localStorage.getItem('nstore_apps');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nstore_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('nstore_apps', JSON.stringify(applications));
  }, [applications]);

  const addProduct = (product: Product) => setProducts(prev => [product, ...prev]);
  const removeProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  
  const applyAsVendor = (appData: Omit<VendorApplication, 'id' | 'appliedAt' | 'status'>) => {
    const newApp: VendorApplication = {
      ...appData,
      id: `APP-${Math.floor(Math.random() * 9000) + 1000}`,
      appliedAt: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setApplications(prev => [newApp, ...prev]);
  };

  const approveApplication = (appId: string) => {
    setApplications(prev => prev.map(app => app.id === appId ? {...app, status: 'Approved'} : app));
    const app = applications.find(a => a.id === appId);
    if (app) {
      const newVendor: Vendor = {
        id: `v${vendors.length + 1}`,
        name: app.businessName,
        rating: 5.0,
        location: app.location,
        joinedDate: new Date().toISOString().split('T')[0],
        totalSales: 0,
        email: app.email,
        status: 'Active'
      };
      setVendors(prev => [...prev, newVendor]);
    }
  };

  return (
    <StoreContext.Provider value={{ products, vendors, applications, addProduct, removeProduct, applyAsVendor, approveApplication }}>
      {children}
    </StoreContext.Provider>
  );
};

const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('nstore_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nstore_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };
  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.discountPrice || item.price) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

// --- Error Boundary ---
interface ErrorBoundaryProps { children?: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

// Fixed: Inherit from Component<ErrorBoundaryProps, ErrorBoundaryState> to ensure 'this.props' is properly typed.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
          <AlertCircle size={64} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <button onClick={() => window.location.reload()} className="bg-brand-500 text-white px-6 py-2 rounded-xl font-bold">Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Common Components ---

const Breadcrumbs: React.FC<{ items: { label: string; path: string }[] }> = ({ items }) => (
  <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">
    <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
    {items.map((item, idx) => (
      <React.Fragment key={idx}>
        <ChevronRight size={12} className="text-gray-300" />
        <Link to={item.path} className={`transition-colors ${idx === items.length - 1 ? 'text-gray-900' : 'hover:text-brand-500'}`}>{item.label}</Link>
      </React.Fragment>
    ))}
  </nav>
);

const ImageModal = ({ images, initialIndex, onClose }: { images: string[], initialIndex: number, onClose: () => void }) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(false);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg animate-fade-in">
      <button onClick={onClose} className="absolute top-8 right-8 text-white hover:text-brand-500 transition-colors p-2 z-[110]"><X size={32} /></button>
      <div className="relative w-full max-w-5xl px-4 flex flex-col items-center">
        <div className={`relative overflow-hidden rounded-2xl bg-white transition-all duration-500 ${zoom ? 'cursor-zoom-out scale-110' : 'cursor-zoom-in scale-100'}`} onClick={() => setZoom(!zoom)}>
          <img src={images[index]} className="max-h-[70vh] w-auto object-contain" alt="Product view" />
        </div>
        <div className="flex gap-4 mt-8">
          {images.map((img, i) => (
            <button key={i} onClick={() => { setIndex(i); setZoom(false); }} className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === index ? 'border-brand-500 scale-110 shadow-lg' : 'border-white/10 opacity-50'}`}>
              <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
            </button>
          ))}
        </div>
        <div className="absolute inset-y-0 left-4 right-4 flex justify-between items-center pointer-events-none">
          <button disabled={index === 0} onClick={() => setIndex(prev => Math.max(0, prev - 1))} className="pointer-events-auto w-12 h-12 rounded-full bg-white/10 hover:bg-white text-white hover:text-gray-900 flex items-center justify-center transition-all disabled:opacity-0"><ChevronLeft size={24} /></button>
          <button disabled={index === images.length - 1} onClick={() => setIndex(prev => Math.min(images.length - 1, prev + 1))} className="pointer-events-auto w-12 h-12 rounded-full bg-white/10 hover:bg-white text-white hover:text-gray-900 flex items-center justify-center transition-all disabled:opacity-0"><ChevronRight size={24} /></button>
        </div>
      </div>
    </div>
  );
};

// --- Navbar Component ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();
  const [showNavDropdown, setShowNavDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 py-3 shadow-sm' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-brand-500 p-2 rounded-xl group-hover:rotate-6 transition-transform shadow-lg shadow-brand-500/20">
            <Package className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter text-gray-900">
            NSTORE<span className="text-brand-500">.ONLINE</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          <Link to="/products" className="text-sm font-bold text-gray-600 hover:text-brand-500 transition-colors uppercase tracking-widest">Catalog</Link>
          <Link to="/track" className="text-sm font-bold text-gray-600 hover:text-brand-500 transition-colors uppercase tracking-widest">Track Order</Link>
          <Link to="/register-vendor" className="text-sm font-bold text-brand-500 hover:text-brand-700 transition-colors uppercase tracking-widest flex items-center gap-2">
             <Store size={14} /> Sell with Us
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onMouseEnter={() => setShowNavDropdown(true)}
              onMouseLeave={() => setShowNavDropdown(false)}
              className="p-2.5 rounded-full hover:bg-gray-100 transition-all text-gray-600"
            >
              <LayoutDashboard size={22} />
            </button>
            {showNavDropdown && (
              <div 
                onMouseEnter={() => setShowNavDropdown(true)}
                onMouseLeave={() => setShowNavDropdown(false)}
                className="absolute right-0 top-full pt-2 w-48 animate-fade-in"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex flex-col gap-1">
                  <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors">
                    <PieChart size={16} /> Dashboard
                  </Link>
                  <Link to="/dashboard/add-product" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-gray-600 transition-colors">
                    <PlusCircle size={16} /> Add Product
                  </Link>
                </div>
              </div>
            )}
          </div>
          <Link to="/cart" className="relative p-2.5 rounded-full hover:bg-gray-100 transition-all">
            <ShoppingCart size={22} className="text-gray-600" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 bg-brand-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                {totalItems}
              </span>
            )}
          </Link>
          <Link to="/products" className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-black hover:bg-brand-500 transition-all shadow-xl active:scale-95">
            SHOP NOW
          </Link>
        </div>
      </div>
    </header>
  );
};

// --- Page Components ---

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group bg-white rounded-3xl p-4 border border-gray-100 hover:border-brand-100 hover:shadow-2xl hover:shadow-brand-500/5 transition-all duration-500 flex flex-col h-full ${isOutOfStock ? 'opacity-80' : ''}`}
    >
      <div onClick={() => navigate(`/products/${product.id}`)} className="relative aspect-square rounded-2xl bg-gray-50 overflow-hidden flex items-center justify-center mb-6 cursor-pointer">
        <img src={product.images[0]} alt={product.name} loading="lazy" className={`object-contain w-3/4 h-3/4 mix-blend-multiply transition-transform duration-700 ${isHovered && !isOutOfStock ? 'scale-110' : 'scale-100'} ${isOutOfStock ? 'grayscale' : ''}`} />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-gray-900 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-2xl">Sold Out</span>
          </div>
        )}
        {product.discountPrice && !isOutOfStock && <div className="absolute top-4 left-4 bg-brand-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg z-10">Sale</div>}
        <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 z-10"><Heart size={18} /></button>
      </div>
      <div className="flex-1 flex flex-col px-2">
        <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1">{product.category}</span>
        <h3 onClick={() => navigate(`/products/${product.id}`)} className={`font-bold text-gray-900 text-lg line-clamp-2 mb-2 transition-colors cursor-pointer ${!isOutOfStock ? 'group-hover:text-brand-500' : ''}`}>{product.name}</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-600 px-2 py-0.5 rounded-lg border border-yellow-400/20">
            <Star size={12} className="fill-current" />
            <span className="text-xs font-black">{product.rating.toFixed(1)}</span>
          </div>
          <span className="text-xs font-bold text-gray-400 tracking-tight">{product.reviewCount} Reviews</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="flex flex-col">
            {product.discountPrice ? (
              <>
                <span className="text-xs text-gray-400 line-through">KD {product.price.toFixed(3)}</span>
                <span className="text-xl font-black text-gray-900">KD {product.discountPrice.toFixed(3)}</span>
              </>
            ) : (
              <span className="text-xl font-black text-gray-900">KD {product.price.toFixed(3)}</span>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} disabled={isOutOfStock} className={`p-3 rounded-2xl transition-all shadow-lg active:scale-95 ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gray-900 text-white hover:bg-brand-500'}`}>
            {isOutOfStock ? <Package size={20} /> : <ShoppingCart size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

const VendorRegistrationPage = () => {
  const { applyAsVendor } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    category: Category.ELECTRONICS,
    location: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyAsVendor(formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pt-48 pb-24 container mx-auto px-6 max-w-2xl text-center">
        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Check size={48} strokeWidth={3} />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-4">Application Received!</h1>
        <p className="text-gray-500 font-bold mb-10">Our team will review your details and contact you within 24-48 hours via email.</p>
        <button onClick={() => navigate('/')} className="bg-brand-500 text-white px-10 py-4 rounded-3xl font-black tracking-widest text-sm shadow-xl active:scale-95">RETURN HOME</button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-16 text-center">
          <span className="inline-block bg-brand-500 text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-6">Become a Partner</span>
          <h1 className="text-6xl font-black tracking-tighter text-gray-900 leading-none">Open Your Store at NSTORE</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Business Name</label>
            <input required type="text" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="e.g. Al-Fayhaa Electronics" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Contact Person</label>
            <input required type="text" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} placeholder="e.g. Abdullah Ahmed" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Email Address</label>
            <input required type="email" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="business@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Phone Number</label>
            <input required type="tel" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+965 1234 5678" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Main Category</label>
            <select className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Store Location (Kuwait)</label>
            <input required type="text" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Shuwaikh Industrial" />
          </div>
          <div className="md:col-span-2 pt-8">
            <button type="submit" className="w-full h-20 bg-gray-900 text-white rounded-[2rem] font-black tracking-[0.2em] text-sm hover:bg-brand-500 transition-all shadow-xl active:scale-95">SUBMIT APPLICATION</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const { products, vendors, applications, removeProduct, approveApplication } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'vendors' | 'applications'>('overview');
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Sales', value: 'KD 42,500', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Orders', value: '1,240', icon: ShoppingBag, color: 'text-brand-500', bg: 'bg-brand-50' },
    { label: 'Active Vendors', value: vendors.length, icon: Store, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Products', value: products.length, icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900">Platform Dashboard</h1>
            <p className="text-gray-500 font-bold">Welcome back, Administrator</p>
          </div>
          <button onClick={() => navigate('/dashboard/add-product')} className="bg-brand-500 text-white px-8 py-4 rounded-3xl font-black tracking-widest text-sm flex items-center gap-2 shadow-xl shadow-brand-500/20 active:scale-95">
            <PlusCircle size={20} /> ADD NEW PRODUCT
          </button>
        </div>

        <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
          {['overview', 'products', 'vendors', 'applications'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-12 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map(stat => (
                <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <stat.icon size={28} />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</h4>
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100">
                  <h3 className="text-2xl font-black tracking-tighter mb-8">Recent Applications</h3>
                  <div className="space-y-6">
                    {applications.slice(0, 3).map(app => (
                      <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="font-bold text-gray-900">{app.businessName}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase">{app.category}</p>
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${app.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                    {applications.length === 0 && <p className="text-gray-400 font-bold text-center py-8">No applications found.</p>}
                  </div>
               </div>
               <div className="bg-gray-900 p-10 rounded-[3rem] text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                  <h3 className="text-2xl font-black tracking-tighter mb-4">Platform Performance</h3>
                  <p className="text-gray-400 font-bold text-sm mb-8 leading-relaxed">Sales have increased by 15% this week. Popular category is Electronics.</p>
                  <button onClick={() => setActiveTab('products')} className="text-brand-500 font-black tracking-widest text-xs uppercase hover:underline">View Analytics Report</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[3.5rem] border border-gray-100 overflow-hidden shadow-sm animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Stock</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <img src={p.images[0]} className="w-12 h-12 rounded-xl object-contain bg-gray-50 p-2" alt="" />
                          <div><p className="font-black text-gray-900 line-clamp-1">{p.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.sku}</p></div>
                        </div>
                      </td>
                      <td className="px-10 py-6"><span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{p.category}</span></td>
                      <td className="px-10 py-6 font-black text-gray-900">KD {p.price.toFixed(3)}</td>
                      <td className="px-10 py-6"><span className={`text-xs font-black ${p.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{p.stock} units</span></td>
                      <td className="px-10 py-6 text-right">
                         <button onClick={() => removeProduct(p.id)} className="p-3 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {applications.map(app => (
              <div key={app.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-brand-500"><Store size={32} /></div>
                  <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest ${app.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' : app.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {app.status}
                  </span>
                </div>
                <h3 className="text-2xl font-black tracking-tighter text-gray-900 mb-2">{app.businessName}</h3>
                <p className="text-gray-500 font-bold mb-8">{app.category} • {app.location}</p>
                <div className="space-y-2 mb-10 pt-6 border-t border-gray-50">
                   <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">Contact</span><span className="text-gray-900">{app.contactName}</span></div>
                   <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">Email</span><span className="text-gray-900">{app.email}</span></div>
                   <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">Applied</span><span className="text-gray-900">{app.appliedAt}</span></div>
                </div>
                {app.status === 'Pending' && (
                  <button onClick={() => approveApplication(app.id)} className="mt-auto w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-500 transition-all active:scale-95">APPROVE VENDOR</button>
                )}
              </div>
            ))}
            {applications.length === 0 && <div className="md:col-span-2 text-center py-24 bg-white rounded-[3rem] text-gray-400 font-bold">No applications currently pending.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

const AddProductPage = () => {
  const { addProduct, vendors } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    discountPrice: undefined,
    category: Category.ELECTRONICS,
    subcategory: '',
    description: '',
    detailedDescription: '',
    images: [''],
    vendorId: vendors[0]?.id || 'v1',
    stock: 1,
    sku: '',
    rating: 5,
    reviewCount: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === formData.vendorId) || vendors[0];
    const newProduct: Product = {
      ...(formData as any),
      id: `p${Math.floor(Math.random() * 9000) + 1000}`,
      vendor,
      images: formData.images?.filter(img => img.trim() !== '') || []
    };
    addProduct(newProduct);
    navigate('/dashboard');
  };

  const addImageField = () => setFormData({...formData, images: [...(formData.images || []), '']});

  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 max-w-5xl">
        <Breadcrumbs items={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Add Product', path: '/dashboard/add-product' }]} />
        <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-12">New Listing</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Product Name</label>
              <input required type="text" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. RTX 4090 Graphics Card" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Category</label>
              <select className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})}>
                {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Subcategory</label>
              <input required type="text" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})} placeholder="e.g. Components" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Base Price (KD)</label>
              <input required type="number" step="0.001" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Discount Price (Optional)</label>
              <input type="number" step="0.001" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.discountPrice || ''} onChange={e => setFormData({...formData, discountPrice: e.target.value ? parseFloat(e.target.value) : undefined})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Stock Level</label>
              <input required type="number" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">SKU / ID</label>
              <input required type="text" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. COMP-RTX4090" />
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tighter">Product Media</h3>
              <button type="button" onClick={addImageField} className="text-[10px] font-black uppercase tracking-widest text-brand-500 hover:underline flex items-center gap-1"><Plus size={14} /> Add Another URL</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.images?.map((img, i) => (
                <div key={i} className="space-y-4">
                   <div className="relative group">
                      <ImageIcon className="absolute left-6 top-6 text-gray-300 pointer-events-none" size={20} />
                      <input type="url" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] pl-16 pr-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" value={img} onChange={e => {
                        const newImages = [...(formData.images || [])];
                        newImages[i] = e.target.value;
                        setFormData({...formData, images: newImages});
                      }} placeholder="https://image-url.com/photo.jpg" />
                   </div>
                   {img && (
                     <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center p-4 border border-gray-100"><img src={img} className="max-h-full object-contain mix-blend-multiply" alt="Preview" /></div>
                   )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-2xl font-black tracking-tighter">Descriptions</h3>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Short Tagline</label>
               <input required type="text" className="w-full h-16 bg-gray-50 border-none rounded-[1.5rem] px-6 font-bold transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Short catchphrase for the listing" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Detailed Specifications</label>
               <textarea rows={6} className="w-full bg-gray-50 border-none rounded-[1.5rem] p-6 font-bold transition-all" value={formData.detailedDescription} onChange={e => setFormData({...formData, detailedDescription: e.target.value})} placeholder="Technical details, features, dimensions..." />
            </div>
          </div>

          <button type="submit" className="w-full h-24 bg-gray-900 text-white rounded-[2.5rem] font-black tracking-[0.2em] text-lg hover:bg-brand-500 transition-all shadow-2xl active:scale-95">PUBLISH LISTING</button>
        </form>
      </div>
    </div>
  );
};

const HomePage = () => {
  const { products } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);
  const [showShopMenu, setShowShopMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(s => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-fade-in-up">
      <section className="relative h-[90vh] min-h-[600px] overflow-hidden bg-gray-900">
        {HERO_SLIDES.map((slide, idx) => (
          <div key={slide.id} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/40 to-transparent z-10"></div>
            <img src={slide.image} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 z-20 container mx-auto px-10 flex flex-col justify-center">
              <div className="max-w-2xl">
                <span className="inline-block bg-brand-500 text-white text-xs font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-6">{slide.category} Exclusive</span>
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none mb-6">{slide.title}</h1>
                <p className="text-xl text-gray-300 font-medium mb-10">{slide.subtitle}</p>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative">
                    <button 
                      onMouseEnter={() => setShowShopMenu(true)}
                      onMouseLeave={() => setShowShopMenu(false)}
                      className="bg-brand-500 text-white px-10 py-5 rounded-3xl font-black tracking-widest text-sm hover:bg-white hover:text-gray-900 transition-all shadow-2xl flex items-center gap-3 group"
                    >
                      {slide.cta.toUpperCase()} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    {showShopMenu && (
                      <div 
                        onMouseEnter={() => setShowShopMenu(true)}
                        onMouseLeave={() => setShowShopMenu(false)}
                        className="absolute left-0 top-full pt-4 w-64 animate-fade-in-up"
                      >
                         <div className="bg-white rounded-[2rem] shadow-3xl p-3 flex flex-col gap-1 border border-gray-100">
                           {Object.keys(CATEGORY_HIERARCHY).map(cat => (
                             <Link key={cat} to={`/products?category=${cat}`} className="px-5 py-3 rounded-2xl hover:bg-gray-50 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-brand-500 transition-colors">{cat.split(' ')[0]}</Link>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                  <Link to="/products" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-3xl font-black tracking-widest text-sm hover:bg-white/20 transition-all">VIEW CATALOG</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="bg-gray-50 border-y border-gray-100 py-10 overflow-hidden relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...INITIAL_VENDORS, ...INITIAL_VENDORS].map((v, i) => (
            <div key={i} className="flex items-center gap-4 mx-12 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-default">
              <Store className="text-gray-400" size={32} />
              <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase">{v.name}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div>
              <div className="flex items-center gap-2 text-brand-500 font-black tracking-widest text-xs uppercase mb-4"><TrendingUp size={16} /><span>Trending Now</span></div>
              <h2 className="text-5xl font-black tracking-tighter text-gray-900">Featured Releases</h2>
            </div>
            <Link to="/products" className="group flex items-center gap-2 text-lg font-black tracking-tighter text-gray-900 border-b-4 border-brand-500 pb-1 hover:text-brand-500 transition-colors">Explore All Products <ArrowRight className="group-hover:translate-x-2 transition-transform" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-12 text-center uppercase">Popular Departments</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.keys(CATEGORY_HIERARCHY).slice(0, 3).map((cat, idx) => (
              <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`} className="group relative h-96 rounded-[3rem] overflow-hidden shadow-2xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent z-10"></div>
                <img src={`https://picsum.photos/seed/${cat}/800/1200`} loading="lazy" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                <div className="absolute bottom-10 left-10 z-20">
                  <span className="text-brand-500 font-black tracking-widest text-xs uppercase mb-2 block">Level 0{idx + 1}</span>
                  <h3 className="text-3xl font-black text-white tracking-tighter mb-4">{cat}</h3>
                  <div className="flex items-center gap-2 text-white font-bold text-sm bg-white/20 backdrop-blur-md px-5 py-2 rounded-full w-fit group-hover:bg-brand-500 transition-colors">Explore <ChevronRight size={16} /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="bg-gray-900 rounded-[4rem] p-12 md:p-24 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500 blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 max-w-3xl">
              <div className="w-20 h-20 bg-brand-500 rounded-3xl flex items-center justify-center mb-8 mx-auto rotate-12 shadow-2xl"><Sparkles size={40} className="text-white" /></div>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-none">Become a Premium Member</h2>
              <p className="text-xl text-gray-400 font-medium mb-12">Get early access to drops, exclusive vendor deals, and free shipping across Kuwait for one year.</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="bg-brand-500 text-white px-12 py-6 rounded-3xl font-black text-lg hover:bg-white hover:text-gray-900 transition-all shadow-3xl flex items-center gap-3">JOIN THE CLUB <Sparkles size={20} /></button>
                <Link to="/register-vendor" className="bg-transparent border-2 border-white/20 text-white px-12 py-6 rounded-3xl font-black text-lg hover:bg-white/10 transition-all">START SELLING</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductListPage = () => {
  const { products } = useStore();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');
  const [filters, setFilters] = useState<FilterState>({
    category: categoryParam || null,
    subcategories: [],
    minPrice: 0,
    maxPrice: 2000,
    vendorIds: [],
    search: searchParam || ''
  });

  useEffect(() => { setFilters(prev => ({ ...prev, category: categoryParam || null, subcategories: [], search: searchParam || '' })); }, [categoryParam, searchParam]);

  const toggleSubcategory = (sub: string) => setFilters(prev => ({ ...prev, subcategories: prev.subcategories.includes(sub) ? prev.subcategories.filter(s => s !== sub) : [...prev.subcategories, sub] }));
  const toggleVendor = (vId: string) => setFilters(prev => ({ ...prev, vendorIds: prev.vendorIds.includes(vId) ? prev.vendorIds.filter(v => v !== vId) : [...prev.vendorIds, vId] }));

  const filteredProducts = products.filter(p => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.subcategories.length > 0 && !filters.subcategories.includes(p.subcategory)) return false;
    if (filters.vendorIds.length > 0 && !filters.vendorIds.includes(p.vendorId)) return false;
    if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;
    return true;
  });

  return (
    <div className="bg-gray-50 pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 max-w-7xl">
        <Breadcrumbs items={[{ label: 'Catalog', path: '/products' }]} />
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 sticky top-32">
              <h3 className="font-black text-2xl tracking-tighter text-gray-900 mb-8 flex items-center justify-between">
                Refine <RefreshCw size={18} className="text-gray-300 cursor-pointer hover:rotate-180 transition-transform duration-500" onClick={() => setFilters({category: null, subcategories: [], minPrice: 0, maxPrice: 2000, vendorIds: [], search: ''})} />
              </h3>
              <div className="mb-8 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-4">Department</span>
                <div className="space-y-1">
                  {Object.keys(CATEGORY_HIERARCHY).map(cat => (
                    <button key={cat} onClick={() => setFilters(f => ({...f, category: cat, subcategories: []}))} className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${filters.category === cat ? 'bg-brand-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              {filters.category && (
                <div className="mb-8 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-4">Sub-Departments</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                    {CATEGORY_HIERARCHY[filters.category as Category].map(sub => (
                      <label key={sub} className="flex items-center gap-3 cursor-pointer group px-4">
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${filters.subcategories.includes(sub) ? 'bg-brand-500 border-brand-500' : 'border-gray-200 group-hover:border-brand-500'}`}>{filters.subcategories.includes(sub) && <Check size={12} className="text-white" strokeWidth={4} />}</div>
                        <input type="checkbox" className="hidden" checked={filters.subcategories.includes(sub)} onChange={() => toggleSubcategory(sub)} />
                        <span className="text-sm font-bold text-gray-600">{sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
          <div className="flex-1">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
              <h1 className="text-4xl font-black tracking-tighter text-gray-900">{filters.category || 'All Products'}</h1>
              <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full md:w-auto">
                <Search size={18} className="text-gray-400 ml-3" />
                <input type="text" placeholder="Quick Search..." className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 w-full" value={filters.search} onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Added Missing Components ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col items-center justify-center">
      <div className="bg-brand-500 p-4 rounded-2xl animate-bounce shadow-2xl shadow-brand-500/50">
        <Package className="text-white" size={48} />
      </div>
      <h1 className="text-3xl font-black tracking-tighter text-white mt-8 animate-pulse">
        NSTORE<span className="text-brand-500">.ONLINE</span>
      </h1>
      <div className="mt-12 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 animate-[loading_2s_ease-in-out_infinite]"></div>
      </div>
    </div>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const { products } = useStore();
  const { addToCart } = useCart();
  const product = products.find(p => p.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  if (!product) return <div className="pt-48 pb-24 text-center"><h1 className="text-4xl font-black">Product Not Found</h1></div>;

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="pt-32 pb-24 bg-white">
      {showModal && <ImageModal images={product.images} initialIndex={activeImage} onClose={() => setShowModal(false)} />}
      <div className="container mx-auto px-6 max-w-7xl">
        <Breadcrumbs items={[{ label: 'Catalog', path: '/products' }, { label: product.name, path: `/products/${product.id}` }]} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-6">
            <div className="aspect-square bg-gray-50 rounded-[3rem] overflow-hidden flex items-center justify-center p-12 relative group cursor-zoom-in" onClick={() => setShowModal(true)}>
              <img src={product.images[activeImage]} className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" alt={product.name} />
              <button className="absolute bottom-8 right-8 bg-white/80 backdrop-blur p-4 rounded-2xl text-gray-400 group-hover:text-brand-500 transition-all opacity-0 group-hover:opacity-100 shadow-xl"><Maximize2 size={24} /></button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setActiveImage(idx)} className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all p-2 bg-gray-50 ${idx === activeImage ? 'border-brand-500 bg-white' : 'border-transparent'}`}>
                  <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="mb-8">
              <span className="bg-brand-50 text-brand-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 inline-block">{product.category}</span>
              <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-4">{product.name}</h1>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-600 px-3 py-1 rounded-xl">
                  <Star size={16} className="fill-current" />
                  <span className="text-sm font-black">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-sm font-bold text-gray-400 border-l border-gray-100 pl-6">{product.reviewCount} Reviews</span>
                <span className="text-sm font-bold text-gray-900 border-l border-gray-100 pl-6 flex items-center gap-2"><Store size={16} className="text-brand-500" /> {product.vendor.name}</span>
              </div>
            </div>

            <div className="mb-10 p-8 bg-gray-50 rounded-[2.5rem]">
              <div className="flex items-baseline gap-4 mb-2">
                {product.discountPrice ? (
                  <>
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">KD {product.discountPrice.toFixed(3)}</span>
                    <span className="text-xl text-gray-400 line-through">KD {product.price.toFixed(3)}</span>
                  </>
                ) : (
                  <span className="text-4xl font-black text-gray-900 tracking-tighter">KD {product.price.toFixed(3)}</span>
                )}
              </div>
              <p className="text-gray-500 font-bold mb-6">{product.description}</p>
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                <span className={`flex items-center gap-2 ${isOutOfStock ? 'text-red-500' : 'text-green-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                  {isOutOfStock ? 'Sold Out' : `In Stock (${product.stock} units)`}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-400">SKU: {product.sku}</span>
              </div>
            </div>

            <div className="space-y-4 mb-12">
              <button disabled={isOutOfStock} onClick={() => addToCart(product)} className={`w-full h-20 rounded-[1.5rem] font-black tracking-[0.2em] text-sm flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95 ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-brand-500 shadow-brand-500/20'}`}>
                {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'} <ShoppingCart size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white border border-gray-100 rounded-3xl flex flex-col gap-3">
                <Truck className="text-brand-500" size={24} />
                <p className="text-xs font-black uppercase tracking-widest text-gray-900">Fast Delivery</p>
                <p className="text-[10px] font-bold text-gray-400">Within 24-48 hours across Kuwait</p>
              </div>
              <div className="p-6 bg-white border border-gray-100 rounded-3xl flex flex-col gap-3">
                <ShieldCheck className="text-brand-500" size={24} />
                <p className="text-xs font-black uppercase tracking-widest text-gray-900">Warranty</p>
                <p className="text-[10px] font-bold text-gray-400">Official vendor guarantee included</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-24 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-20">
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-black tracking-tighter text-gray-900 mb-10">Product Description</h3>
            <div className="prose prose-lg text-gray-500 font-medium whitespace-pre-wrap leading-relaxed">{product.detailedDescription}</div>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tighter text-gray-900 mb-10">Customer Reviews</h3>
            <div className="space-y-8">
              {product.reviews?.map(review => (
                <div key={review.id} className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-gray-900">{review.userName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{review.date}</p>
                    </div>
                    <div className="flex text-yellow-400"><Star size={14} className="fill-current" /> <span className="text-xs font-black ml-1">{review.rating}</span></div>
                  </div>
                  <p className="text-gray-600 font-bold text-sm leading-relaxed italic">"{review.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderTrackingPage = () => {
  const [orderId, setOrderId] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const order = MOCK_ORDERS.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    setFoundOrder(order || null);
    setSearched(true);
  };

  return (
    <div className="pt-48 pb-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black tracking-tighter text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-500 font-bold">Enter your order ID sent to your email or SMS.</p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-20 group">
          <div className="absolute inset-0 bg-brand-500/5 blur-3xl rounded-[3rem] transition-all group-hover:bg-brand-500/10"></div>
          <div className="relative flex gap-4 p-4 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100">
            <input required type="text" className="flex-1 h-16 bg-gray-50 border-none rounded-2xl px-6 font-bold focus:ring-4 focus:ring-brand-500/10 transition-all uppercase" placeholder="ORD-XXXX" value={orderId} onChange={e => setOrderId(e.target.value)} />
            <button type="submit" className="bg-gray-900 text-white px-10 rounded-2xl font-black text-sm tracking-widest hover:bg-brand-500 transition-all flex items-center gap-3 active:scale-95">TRACK <Search size={20} /></button>
          </div>
        </form>

        {searched && foundOrder && (
          <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-gray-100 animate-fade-in-up">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Order Status</p>
                <h3 className="text-3xl font-black text-brand-500 tracking-tighter">{foundOrder.status}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Estimated Delivery</p>
                <p className="text-xl font-black text-gray-900">{foundOrder.estimatedDelivery || 'Calculating...'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between relative mb-16">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
              <div className="absolute top-1/2 left-0 h-1 bg-brand-500 -translate-y-1/2 z-0" style={{ width: foundOrder.status === 'Delivered' ? '100%' : foundOrder.status === 'Shipped' ? '66%' : foundOrder.status === 'Processing' ? '33%' : '5%' }}></div>
              {[
                { label: 'Placed', icon: Clock },
                { label: 'Processing', icon: RefreshCw },
                { label: 'Shipped', icon: Truck },
                { label: 'Delivered', icon: Package }
              ].map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${idx <= ['Pending', 'Processing', 'Shipped', 'Delivered'].indexOf(foundOrder.status) ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/30' : 'bg-white border-2 border-gray-100 text-gray-300'}`}>
                    <step.icon size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${idx <= ['Pending', 'Processing', 'Shipped', 'Delivered'].indexOf(foundOrder.status) ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-10 border-t border-gray-50">
               <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6">Order Items</h4>
               <div className="space-y-4">
                 {foundOrder.items.map(item => (
                   <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                     <div className="flex items-center gap-4">
                       <img src={item.images[0]} className="w-12 h-12 rounded-xl object-contain bg-gray-50 p-2" alt="" />
                       <div><p className="font-bold text-gray-900 text-sm">{item.name}</p><p className="text-xs text-gray-400 font-bold">Qty: {item.quantity}</p></div>
                     </div>
                     <p className="font-black text-gray-900">KD {((item.discountPrice || item.price) * item.quantity).toFixed(3)}</p>
                   </div>
                 ))}
               </div>
               <div className="mt-10 flex justify-between items-center bg-gray-50 p-6 rounded-2xl">
                 <span className="text-sm font-black uppercase tracking-widest text-gray-400">Total Paid</span>
                 <span className="text-2xl font-black text-gray-900 tracking-tighter">KD {foundOrder.total.toFixed(3)}</span>
               </div>
            </div>
          </div>
        )}

        {searched && !foundOrder && (
          <div className="bg-white rounded-[3.5rem] p-16 text-center shadow-2xl border border-gray-100 animate-fade-in">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8"><AlertCircle size={40} /></div>
             <h3 className="text-3xl font-black tracking-tighter text-gray-900 mb-4">Order Not Found</h3>
             <p className="text-gray-500 font-bold">We couldn't find an order with ID "{orderId}". Please check the ID and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="pt-48 pb-24 container mx-auto px-6 text-center min-h-[70vh] flex flex-col justify-center">
        <div className="w-24 h-24 bg-gray-100 text-gray-300 rounded-[2rem] flex items-center justify-center mx-auto mb-8"><ShoppingBag size={48} /></div>
        <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-500 font-bold mb-10 text-xl">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="bg-brand-500 text-white px-12 py-5 rounded-3xl font-black tracking-widest text-sm shadow-xl shadow-brand-500/20 active:scale-95 mx-auto">START SHOPPING</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 max-w-7xl">
        <Breadcrumbs items={[{ label: 'Cart', path: '/cart' }]} />
        <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-12">Shopping Bag</h1>

        <div className="flex flex-col xl:flex-row gap-12">
          <div className="flex-1 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex flex-col sm:flex-row items-center gap-8 shadow-sm group">
                <div onClick={() => navigate(`/products/${item.id}`)} className="w-40 h-40 bg-gray-50 rounded-3xl flex items-center justify-center p-6 flex-shrink-0 cursor-pointer overflow-hidden">
                  <img src={item.images[0]} className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" alt="" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-500 mb-1 block">{item.category}</span>
                  <h3 onClick={() => navigate(`/products/${item.id}`)} className="text-xl font-black text-gray-900 mb-2 cursor-pointer hover:text-brand-500 transition-colors">{item.name}</h3>
                  <p className="text-xs text-gray-400 font-bold mb-4 flex items-center justify-center sm:justify-start gap-2"><Store size={12} /> {item.vendor.name}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 rounded-xl hover:bg-white text-gray-400 hover:text-gray-900 transition-all flex items-center justify-center"><Minus size={16} /></button>
                      <span className="w-8 text-center font-black text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 rounded-xl hover:bg-white text-gray-400 hover:text-gray-900 transition-all flex items-center justify-center"><Plus size={16} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-3 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                  </div>
                </div>
                <div className="text-right flex flex-col gap-1 pr-4">
                   <p className="text-2xl font-black text-gray-900">KD {((item.discountPrice || item.price) * item.quantity).toFixed(3)}</p>
                   {item.quantity > 1 && <p className="text-xs text-gray-400 font-bold">KD {(item.discountPrice || item.price).toFixed(3)} each</p>}
                </div>
              </div>
            ))}
          </div>

          <aside className="w-full xl:w-[400px]">
            <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-gray-900/20 sticky top-32 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-3xl font-black tracking-tighter mb-10">Summary</h3>
              <div className="space-y-6 mb-10">
                <div className="flex justify-between text-gray-400 font-bold uppercase tracking-widest text-xs"><span>Subtotal</span><span className="text-white">KD {totalPrice.toFixed(3)}</span></div>
                <div className="flex justify-between text-gray-400 font-bold uppercase tracking-widest text-xs"><span>Delivery</span><span className="text-green-400">FREE</span></div>
                <div className="flex justify-between text-gray-400 font-bold uppercase tracking-widest text-xs"><span>VAT (0%)</span><span className="text-white">KD 0.000</span></div>
                <div className="h-px bg-white/10 my-6"></div>
                <div className="flex justify-between items-end">
                   <span className="text-gray-400 font-black uppercase tracking-widest text-sm">Total Price</span>
                   <span className="text-4xl font-black tracking-tighter">KD {totalPrice.toFixed(3)}</span>
                </div>
              </div>
              <button className="w-full h-20 bg-brand-500 text-white rounded-[1.5rem] font-black tracking-[0.2em] text-sm hover:bg-white hover:text-gray-900 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-brand-500/20">CHECKOUT NOW <ArrowRight size={20} /></button>
              
              <div className="mt-10 pt-10 border-t border-white/10 flex flex-wrap gap-4 justify-center grayscale opacity-40">
                 <CreditCard size={24} />
                 <div className="text-xs font-black tracking-widest">KNET • VISA • CASH</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ErrorBoundary>
      <StoreProvider>
        <CartProvider>
          {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
          <HashRouter>
            <div className={showSplash ? 'hidden' : 'block min-h-screen flex flex-col'}>
              <Navbar />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductListPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/track" element={<OrderTrackingPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/register-vendor" element={<VendorRegistrationPage />} />
                  <Route path="/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/dashboard/add-product" element={<AddProductPage />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </div>
              <footer className="bg-gray-900 border-t border-white/5 py-20 mt-auto">
                <div className="container mx-auto px-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="bg-brand-500 p-2 rounded-xl"><Package className="text-white" size={24} /></div>
                    <span className="text-xl font-black tracking-tighter text-white">NSTORE<span className="text-brand-500">.ONLINE</span></span>
                  </div>
                  <p className="text-gray-500 text-sm font-bold tracking-widest uppercase mb-8">© 2024 NSTORE.ONLINE Kuwait. All Rights Reserved.</p>
                  <div className="flex justify-center gap-8 text-gray-400 font-bold text-sm">
                    <Link to="/products" className="hover:text-brand-500">Catalog</Link>
                    <Link to="/register-vendor" className="hover:text-brand-500">Sell with Us</Link>
                    <Link to="/dashboard" className="hover:text-brand-500">Dashboard</Link>
                    <Link to="/track" className="hover:text-brand-500">Track Order</Link>
                  </div>
                </div>
              </footer>
            </div>
          </HashRouter>
        </CartProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}
