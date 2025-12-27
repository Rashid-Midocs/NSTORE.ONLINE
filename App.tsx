import React, { useState, useEffect, createContext, useContext, Component, useMemo } from 'react';
import { HashRouter, Routes, Route, useSearchParams, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { 
  Package, Star, ShoppingCart, ChevronRight, ChevronLeft, 
  Filter, Check, Store, Search, Menu, X, User, 
  ArrowRight, Heart, RefreshCw, AlertCircle, Sparkles, TrendingUp,
  MapPin, Clock, Truck, ShieldCheck, Minus, Plus, Trash2, Maximize2,
  LayoutDashboard, PlusCircle, LogOut, PieChart, Users, ShoppingBag, 
  CreditCard as CreditCardIcon, ExternalLink, Image as ImageIcon, ChevronDown, ChevronUp, 
  SlidersHorizontal, Bell, Settings, Award, Wallet, History, Eye
} from 'lucide-react';
import { FilterState, Category, Product, CartItem, Order, Review, Vendor, VendorApplication, UserProfile, PaymentMethod } from './types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORY_HIERARCHY, VENDORS as INITIAL_VENDORS, HERO_SLIDES, MOCK_ORDERS, MOCK_USER } from './constants';

// --- Contexts ---

interface AuthContextType {
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
  showAuthNotify: boolean;
  closeAuthNotify: () => void;
  triggerAuthRequired: () => void;
}

// Explicitly defined and initialized
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('nstore_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuthNotify, setShowAuthNotify] = useState(false);

  const login = () => {
    setUser(MOCK_USER);
    localStorage.setItem('nstore_user', JSON.stringify(MOCK_USER));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nstore_user');
  };

  const triggerAuthRequired = () => setShowAuthNotify(true);
  const closeAuthNotify = () => setShowAuthNotify(false);

  return (
    <AuthContext.Provider value={{ user, login, logout, showAuthNotify, closeAuthNotify, triggerAuthRequired }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

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
const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

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
const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};

const StoreProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('nstore_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS.map(v => ({...v, status: 'Active'})));
  const [applications, setApplications] = useState<VendorApplication[]>(() => {
    const saved = localStorage.getItem('nstore_apps');
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => { localStorage.setItem('nstore_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('nstore_apps', JSON.stringify(applications)); }, [applications]);
  const addProduct = (product: Product) => setProducts(prev => [product, ...prev]);
  const removeProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  const applyAsVendor = (appData: Omit<VendorApplication, 'id' | 'appliedAt' | 'status'>) => {
    const newApp: VendorApplication = { ...appData, id: `APP-${Math.floor(Math.random() * 9000) + 1000}`, appliedAt: new Date().toISOString().split('T')[0], status: 'Pending' };
    setApplications(prev => [newApp, ...prev]);
  };
  const approveApplication = (appId: string) => {
    setApplications(prev => prev.map(app => app.id === appId ? {...app, status: 'Approved'} : app));
    const app = applications.find(a => a.id === appId);
    if (app) {
      const newVendor: Vendor = { id: `v${vendors.length + 1}`, name: app.businessName, rating: 5.0, location: app.location, joinedDate: new Date().toISOString().split('T')[0], totalSales: 0, email: app.email, status: 'Active' };
      setVendors(prev => [...prev, newVendor]);
    }
  };
  return (<StoreContext.Provider value={{ products, vendors, applications, addProduct, removeProduct, applyAsVendor, approveApplication }}>{children}</StoreContext.Provider>);
};

const CartProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('nstore_cart');
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => { localStorage.setItem('nstore_cart', JSON.stringify(cart)); }, [cart]);
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };
  const clearCart = () => setCart([]);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.discountPrice || item.price) * item.quantity, 0);
  return (<CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>{children}</CartContext.Provider>);
};

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Fixed ErrorBoundary class by using the imported Component base class and removing the redundant constructor to resolve TypeScript property inference issues.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  
  static getDerivedStateFromError(_: any): ErrorBoundaryState { return { hasError: true }; }
  
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <button onClick={() => window.location.reload()} className="bg-brand-500 text-white px-6 py-2 rounded-xl font-bold">Refresh</button>
      </div>
    );
    return this.props.children;
  }
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- UI Components ---

const QuickViewModal = ({ product, onClose }: { product: Product, onClose: () => void }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const handleNext = () => {
    setCurrentImgIndex((prev) => (prev + 1) % product.images.length);
  };

  const handlePrev = () => {
    setCurrentImgIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-3xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up border border-white/20">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-brand-500 hover:text-white transition-all rounded-full z-10 shadow-sm">
          <X size={20} />
        </button>
        
        <div className="w-full md:w-1/2 aspect-square bg-gray-50 flex items-center justify-center p-8 relative overflow-hidden group">
          <img 
            key={currentImgIndex}
            src={product.images[currentImgIndex]} 
            className="max-h-full object-contain mix-blend-multiply animate-fade-in" 
            alt={product.name} 
          />
          
          {product.images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-500 hover:text-white"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-500 hover:text-white"
              >
                <ChevronRight size={24} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {product.images.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImgIndex ? 'bg-brand-500 w-4' : 'bg-gray-300'}`} />
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500">{product.category}</span>
            <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full text-yellow-600 border border-yellow-100">
               <Star size={12} className="fill-yellow-600" />
               <span className="text-xs font-black">{product.rating}</span>
            </div>
          </div>
          
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none mb-4 whitespace-pre-line uppercase">
            {product.name.split(' ').reduce((acc, word, i) => i % 2 === 0 ? acc + word + ' ' : acc + word + '\n', '')}
          </h2>
          
          <div className="flex items-center gap-3 mb-8 p-3 bg-gray-50 rounded-2xl w-fit border border-gray-100">
             <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
               <Store size={14} className="text-brand-500" />
             </div>
             <div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Store</p>
               <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{product.vendor.name}</p>
             </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl font-black text-gray-900">KD {product.discountPrice?.toFixed(3) || product.price.toFixed(3)}</span>
            {product.discountPrice && (
              <span className="text-lg text-gray-400 line-through font-bold">KD {product.price.toFixed(3)}</span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => { addToCart(product); onClose(); }} 
              className="flex-1 h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-500 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button 
              onClick={() => { navigate(`/products/${product.id}`); onClose(); }}
              className="px-8 h-16 border-2 border-gray-100 text-gray-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all active:scale-95"
            >
              View Full Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [showQuickView, setShowQuickView] = useState(false);

  return (
    <>
      <div className={`group bg-white rounded-[2.5rem] p-4 border border-gray-100 hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative ${product.stock <= 0 ? 'opacity-80' : ''}`}>
        <div className="relative aspect-square rounded-3xl bg-gray-50 overflow-hidden flex items-center justify-center mb-5 cursor-pointer">
          {/* Subtle scale-105 zoom effect on hover */}
          <img 
            src={product.images[0]} 
            onClick={() => navigate(`/products/${product.id}`)} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" 
            alt={product.name} 
          />
          
          <div className="absolute top-4 right-4 z-10 animate-fade-in">
             <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl flex flex-col items-end gap-0.5 border border-white/40">
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-[12px] font-black text-gray-900">{product.rating}</span>
                </div>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">({product.reviewCount} Reviews)</span>
             </div>
          </div>

          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowQuickView(true); }}
              className="bg-white text-gray-900 p-4 rounded-2xl shadow-2xl hover:bg-brand-500 hover:text-white transition-all transform translate-y-8 group-hover:translate-y-0 duration-500 font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
            >
              <Eye size={16} /> Quick View
            </button>
          </div>

          {product.discountPrice && (
            <div className="absolute top-4 left-4 bg-brand-500 text-white text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-brand-500/20">
              SALE
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col px-2">
          <div className="flex items-center gap-2 mb-3">
             <div className="p-1.5 bg-brand-50 rounded-xl border border-brand-100"><Store size={10} className="text-brand-500" /></div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{product.vendor.name}</span>
          </div>
          
          <h3 className="font-bold text-gray-900 text-[15px] line-clamp-2 mb-3 group-hover:text-brand-500 transition-colors cursor-pointer min-h-[40px] uppercase tracking-tighter" onClick={() => navigate(`/products/${product.id}`)}>
            {product.name}
          </h3>
          
          <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
            <div>
               <span className="text-xl font-black text-gray-900">KD {product.discountPrice?.toFixed(3) || product.price.toFixed(3)}</span>
               {product.discountPrice && <span className="block text-[11px] text-gray-300 line-through font-bold">KD {product.price.toFixed(3)}</span>}
            </div>
            <button 
              onClick={() => addToCart(product)} 
              className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-brand-500 transition-all shadow-xl active:scale-90"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>
      {showQuickView && <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />}
    </>
  );
};

// --- Checkout & Cart Components ---

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) return (
    <div className="pt-48 pb-24 text-center container mx-auto px-6 animate-fade-in-up">
       <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-10 text-gray-200">
         <ShoppingBag size={64} />
       </div>
       <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Your bag is empty</h1>
       <p className="text-gray-400 font-bold mb-12 tracking-widest uppercase text-[11px]">Discover premium electronics, fashion, and hardware essentials.</p>
       <Link to="/products" className="bg-gray-900 text-white px-14 py-6 rounded-3xl font-black tracking-widest text-[12px] shadow-2xl uppercase hover:bg-brand-500 transition-all">Start Shopping</Link>
    </div>
  );

  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-6xl font-black tracking-tighter text-gray-900 mb-16 uppercase">Shopping Bag</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-8">
             {cart.map(item => (
                <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-8 group hover:shadow-xl transition-all duration-500">
                   <div className="w-32 h-32 bg-gray-50 rounded-3xl flex-shrink-0 flex items-center justify-center p-4">
                      <img src={item.images[0]} className="max-h-full object-contain mix-blend-multiply" alt="" />
                   </div>
                   <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                         <Store size={12} className="text-brand-500" />
                         <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{item.vendor.name}</p>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{item.name}</h3>
                      <p className="text-2xl font-black text-gray-900">KD {(item.discountPrice || item.price).toFixed(3)}</p>
                   </div>
                   <div className="flex items-center gap-5 bg-gray-50 p-3 rounded-[2rem] border border-gray-100">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-900 hover:text-white transition-all"><Minus size={16}/></button>
                      <span className="font-black text-lg w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-900 hover:text-white transition-all"><Plus size={16}/></button>
                   </div>
                   <button onClick={() => removeFromCart(item.id)} className="p-4 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>
                </div>
             ))}
          </div>
          
          <div className="lg:col-span-1">
             <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-2xl sticky top-32">
                <h3 className="text-2xl font-black tracking-tighter mb-10 uppercase">Order Summary</h3>
                <div className="space-y-6 mb-10 pb-10 border-b border-gray-50">
                   <div className="flex justify-between text-gray-400 font-bold uppercase tracking-widest text-[11px]">
                      <span>Subtotal</span>
                      <span className="text-gray-900">KD {totalPrice.toFixed(3)}</span>
                   </div>
                   <div className="flex justify-between text-gray-400 font-bold uppercase tracking-widest text-[11px]">
                      <span>Shipping</span>
                      <span className="text-brand-500">FREE</span>
                   </div>
                   <div className="pt-6 border-t border-gray-50 flex justify-between">
                      <span className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Total</span>
                      <span className="text-2xl font-black text-gray-900">KD {totalPrice.toFixed(3)}</span>
                   </div>
                </div>
                <button onClick={() => navigate('/checkout')} className="w-full h-20 bg-gray-900 text-white rounded-[2rem] font-black tracking-widest text-[13px] hover:bg-brand-500 transition-all shadow-2xl uppercase shadow-gray-900/10 active:scale-95">Checkout Now</button>
                <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                   <ShieldCheck size={14}/> <span>256-BIT SSL SECURE PAYMENT</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>('KNET');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (cart.length === 0 && !submitted) navigate('/cart');
  }, [cart, submitted]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
       clearCart();
       navigate('/dashboard');
    }, 2500);
  };

  if (submitted) return (
     <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-10 animate-fade-in overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
           <Package size={800} className="text-brand-500" />
        </div>
        <div className="relative z-10 text-center">
           <div className="w-24 h-24 bg-brand-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(20,184,166,0.3)] animate-float">
              <Check size={48} />
           </div>
           <h1 className="text-6xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Processing Order...</h1>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-[12px]">Confirming your premium selections with our vendors.</p>
        </div>
     </div>
  );

  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
       <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center gap-6 mb-16">
             <Link to="/cart" className="p-4 bg-white border border-gray-100 rounded-[1.5rem] hover:bg-gray-900 hover:text-white transition-all shadow-sm"><ChevronLeft size={28}/></Link>
             <h1 className="text-6xl font-black tracking-tighter text-gray-900 uppercase">Checkout</h1>
          </div>
          
          <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
             <div className="lg:col-span-8 space-y-12">
                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm">
                   <h3 className="text-2xl font-black tracking-tighter mb-10 uppercase flex items-center gap-4 border-b border-gray-50 pb-8"><MapPin className="text-brand-500"/> Delivery Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Recipient Name</label>
                         <input required type="text" defaultValue={user?.name} className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Contact Phone</label>
                         <input required type="tel" defaultValue={user?.phone} className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Complete Address</label>
                         <textarea required className="w-full h-32 bg-gray-50 border-none rounded-[2rem] p-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20 resize-none" placeholder="Apartment, Building, Street, Area"></textarea>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm">
                   <h3 className="text-2xl font-black tracking-tighter mb-10 uppercase flex items-center gap-4 border-b border-gray-50 pb-8"><Wallet className="text-brand-500"/> Payment Methods</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                      {[
                        { id: 'KNET', label: 'KNET', icon: ShieldCheck, desc: 'Local Debit' },
                        { id: 'CREDIT_CARD', label: 'Card', icon: CreditCardIcon, desc: 'Visa/Master' },
                        { id: 'CASH', label: 'Cash', icon: Wallet, desc: 'On Delivery' }
                      ].map(opt => (
                        <button 
                          key={opt.id}
                          type="button"
                          onClick={() => setMethod(opt.id as PaymentMethod)}
                          className={`relative p-8 rounded-[2.5rem] border-2 text-center transition-all group overflow-hidden ${method === opt.id ? 'border-brand-500 bg-brand-50/10' : 'border-gray-50 hover:border-brand-500/30 bg-gray-50/30'}`}
                        >
                           {method === opt.id && <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500 translate-x-1/2 -translate-y-1/2 rotate-45"></div>}
                           {method === opt.id && <Check size={12} className="absolute top-2 right-2 text-white" strokeWidth={4}/>}
                           <div className="w-14 h-14 bg-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                              <opt.icon size={24} className={method === opt.id ? 'text-brand-500' : 'text-gray-300'} />
                           </div>
                           <p className="font-black text-[13px] text-gray-900 uppercase tracking-tighter">{opt.label}</p>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{opt.desc}</p>
                        </button>
                      ))}
                   </div>
                   
                   {method === 'CREDIT_CARD' && (
                      <div className="pt-10 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
                         <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Credit Card Number</label>
                            <div className="relative">
                               <input required type="text" placeholder="•••• •••• •••• ••••" className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
                               <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                                  <div className="w-8 h-5 bg-blue-100 rounded shadow-sm"></div>
                                  <div className="w-8 h-5 bg-orange-100 rounded shadow-sm"></div>
                               </div>
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Expiry Date</label>
                            <input required type="text" placeholder="MM / YY" className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">CVV / CVC</label>
                            <input required type="text" placeholder="•••" className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
                         </div>
                      </div>
                   )}
                </div>
             </div>

             <div className="lg:col-span-4">
                <div className="bg-gray-900 p-12 rounded-[4.5rem] text-white shadow-[0_50px_100px_rgba(0,0,0,0.15)] sticky top-32">
                   <div className="flex items-center gap-3 mb-10">
                      <div className="p-2 bg-brand-500 rounded-xl"><Sparkles size={18}/></div>
                      <h3 className="text-2xl font-black tracking-tighter uppercase">Review</h3>
                   </div>
                   
                   <div className="space-y-6 mb-12 max-h-48 overflow-y-auto no-scrollbar pb-6 border-b border-white/10">
                      {cart.map(item => (
                         <div key={item.id} className="flex justify-between items-center gap-4">
                            <div className="flex-1">
                               <p className="text-[12px] font-black truncate max-w-[160px] uppercase tracking-tighter">{item.name}</p>
                               <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.quantity} × KD {(item.discountPrice || item.price).toFixed(3)}</p>
                            </div>
                            <p className="text-[13px] font-black">KD {((item.discountPrice || item.price) * item.quantity).toFixed(3)}</p>
                         </div>
                      ))}
                   </div>

                   <div className="space-y-5 mb-12">
                      <div className="flex justify-between text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                         <span>Subtotal</span>
                         <span className="text-white">KD {totalPrice.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                         <span>Express Delivery</span>
                         <span className="text-brand-500 font-black">FREE</span>
                      </div>
                      <div className="flex justify-between pt-6 mt-6 border-t border-white/10">
                         <span className="text-3xl font-black tracking-tighter uppercase text-brand-500">KD {totalPrice.toFixed(3)}</span>
                      </div>
                   </div>

                   <button type="submit" className="group w-full h-20 bg-brand-500 text-white rounded-[2.5rem] font-black tracking-widest text-[13px] hover:bg-white hover:text-gray-900 transition-all shadow-2xl uppercase relative overflow-hidden active:scale-95">
                      <span className="relative z-10 flex items-center justify-center gap-3">
                         Pay & Confirm <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform"/>
                      </span>
                   </button>
                   
                   <div className="mt-10 flex flex-col items-center gap-4 opacity-40">
                      <div className="flex gap-4">
                         <Clock size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">EST. Delivery Today</span>
                      </div>
                      <div className="flex gap-4">
                         <ShieldCheck size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Buyer Protection Active</span>
                      </div>
                   </div>
                </div>
             </div>
          </form>
       </div>
    </div>
  );
};

// --- Page Components ---

const AuthNotification = () => {
  const { showAuthNotify, closeAuthNotify } = useAuth();
  const navigate = useNavigate();
  if (!showAuthNotify) return null;
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-md animate-fade-in-down">
      <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-2xl flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 blur-[80px] opacity-30"></div>
        <div className="bg-brand-500/20 p-3 rounded-2xl text-brand-500">
          <Award size={28} />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-sm tracking-tight mb-1 uppercase tracking-widest">Customer Access Only</h4>
          <p className="text-xs text-gray-400 font-bold">Please login or register to track your orders and enjoy exclusive benefits.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => { closeAuthNotify(); navigate('/register-user'); }} className="bg-brand-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-900 transition-all">Register</button>
          <button onClick={closeAuthNotify} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">Later</button>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      const authTrigger = document.getElementById('auth-trigger-btn');
      if (authTrigger) authTrigger.click();
    }
  };

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-sm' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-brand-500 p-2 rounded-xl shadow-lg shadow-brand-500/20">
            <Package className="text-white" size={24} />
          </div>
          <span className={`text-xl font-black tracking-tighter transition-colors text-white uppercase`}>
            NSTORE<span className="text-brand-500">.ONLINE</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          <Link to="/products" className="text-sm font-black text-white/90 hover:text-brand-500 transition-colors uppercase tracking-widest">Catalog</Link>
          <Link to="/track" onClick={handleTrackClick} className="text-sm font-black text-white/90 hover:text-brand-500 transition-colors uppercase tracking-widest">Track Order</Link>
          <Link to="/register-vendor" className="text-sm font-black text-brand-500 hover:text-brand-700 transition-colors uppercase tracking-widest flex items-center gap-2">
             <Store size={14} /> Sell with Us
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative">
            {user ? (
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-4 bg-white/10 hover:bg-white/20 transition-all border border-white/10 rounded-full"
              >
                <img src={user.avatar} className="w-8 h-8 rounded-full shadow-sm" alt="" />
                <span className="text-xs font-black text-white hidden sm:block uppercase tracking-tighter">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-white/60" />
              </button>
            ) : (
              <Link to="/register-user" className="p-2.5 rounded-full hover:bg-white/10 transition-all text-white flex items-center gap-2 font-black uppercase tracking-widest text-xs">
                <User size={22} className="stroke-[3]" />
                <span className="hidden sm:block">Sign In</span>
              </Link>
            )}

            {showUserMenu && user && (
              <div className="absolute right-0 top-full pt-4 w-56 animate-fade-in-up" onMouseLeave={() => setShowUserMenu(false)}>
                <div className="bg-white rounded-[2rem] shadow-3xl border border-gray-100 p-2 flex flex-col gap-1 overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50 rounded-2xl mb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Profile</p>
                    <p className="text-[11px] font-black text-gray-900 truncate tracking-tighter">{user.email}</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-brand-50 text-xs font-black text-gray-600 hover:text-brand-500 transition-all uppercase tracking-widest">
                    <LayoutDashboard size={18} /> Dashboard
                  </Link>
                  <button onClick={logout} className="flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-red-50 text-xs font-black text-red-500 transition-all w-full text-left uppercase tracking-widest">
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link to="/cart" className="relative p-2.5 rounded-full hover:bg-white/10 transition-all text-white">
            <ShoppingCart size={22} className="stroke-[3]" />
            {totalItems > 0 && <span className="absolute top-1 right-1 bg-brand-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">{totalItems}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
};

const AuthTrigger = () => {
  const { triggerAuthRequired } = useAuth();
  return <button id="auth-trigger-btn" className="hidden" onClick={triggerAuthRequired} />;
};

const HomePage = () => {
  const { products } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOmniMenu, setShowOmniMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(s => (s + 1) % HERO_SLIDES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-fade-in-up">
      {showOmniMenu && (
        <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-3xl animate-fade-in flex items-center justify-center p-10 overflow-y-auto">
          <button onClick={() => setShowOmniMenu(false)} className="absolute top-10 right-10 p-4 text-white hover:text-brand-500 transition-colors"><X size={48} /></button>
          <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-20">
            <div className="space-y-12">
               <h4 className="text-brand-500 font-black tracking-[0.4em] uppercase text-xs">Navigation</h4>
               <div className="space-y-6">
                 {Object.keys(CATEGORY_HIERARCHY).map(cat => (
                   <Link key={cat} to={`/products?category=${cat}`} onClick={() => setShowOmniMenu(false)} className="block text-5xl font-black text-white hover:text-brand-500 transition-all hover:translate-x-6 tracking-tighter uppercase">{cat.split(' ')[0]}</Link>
                 ))}
               </div>
            </div>
            <div className="bg-white/5 rounded-[5rem] p-16 border border-white/10 flex flex-col justify-center backdrop-blur-md">
               <Sparkles className="text-brand-500 mb-8" size={72} />
               <h3 className="text-4xl font-black text-white tracking-tighter mb-6 uppercase">NSTORE AI</h3>
               <p className="text-gray-400 font-medium mb-12 leading-relaxed uppercase tracking-widest text-[11px]">Personalized premium recommendations just for you.</p>
               <button onClick={() => setShowOmniMenu(false)} className="bg-brand-500 text-white h-20 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-[0_20px_50px_rgba(20,184,166,0.3)] hover:bg-white hover:text-gray-900 transition-all">Connect to AI</button>
            </div>
          </div>
        </div>
      )}

      <section className="relative h-[100vh] w-full overflow-hidden bg-gray-900">
        <div 
          className="hero-carousel-container" 
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_SLIDES.map((slide) => (
            <div key={slide.id} className="hero-slide relative flex items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent z-10"></div>
              <img src={slide.image} className="absolute inset-0 w-full h-full object-cover" alt="" />
              <div className="container mx-auto px-10 relative z-20 flex flex-col items-start justify-center">
                <div className="max-w-4xl text-left">
                  <span className="inline-block bg-brand-500 text-white text-[11px] font-black uppercase tracking-[0.5em] px-8 py-3 rounded-2xl mb-10 shadow-xl shadow-brand-500/20 animate-fade-in-down">{slide.category}</span>
                  <h1 className="text-8xl md:text-[10rem] font-black text-white tracking-tighter leading-[0.85] mb-10 animate-fade-in-up uppercase">
                    {slide.title.split(' ').map((word, i) => (
                      <span key={i} className="block">{word}</span>
                    ))}
                  </h1>
                  <p className="text-2xl text-gray-300 font-medium mb-14 max-w-2xl animate-fade-in-up leading-relaxed tracking-tight">{slide.subtitle}</p>
                  <div className="flex flex-wrap gap-8 animate-fade-in-up">
                    <button 
                      onClick={() => setShowOmniMenu(true)}
                      className="bg-brand-500 text-white px-16 py-7 rounded-[2.5rem] font-black tracking-widest text-xs hover:bg-white hover:text-gray-900 transition-all shadow-[0_25px_60px_rgba(20,184,166,0.3)] flex items-center gap-4 group"
                    >
                      {slide.cta.toUpperCase()} <div className="p-1 bg-white/20 rounded-xl group-hover:bg-gray-900 transition-colors"><Search size={20} /></div>
                    </button>
                    <Link to="/products" className="bg-white/10 backdrop-blur-2xl border border-white/20 text-white px-16 py-7 rounded-[2.5rem] font-black tracking-widest text-xs hover:bg-white hover:text-gray-900 transition-all">BROWSE CATALOG</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="absolute bottom-16 left-16 z-30 flex gap-5">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2.5 transition-all duration-700 rounded-full ${i === currentSlide ? 'w-16 bg-brand-500 shadow-[0_0_20px_rgba(20,184,166,0.5)]' : 'w-5 bg-white/30 hover:bg-white/60'}`} />
          ))}
        </div>
      </section>

      <section className="py-40 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-24">
            <div>
              <div className="flex items-center gap-3 text-brand-500 font-black tracking-[0.4em] text-[11px] uppercase mb-5"><TrendingUp size={18} /><span>Market Trends</span></div>
              <h2 className="text-7xl font-black tracking-tighter text-gray-900 leading-none uppercase">Curated Drops</h2>
            </div>
            <Link to="/products" className="group flex items-center gap-5 text-xl font-black tracking-tighter text-gray-900 border-b-4 border-brand-500 pb-3 hover:text-brand-500 transition-all uppercase">Discover Full Catalog <ArrowRight className="group-hover:translate-x-3 transition-transform" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {products.filter(p => p.isFeatured).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>
    </div>
  );
};

const VendorRegistrationPage = () => {
  const { applyAsVendor } = useStore();
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    category: Category.ELECTRONICS,
    location: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyAsVendor(formData);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="pt-48 pb-24 text-center container mx-auto px-6 animate-fade-in-up">
      <div className="w-24 h-24 bg-brand-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl"><Check size={48} /></div>
      <h1 className="text-5xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Application Sent</h1>
      <p className="text-gray-400 font-bold mb-12 uppercase text-[11px] tracking-widest">We'll review your details shortly.</p>
      <Link to="/" className="bg-gray-900 text-white px-14 py-6 rounded-3xl font-black uppercase text-[12px] tracking-widest">Back to Home</Link>
    </div>
  );

  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-6xl font-black tracking-tighter text-gray-900 mb-16 uppercase text-center">Sell with Us</h1>
        <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Business Name</label>
                <input required type="text" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Contact Person</label>
                <input required type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Phone Number</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})} className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20">
                  {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4">Location</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 font-bold text-gray-900 focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>
            <button type="submit" className="w-full h-20 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[13px] hover:bg-brand-500 transition-all shadow-2xl">Submit Application</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const ProductListPage = () => {
  const { products } = useStore();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const initialSearchParam = searchParams.get('search') || '';

  const [filters, setFilters] = useState<FilterState>({
    category: categoryParam || null, 
    subcategories: [], 
    minPrice: 0, 
    maxPrice: 1000, 
    vendorIds: [], 
    search: initialSearchParam
  });

  const [searchInput, setSearchInput] = useState(initialSearchParam);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([categoryParam || '']));

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const toggleCategoryExpand = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  const toggleSubcategory = (sub: string) => {
    setFilters(prev => {
      const nextSubs = prev.subcategories.includes(sub) 
        ? prev.subcategories.filter(s => s !== sub) 
        : [...prev.subcategories, sub];
      return { ...prev, subcategories: nextSubs };
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (filters.category && p.category !== filters.category) return false;
      if (filters.subcategories.length > 0 && !filters.subcategories.includes(p.subcategory)) return false;
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (p.price > filters.maxPrice) return false;
      return true;
    });
  }, [products, filters]);

  return (
    <div className="bg-gray-50 pt-32 pb-32 min-h-screen">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-16">
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100 sticky top-32 overflow-y-auto max-h-[80vh] no-scrollbar">
               <h3 className="text-2xl font-black tracking-tighter mb-12 flex items-center justify-between uppercase">Filter by</h3>
               <div className="space-y-12">
                  <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 px-2">Categories</p>
                    {Object.keys(CATEGORY_HIERARCHY).map(cat => (
                      <div key={cat} className="space-y-3 border-b border-gray-50 pb-6">
                        <button 
                          onClick={() => {
                            setFilters({...filters, category: cat === filters.category ? null : cat, subcategories: []});
                            toggleCategoryExpand(cat);
                          }} 
                          className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${filters.category === cat ? 'bg-gray-900 text-white shadow-2xl' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                          {cat.split(' ')[0]}
                          {expandedCategories.has(cat) ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>
                        
                        {expandedCategories.has(cat) && (
                          <div className="pl-6 py-3 space-y-4 animate-fade-in-down">
                            {CATEGORY_HIERARCHY[cat as Category].map(sub => (
                              <label key={sub} className="flex items-center gap-4 cursor-pointer group">
                                <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${filters.subcategories.includes(sub) ? 'bg-brand-500 border-brand-500' : 'border-gray-100 group-hover:border-brand-500'}`}>
                                  {filters.subcategories.includes(sub) && <Check size={14} className="text-white" strokeWidth={4} />}
                                </div>
                                <input type="checkbox" className="hidden" checked={filters.subcategories.includes(sub)} onChange={() => toggleSubcategory(sub)} />
                                <span className="text-[12px] font-black text-gray-400 group-hover:text-gray-900 transition-colors uppercase tracking-tight">{sub}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 px-2">Max Budget: {filters.maxPrice} KD</p>
                    <input type="range" min="0" max="1000" step="50" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: Number(e.target.value)})} className="w-full accent-brand-500 h-2 bg-gray-100 rounded-full appearance-none cursor-pointer" />
                  </div>
               </div>
            </div>
          </aside>

          <div className="flex-1">
             <div className="mb-16 flex flex-col xl:flex-row justify-between items-center gap-10">
                <div>
                   <h1 className="text-7xl font-black tracking-tighter text-gray-900 uppercase">{filters.category || 'Curated'}</h1>
                   <p className="text-gray-300 font-bold uppercase tracking-[0.4em] text-[10px] mt-4">NSTORE.ONLINE PREMIUM COLLECTION ({filteredProducts.length} ITEMS)</p>
                </div>
                <div className="bg-white p-3 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5 w-full xl:w-[450px] group focus-within:ring-4 focus-within:ring-brand-500/10 transition-all border-2">
                   <div className="p-3 bg-gray-50 rounded-2xl group-focus-within:bg-brand-500 group-focus-within:text-white transition-all">
                     <Search size={24} className="text-gray-400 group-focus-within:text-white" />
                   </div>
                   <input 
                      type="text" 
                      placeholder="Search across all vendors..." 
                      className="bg-transparent border-none focus:ring-0 font-black text-sm flex-1 uppercase tracking-widest" 
                      value={searchInput} 
                      onChange={e => setSearchInput(e.target.value)} 
                   />
                </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-12">
                {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- App Root ---

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <HashRouter>
              <AuthNotification />
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductListPage />} />
                    <Route path="/register-user" element={<p className="pt-48 text-center font-black uppercase text-3xl">Sign In Required</p>} />
                    <Route path="/register-vendor" element={<VendorRegistrationPage />} />
                    <Route path="/dashboard" element={<p className="pt-48 text-center font-black uppercase text-3xl">User Dashboard</p>} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="*" element={<HomePage />} />
                  </Routes>
                </div>
                <footer className="bg-gray-950 border-t border-white/5 py-32 mt-auto">
                  <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-12">
                      <div className="bg-brand-500 p-3 rounded-2xl shadow-2xl shadow-brand-500/20"><Package className="text-white" size={32} /></div>
                      <span className="text-3xl font-black tracking-tighter text-white uppercase">NSTORE<span className="text-brand-500">.ONLINE</span></span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-12 text-gray-500 font-black uppercase tracking-[0.4em] text-[10px] mb-16">
                       <Link to="/products" className="hover:text-white transition-colors">Catalog</Link>
                       <Link to="/register-vendor" className="hover:text-white transition-colors">Sell</Link>
                       <Link to="/track" className="hover:text-white transition-colors">Track</Link>
                       <Link to="/faq" className="hover:text-white transition-colors">Support</Link>
                    </div>
                    <p className="text-gray-700 text-[10px] font-black tracking-[0.5em] uppercase">© 2024 KUWAIT PREMIUM MARKETPLACE. DESIGNED FOR EXCELLENCE.</p>
                  </div>
                </footer>
              </div>
              <AuthTrigger />
            </HashRouter>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
