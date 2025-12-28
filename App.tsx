
import React, { Component, useState, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Package, Star, ShoppingCart, ChevronRight, ChevronLeft, ChevronDown,
  Check, Store, Search, X, User, 
  ArrowRight, Sparkles, TrendingUp,
  MapPin, Clock, ShieldCheck, Minus, Plus, Trash2,
  LayoutDashboard, LogOut, ShoppingBag, 
  Award, Wallet, Eye, MessageSquare, Send, Bot, Calendar, Verified,
  Filter, ArrowLeft, SendHorizontal, ThumbsUp, Maximize2, Facebook, Instagram, Twitter, HelpCircle, Mail, Phone, Shield, Building2, Info, Share2, Heart
} from 'lucide-react';
import { FilterState, Category, Product, CartItem, Order, Review, Vendor, VendorApplication, UserProfile, PaymentMethod } from './types.ts';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORY_HIERARCHY, VENDORS as INITIAL_VENDORS, HERO_SLIDES, MOCK_USER } from './constants.ts';
import { GoogleGenAI } from "@google/genai";

// --- AI Service Logic ---

const getShoppingAdvice = async (userQuery: string, products: Product[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const productContext = products.map(p => 
    `- ${p.name} (${p.category}): KD ${p.discountPrice || p.price}`
  ).join('\n');

  const systemInstruction = `You are a premium sales assistant for NSTORE.ONLINE in Kuwait. 
  Currency: KD. 
  Current Catalog:
  ${productContext}
  
  Goal: Recommend specific products matching user needs. Be short, elegant, and persuasive. Use "NSTORE" in your greeting.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userQuery,
      config: { systemInstruction }
    });
    return response.text || "Explore our premium categories for the best selections.";
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return "I'm currently updating my knowledge. Please browse our latest catalog!";
  }
};

// --- Contexts ---

interface AuthContextType {
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
  showAuthNotify: boolean;
  closeAuthNotify: () => void;
  triggerAuthRequired: () => void;
}

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
  addReview: (productId: string, review: Omit<Review, 'id' | 'date'>) => void;
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
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
  const [vendors] = useState<Vendor[]>(INITIAL_VENDORS.map(v => ({...v, status: 'Active'})));
  const [applications, setApplications] = useState<VendorApplication[]>(() => {
    const saved = localStorage.getItem('nstore_apps');
    return saved ? JSON.parse(saved) : [];
  });
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => { localStorage.setItem('nstore_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('nstore_apps', JSON.stringify(applications)); }, [applications]);

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

  const approveApplication = (appId: string) => {};

  const addReview = (productId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0]
    };

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedReviews = [...(p.reviews || []), newReview];
        const avgRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
        return {
          ...p,
          reviews: updatedReviews,
          rating: avgRating,
          reviewCount: updatedReviews.length
        };
      }
      return p;
    }));
  };

  const openQuickView = (product: Product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  return (
    <StoreContext.Provider value={{ 
      products, vendors, applications, addProduct, removeProduct, applyAsVendor, approveApplication, addReview,
      quickViewProduct, openQuickView, closeQuickView
    }}>
      {children}
    </StoreContext.Provider>
  );
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

// Fixed ErrorBoundary class component to inherit correctly from Component class
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState { 
    return { hasError: true }; 
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
          <Bot size={64} className="text-brand-500 mb-4 animate-bounce" />
          <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">Something went wrong</h1>
          <button onClick={() => window.location.reload()} className="bg-brand-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs">Reload System</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- UI Sub-Components ---

const StarRating = ({ rating, count, size = "sm" }: { rating: number, count?: number, size?: "sm" | "lg" }) => (
  <div className="flex items-center gap-2">
    <div className={`flex items-center gap-1 px-2 py-0.5 bg-gray-950 text-white rounded-full ${size === 'lg' ? 'scale-110 px-4 py-2' : ''} shadow-lg`}>
      <span className="text-[9px] font-black leading-none">{rating.toFixed(1)}</span>
      <Star size={size === 'lg' ? 14 : 9} className="fill-brand-500 text-brand-500" />
    </div>
    {count !== undefined && count > 0 && <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase">({count})</span>}
  </div>
);

const WordAlignedTitle = ({ text, className = "" }: { text: string, className?: string }) => {
  return (
    <div className={`flex flex-wrap items-center gap-x-[0.25em] leading-[0.9] ${className}`}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="uppercase tracking-tighter inline-block">{word}</span>
      ))}
    </div>
  );
};

const VendorBadge = ({ vendor, light = false, showDetails = false, compact = false }: { vendor: Vendor, light?: boolean, showDetails?: boolean, compact?: boolean }) => (
  <Link 
    to={`/vendor/${vendor.id}`} 
    className={`flex items-center gap-2.5 group/v transition-all ${light ? 'hover:bg-white/10' : 'hover:bg-gray-50'} ${compact ? 'p-0' : 'p-2.5 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-200'} transition-all duration-300 min-w-0`}
  >
    <div className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl bg-gray-900 flex items-center justify-center text-white font-black text-[10px] group-hover/v:bg-brand-500 transition-all duration-500 shadow-lg overflow-hidden shrink-0`}>
      <img 
        src={`https://placehold.co/100x100/111827/ffffff?text=${vendor.name[0]}`} 
        className="w-full h-full object-cover" 
        alt="" 
      />
    </div>
    <div className="flex flex-col min-w-0 overflow-hidden">
      <div className="flex items-center gap-1">
        <span className={`text-[10px] font-black uppercase tracking-widest truncate ${light ? 'text-white' : 'text-gray-900'}`}>{vendor.name}</span>
        <Verified size={10} className="text-brand-500 shrink-0" />
      </div>
      {(showDetails || compact) && (
        <div className="flex items-center gap-1.5 mt-0.5">
           <div className="flex items-center gap-0.5">
             <Star size={9} className="fill-brand-500 text-brand-500" />
             <span className={`text-[9px] font-black ${light ? 'text-white/60' : 'text-gray-500'}`}>{vendor.rating.toFixed(1)}</span>
           </div>
           {showDetails && (
             <>
               <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
               <span className={`text-[9px] font-bold uppercase tracking-tighter ${light ? 'text-white/40' : 'text-gray-400'}`}>Est. {new Date(vendor.joinedDate).getFullYear()}</span>
             </>
           )}
        </div>
      )}
    </div>
  </Link>
);

const QuickViewModal = () => {
  const { quickViewProduct, closeQuickView } = useStore();
  const { addToCart } = useCart();
  const [currentImg, setCurrentImg] = useState(0);

  if (!quickViewProduct) return null;

  const handleNext = () => setCurrentImg((prev) => (prev + 1) % quickViewProduct.images.length);
  const handlePrev = () => setCurrentImg((prev) => (prev - 1 + quickViewProduct.images.length) % quickViewProduct.images.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={closeQuickView} />
      
      <div className="relative bg-white w-full max-w-6xl rounded-[2.5rem] overflow-hidden shadow-4xl flex flex-col md:flex-row animate-scale-in max-h-[95vh]">
        <button 
          onClick={closeQuickView}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-3 sm:p-4 bg-white/80 hover:bg-brand-500 hover:text-white rounded-2xl shadow-xl transition-all"
        >
          <X size={20} />
        </button>

        <div className="md:w-1/2 bg-gray-50 p-6 sm:p-8 flex flex-col relative min-h-[300px]">
          <div className="flex-1 flex items-center justify-center relative group">
            <img 
              src={quickViewProduct.images[currentImg]} 
              className="max-h-[300px] sm:max-h-[400px] object-contain mix-blend-multiply transition-transform duration-700"
              alt=""
            />
            {quickViewProduct.images.length > 1 && (
              <div className="absolute inset-x-2 sm:inset-x-4 top-1/2 -translate-y-1/2 flex justify-between px-2 sm:px-4">
                <button 
                  onClick={handlePrev}
                  className="p-3 sm:p-4 bg-white shadow-2xl rounded-2xl hover:bg-brand-500 hover:text-white transition-all transform active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={handleNext}
                  className="p-3 sm:p-4 bg-white shadow-2xl rounded-2xl hover:bg-brand-500 hover:text-white transition-all transform active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
            <div className="absolute top-0 left-0 bg-black/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">
              {currentImg + 1} / {quickViewProduct.images.length}
            </div>
          </div>
          
          <div className="flex gap-3 mt-6 justify-center overflow-x-auto no-scrollbar pb-2">
            {quickViewProduct.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentImg(idx)}
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl border-2 transition-all p-2 bg-white flex-shrink-0 ${currentImg === idx ? 'border-brand-500 shadow-lg scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
              >
                <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="md:w-1/2 p-6 sm:p-12 overflow-y-auto no-scrollbar">
          <div className="mb-6 sm:mb-8">
            <StarRating rating={quickViewProduct.rating} count={quickViewProduct.reviewCount} />
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase mb-4 sm:mb-6 leading-tight">
            <WordAlignedTitle text={quickViewProduct.name} />
          </h2>

          <div className="flex items-center gap-4 mb-6 sm:mb-8">
             <span className="text-2xl sm:text-3xl font-black text-gray-900">KD {quickViewProduct.discountPrice?.toFixed(3) || quickViewProduct.price.toFixed(3)}</span>
             {quickViewProduct.discountPrice && <span className="text-base sm:text-lg text-gray-300 line-through font-bold">KD {quickViewProduct.price.toFixed(3)}</span>}
          </div>

          <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed mb-8 sm:mb-10">
            {quickViewProduct.description}
          </p>

          <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100 mb-8 sm:mb-10">
             <VendorBadge vendor={quickViewProduct.vendor} showDetails />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <button 
               onClick={() => { addToCart(quickViewProduct); closeQuickView(); }}
               className="flex-1 h-16 sm:h-20 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-brand-500 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
             >
               <ShoppingCart size={18} /> Add to Bag
             </button>
             <Link 
               to={`/product/${quickViewProduct.id}`}
               onClick={closeQuickView}
               className="h-16 sm:h-20 px-6 sm:px-8 border-2 border-gray-100 text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
             >
               Full Specs <ArrowRight size={18} />
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Components ---

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart, openQuickView } = useStore();
  const navigate = useNavigate();
  const [currentImg, setCurrentImg] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextImg = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImg((prev) => (prev + 1) % product.images.length); };
  const prevImg = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImg((prev) => (prev - 1 + product.images.length) % product.images.length); };

  return (
    <div 
      className="group bg-white rounded-3xl p-4 border border-gray-100 hover:shadow-4xl transition-all duration-700 flex flex-col h-full relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCurrentImg(0); }}
    >
      <div 
        className="relative aspect-square rounded-2xl bg-gray-50 overflow-hidden flex items-center justify-center mb-5 cursor-pointer shadow-sm group-hover:shadow-none transition-shadow" 
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img 
          src={product.images[currentImg]} 
          className="object-cover w-full h-full scale-100 group-hover:scale-110 group-hover:brightness-105 transition-all duration-700" 
          alt={product.name} 
        />

        <div className={`absolute bottom-3 left-3 right-3 z-30 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
           <button 
             onClick={(e) => { e.stopPropagation(); openQuickView(product); }}
             className="w-full bg-white/95 backdrop-blur-md text-gray-900 h-10 rounded-xl font-black uppercase tracking-widest text-[8px] shadow-2xl hover:bg-brand-500 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
           >
             <Maximize2 size={12} /> Quick View
           </button>
        </div>

        {product.images.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between items-center z-20 pointer-events-none">
            <button onClick={prevImg} className={`p-1.5 bg-white/40 backdrop-blur-md border border-white/20 rounded-lg shadow-xl pointer-events-auto hover:bg-brand-500 hover:text-white transition-all transform duration-500 ${isHovered ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}><ChevronLeft size={14} /></button>
            <button onClick={nextImg} className={`p-1.5 bg-white/40 backdrop-blur-md border border-white/20 rounded-lg shadow-xl pointer-events-auto hover:bg-brand-500 hover:text-white transition-all transform duration-500 ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}><ChevronRight size={14} /></button>
          </div>
        )}

        {product.discountPrice && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl">Sale</div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col px-1">
        {/* Refined Vendor + Rating Row */}
        <div className="flex items-center justify-between gap-2 mb-3.5 pb-3 border-b border-gray-50">
           <VendorBadge vendor={product.vendor} compact />
           <StarRating rating={product.rating} />
        </div>

        <h3 className="font-black text-gray-900 text-sm sm:text-base line-clamp-2 mb-4 group-hover:text-brand-500 transition-colors cursor-pointer min-h-[40px] leading-tight" onClick={() => navigate(`/product/${product.id}`)}>
          <WordAlignedTitle text={product.name} />
        </h3>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
             <div className="flex items-baseline gap-1.5">
               <span className="text-base sm:text-lg font-black text-gray-900 tracking-tighter">KD {product.discountPrice?.toFixed(3) || product.price.toFixed(3)}</span>
               {product.discountPrice && <span className="text-[10px] text-gray-300 line-through font-bold">KD {product.price.toFixed(3)}</span>}
             </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="p-3 bg-gray-950 text-white rounded-xl hover:bg-brand-500 transition-all shadow-lg active:scale-90"><Plus size={16} /></button>
        </div>
      </div>
    </div>
  );
};

// --- Navbar & App Root ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLight = scrolled || pathname !== '/';

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ease-in-out ${
      scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 py-3 shadow-2xl' : 'bg-transparent py-6 sm:py-8'
    }`}>
      <div className="container mx-auto px-6 sm:px-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="bg-brand-500 p-2 rounded-xl shadow-xl group-hover:rotate-12 transition-transform"><Package className="text-white" size={20} /></div>
          <span className={`text-xl sm:text-2xl font-black tracking-tighter uppercase ${isLight ? 'text-gray-900' : 'text-white'}`}>NSTORE<span className="text-brand-500">.ONLINE</span></span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-8">
          <nav className="hidden lg:flex items-center gap-10">
            {['Products', 'Vendors', 'Support'].map(item => (
              <Link key={item} to={`/${item.toLowerCase()}`} className={`text-[11px] font-black uppercase tracking-[0.2em] hover:text-brand-500 transition-colors ${isLight ? 'text-gray-900' : 'text-white'}`}>{item}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/cart" className={`relative p-2.5 sm:p-3 rounded-full hover:bg-black/5 transition-all ${isLight ? 'text-gray-900 bg-gray-50' : 'text-white bg-white/5'}`}>
              <ShoppingCart size={18} sm:size={20} className="stroke-[3]" />
              {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{totalItems}</span>}
            </Link>
            <Link to="/profile" className={`p-2.5 sm:p-3 rounded-full hover:bg-black/5 transition-all ${isLight ? 'text-gray-900 bg-gray-50' : 'text-white bg-white/5'}`}>
              <User size={18} sm:size={20} className="stroke-[3]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-950 pt-24 sm:pt-32 pb-12 text-white border-t border-white/5">
      <div className="container mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16 mb-24">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-brand-500 p-2.5 rounded-xl"><Package size={24} /></div>
              <span className="text-2xl font-black tracking-tighter uppercase">NSTORE<span className="text-brand-500">.ONLINE</span></span>
            </Link>
            <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-xs">Kuwait's leading premium multi-vendor ecosystem for world-class hardware, fashion, and technology.</p>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-brand-500 transition-all"><Instagram size={20} /></a>
              <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-brand-500 transition-all"><Twitter size={20} /></a>
              <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-brand-500 transition-all"><Facebook size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-brand-500">Market Place</h4>
            <ul className="space-y-4">
              {['All Categories', 'Featured Drops', 'Vendor Application', 'Member Rewards', 'KNET Payments'].map((item) => (
                <li key={item}><a href="#" className="text-sm font-bold text-gray-500 hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-brand-500">Customer Care</h4>
            <ul className="space-y-4">
              {['Privacy Policy', 'Terms & Conditions', 'Returns & Refunds', 'Shipping Information', 'Contact Us'].map((item) => (
                <li key={item}><a href="#" className="text-sm font-bold text-gray-500 hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-brand-500">Global Drops</h4>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">Subscribe for real-time notifications on premium hardware and fashion releases.</p>
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 group focus-within:border-brand-500 transition-all">
              <input placeholder="email@domain.com" className="bg-transparent border-none focus:ring-0 text-sm flex-1 px-4 text-white font-bold placeholder:text-gray-700" />
              <button className="p-4 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all"><ArrowRight size={18} /></button>
            </div>
            <div className="flex items-center gap-6 grayscale opacity-30">
              <Shield size={20} className="text-brand-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">SSL SECURE CHECKOUT</span>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center lg:items-start gap-2">
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest text-center lg:text-left">© 2024 NSTORE.ONLINE. PREMIUM MULTIVENDOR SYSTEM.</p>
            <p className="text-[9px] font-bold text-gray-800 uppercase tracking-tighter">Powered by Al-Ghanim Technology Partners.</p>
          </div>
          <div className="flex items-center gap-8 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <div className="flex gap-4">
              <span className="text-[11px] font-black tracking-widest">KNET</span>
              <span className="text-[11px] font-black tracking-widest">VISA</span>
              <span className="text-[11px] font-black tracking-widest">MASTER</span>
              <span className="text-[11px] font-black tracking-widest">COD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const AIChatAssistant = () => {
    const { products } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([{ role: 'bot', text: "Marhaba! I am your NSTORE Concierge. How can I assist your premium shopping journey today?" }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
    
    const handleSend = async () => {
      if (!input.trim() || loading) return;
      const userMsg = input; setInput(''); setMessages(prev => [...prev, { role: 'user', text: userMsg }]); setLoading(true);
      const botResponse = await getShoppingAdvice(userMsg, products);
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]); setLoading(false);
    };

    return (
      <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[200]">
        {!isOpen ? (
          <button 
            onClick={() => setIsOpen(true)} 
            className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-500 text-white rounded-2xl sm:rounded-[1.5rem] shadow-4xl animate-float flex flex-col items-center justify-center group relative hover:bg-brand-600 transition-all"
          >
            <HelpCircle size={26} className="group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 bg-white w-4 h-4 rounded-full border-2 border-brand-500 animate-pulse"></span>
          </button>
        ) : (
          <div className="w-[300px] sm:w-[400px] bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-4xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in-up">
            <div className="bg-gray-900 p-5 sm:p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center"><Bot size={22}/></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 leading-none mb-1">Live Concierge</p>
                  <p className="text-[11px] font-bold text-white/60">Ready to assist</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20}/></button>
            </div>
            <div ref={scrollRef} className="h-80 sm:h-[450px] overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar bg-gray-50/50">
              {messages.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-4 rounded-2xl text-[12px] sm:text-[13px] font-medium leading-relaxed ${m.role === 'user' ? 'bg-brand-500 text-white shadow-lg' : 'bg-white text-gray-900 border border-gray-100 shadow-sm'}`}>{m.text}</div></div>))}
              {loading && <div className="flex justify-start"><div className="bg-white border border-gray-100 p-4 rounded-2xl flex gap-1.5 shadow-sm"><div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-200"></div></div></div>}
            </div>
            <div className="p-4 sm:p-6 pt-0 bg-white"><div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 group focus-within:border-brand-500 transition-all"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about products, KD prices..." className="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1 px-3 text-gray-900 placeholder:text-gray-400" /><button onClick={handleSend} className="p-3 bg-gray-900 text-white rounded-lg hover:bg-brand-500 transition-all active:scale-95"><Send size={16} /></button></div></div>
          </div>
        )}
      </div>
    );
};

const PartnersSection = () => {
  const { vendors } = useStore();
  
  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="container mx-auto px-6 sm:px-10">
        <div className="flex flex-col items-center mb-16 sm:mb-20">
          <div className="flex items-center gap-4 text-brand-500 font-black tracking-[0.4em] text-[9px] sm:text-[10px] uppercase mb-4 sm:mb-6">
            <Building2 size={20} />
            <span>Official Network</span>
          </div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-gray-900 leading-tight uppercase text-center">
            <WordAlignedTitle text="Our Official Partners" />
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 sm:gap-10">
          {vendors.map((vendor) => (
            <Link 
              key={vendor.id} 
              to={`/vendor/${vendor.id}`}
              className="group bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:border-brand-500/20 transition-all duration-500 flex flex-col items-center justify-center gap-4 aspect-video sm:aspect-square relative overflow-hidden"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                 <img 
                    src={`https://placehold.co/400x400/f8fafc/14b8a6?text=${vendor.name[0]}`}
                    alt={vendor.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                 />
                 <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/5 rounded-full transition-colors duration-500 -z-10 blur-xl scale-50 group-hover:scale-125" />
              </div>
              <div className="absolute bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{vendor.name}</p>
              </div>
            </Link>
          ))}
          
          <Link 
            to="/vendor-application"
            className="group bg-brand-500 rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-center justify-center gap-4 aspect-video sm:aspect-square border border-transparent"
          >
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
               <Plus size={32} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-white text-center">Join the Network</p>
          </Link>
        </div>
      </div>
    </section>
  );
};

const HomePage = () => {
  const { products } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => { 
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(s => (s + 1) % HERO_SLIDES.length);
        setIsTransitioning(false);
      }, 400);
    }, 8000); 
    return () => clearInterval(timer); 
  }, []);

  return (
    <div className="animate-fade-in overflow-hidden">
      <section className="relative h-[85vh] sm:h-[100vh] w-full overflow-hidden bg-gray-950">
        <div 
          className="flex h-full w-full transition-transform duration-[1000ms] cubic-bezier(0.65, 0, 0.35, 1)"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, idx) => (
            <div key={slide.id} className="min-w-full h-full relative flex items-center">
              <div 
                className={`absolute inset-0 transition-transform duration-[4000ms] ${currentSlide === idx ? 'scale-110' : 'scale-100'}`}
                style={{
                  backgroundImage: `url(${slide.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/60 to-transparent z-10" />
              </div>
              
              <div className="container mx-auto px-6 sm:px-10 relative z-20">
                <div className="max-w-4xl text-left">
                  <span className={`inline-block bg-brand-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.5em] px-6 sm:px-8 py-2 sm:py-3 rounded-full mb-8 sm:mb-10 shadow-2xl transition-all duration-1000 ${currentSlide === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>{slide.category}</span>
                  <h1 className={`text-5xl sm:text-7xl lg:text-[7rem] xl:text-[8rem] font-black text-white tracking-tighter leading-[0.9] mb-8 sm:mb-12 uppercase transition-all duration-1000 delay-100 ${currentSlide === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <WordAlignedTitle text={slide.title} />
                  </h1>
                  <p className={`text-lg sm:text-2xl text-gray-300 font-medium mb-12 sm:mb-16 max-w-xl leading-relaxed transition-all duration-1000 delay-200 ${currentSlide === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>{slide.subtitle}</p>
                  
                  <div className={`flex flex-wrap gap-4 transition-all duration-1000 delay-300 ${currentSlide === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                    <Link to="/products" className="group bg-brand-500 text-white px-10 sm:px-16 py-5 sm:py-7 rounded-2xl font-black tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-white hover:text-gray-950 transition-all uppercase shadow-3xl flex items-center gap-3 active:scale-95">
                      {slide.cta} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/vendors" className="bg-white/10 backdrop-blur-md text-white px-10 sm:px-16 py-5 sm:py-7 rounded-2xl font-black tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-white/20 transition-all uppercase flex items-center gap-3">
                      View Vendors
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-10 left-6 sm:left-10 z-30 flex gap-4">
          {HERO_SLIDES.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentSlide(idx)}
              className="group flex items-center gap-3"
            >
              <div className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-16 bg-brand-500 shadow-[0_0_15px_rgba(20,184,166,0.6)]' : 'w-4 bg-white/20 group-hover:bg-white/40'}`} />
              <span className={`text-[10px] font-black transition-all duration-500 uppercase tracking-widest ${currentSlide === idx ? 'text-white opacity-100' : 'text-white opacity-0 group-hover:opacity-40'}`}>0{idx + 1}</span>
            </button>
          ))}
        </div>
      </section>
      
      <section className="py-24 sm:py-48 bg-white">
        <div className="container mx-auto px-6 sm:px-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20 sm:mb-32">
            <div>
              <div className="flex items-center gap-4 text-brand-500 font-black tracking-[0.4em] text-[9px] sm:text-[10px] uppercase mb-4 sm:mb-6"><TrendingUp size={20} /><span>Kuwait's Finest</span></div>
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-gray-900 leading-tight sm:leading-[0.9] uppercase max-w-lg">Premium Curated Drops</h2>
            </div>
            <Link to="/products" className="group flex items-center gap-4 sm:gap-6 text-lg sm:text-xl font-black tracking-tighter text-gray-900 border-b-4 border-brand-500 pb-3 hover:text-brand-500 transition-all uppercase">
              Enter Portal <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {products.filter(p => p.isFeatured).map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          <div className="mt-24 sm:mt-32 p-12 sm:p-20 bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[100px] pointer-events-none" />
            <div className="max-w-2xl text-center lg:text-left">
              <h3 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase mb-6 leading-none">Become a <span className="text-brand-500">Global</span> Vendor</h3>
              <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10">Join Kuwait's most exclusive multi-vendor ecosystem and reach thousands of premium customers today.</p>
              <Link to="/vendor-application" className="inline-flex items-center gap-4 bg-gray-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-500 transition-all shadow-xl active:scale-95 group/btn">
                Apply to Sell <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="relative group-hover:scale-105 transition-transform duration-1000">
              <div className="w-32 h-32 sm:w-48 sm:h-48 bg-white shadow-4xl rounded-[2.5rem] flex items-center justify-center relative z-10">
                <Store size={48} className="text-brand-500" />
              </div>
              <div className="absolute -top-4 -left-4 w-full h-full bg-brand-500/10 rounded-[2.5rem] -z-10" />
            </div>
          </div>
        </div>
      </section>

      <PartnersSection />
    </div>
  );
};

// --- Page Components ---

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { products } = useStore();
  const { addToCart } = useCart();
  const [currentImg, setCurrentImg] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');

  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  if (!product) return (
    <div className="pt-40 pb-40 text-center">
      <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Product Not Found</h2>
      <Link to="/products" className="text-brand-500 font-bold uppercase tracking-widest text-xs mt-6 inline-block">Return to Catalog</Link>
    </div>
  );

  return (
    <div className="pt-24 sm:pt-40 pb-40 animate-fade-in bg-white">
      <div className="container mx-auto px-6 sm:px-10">
        <div className="flex items-center gap-4 mb-10 sm:mb-16">
          <Link to="/products" className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"><ArrowLeft size={18}/></Link>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 overflow-hidden truncate">
            <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
            <ChevronRight size={12}/>
            <Link to={`/products?category=${product.category}`} className="hover:text-brand-500 transition-colors">{product.category}</Link>
            <ChevronRight size={12}/>
            <span className="text-gray-900 truncate">{product.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 mb-32">
          <div className="space-y-8">
            <div className="aspect-square bg-gray-50 rounded-[3rem] overflow-hidden flex items-center justify-center p-12 relative group shadow-sm border border-gray-100">
              <img 
                src={product.images[currentImg]} 
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-1000"
                alt={product.name}
              />
              <div className="absolute top-8 left-8 flex flex-col gap-4">
                 <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl text-[10px] font-black uppercase tracking-widest text-gray-900 border border-white/20">Official Product</div>
                 {product.discountPrice && <div className="bg-red-500 text-white px-4 py-2 rounded-2xl shadow-xl text-[10px] font-black uppercase tracking-widest">Sale Event</div>}
              </div>
              <div className="absolute bottom-8 right-8 flex gap-3">
                 <button className="p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl hover:bg-brand-500 hover:text-white transition-all"><Heart size={20}/></button>
                 <button className="p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl hover:bg-brand-500 hover:text-white transition-all"><Share2 size={20}/></button>
              </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentImg(idx)}
                  className={`flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-2 transition-all p-3 bg-gray-50 ${currentImg === idx ? 'border-brand-500 shadow-xl bg-white scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <StarRating rating={product.rating} count={product.reviewCount} size="lg" />
            </div>
            
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-gray-900 tracking-tighter uppercase mb-8 leading-tight">
              <WordAlignedTitle text={product.name} />
            </h1>

            <div className="flex items-center gap-6 mb-12 pb-12 border-b border-gray-100">
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Standard Rate</span>
                <span className="text-3xl sm:text-4xl font-black text-gray-900">KD {product.discountPrice?.toFixed(3) || product.price.toFixed(3)}</span>
              </div>
              {product.discountPrice && (
                <div className="flex flex-col opacity-30">
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Original</span>
                  <span className="text-xl sm:text-2xl font-bold line-through">KD {product.price.toFixed(3)}</span>
                </div>
              )}
            </div>

            <p className="text-gray-500 text-lg font-medium leading-relaxed mb-12 max-w-xl">
              {product.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl"><ShieldCheck size={24}/></div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Official Warranty</p>
                    <p className="text-[12px] font-bold text-gray-400">12 Months Manufacturer Cover</p>
                  </div>
               </div>
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl"><Package size={24}/></div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Global Shipping</p>
                    <p className="text-[12px] font-bold text-gray-400">Express Delivery in Kuwait</p>
                  </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-12 border-t border-gray-100">
              <button 
                onClick={() => addToCart(product)}
                className="flex-1 h-20 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-brand-500 transition-all flex items-center justify-center gap-4 shadow-4xl active:scale-95"
              >
                <ShoppingCart size={20} /> Deploy to Bag
              </button>
              <div className="p-1 bg-gray-50 rounded-[1.5rem] flex items-center gap-1">
                 <button className="h-14 w-14 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"><Minus size={18}/></button>
                 <span className="w-12 text-center font-black text-lg">01</span>
                 <button className="h-14 w-14 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"><Plus size={18}/></button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-32">
           <div className="flex border-b border-gray-100 gap-12 mb-16 overflow-x-auto no-scrollbar">
              {['details', 'specs', 'reviews'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-8 text-xs font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab ? 'text-brand-500' : 'text-gray-300 hover:text-gray-900'}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-full animate-scale-in" />}
                </button>
              ))}
           </div>

           <div className="max-w-4xl animate-fade-in-up">
              {activeTab === 'details' && (
                <div className="space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="space-y-8">
                        <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                           <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-brand-500"><Info size={16}/></div>
                           The Intelligence
                        </h3>
                        <p className="text-gray-500 text-lg font-medium leading-relaxed">
                          {product.detailedDescription}
                        </p>
                      </div>
                      <div className="p-10 bg-gray-950 rounded-[3rem] text-white">
                         <VendorBadge vendor={product.vendor} showDetails light />
                         <div className="mt-10 pt-10 border-t border-white/10 flex items-center justify-between">
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Verified Store</p>
                               <div className="flex items-center gap-3">
                                  <Verified className="text-brand-500" size={20}/>
                                  <span className="font-bold">Premium Partner</span>
                               </div>
                            </div>
                            <Link to={`/vendor/${product.vendorId}`} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><ArrowRight size={20}/></Link>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                   {[
                     { label: 'Category Origin', value: product.category },
                     { label: 'Subsystem', value: product.subcategory },
                     { label: 'Product SKU', value: product.sku },
                     { label: 'Global Stock', value: product.stock > 0 ? 'Operational' : 'Depleted' },
                     { label: 'Merchant Unit', value: product.vendor.name },
                     { label: 'Service Hub', value: product.vendor.location }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between py-6 border-b border-gray-50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</span>
                        <span className="font-bold text-gray-900">{item.value}</span>
                     </div>
                   ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-12">
                   {product.reviews && product.reviews.length > 0 ? (
                      <div className="grid gap-8">
                        {product.reviews.map((rev) => (
                          <div key={rev.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row gap-8 items-start">
                             <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0">
                                {rev.userName[0]}
                             </div>
                             <div className="flex-1">
                                <div className="flex items-center justify-between mb-4">
                                   <div className="flex flex-col">
                                      <span className="font-black uppercase tracking-widest text-xs text-gray-900">{rev.userName}</span>
                                      <span className="text-[10px] font-bold text-gray-400 mt-1">{rev.date}</span>
                                   </div>
                                   <div className="flex gap-1 text-brand-500">
                                      {Array.from({length: 5}).map((_, i) => (
                                        <Star key={i} size={14} className={i < rev.rating ? 'fill-current' : 'opacity-20'} />
                                      ))}
                                   </div>
                                </div>
                                <p className="text-gray-500 font-medium leading-relaxed italic">"{rev.comment}"</p>
                             </div>
                          </div>
                        ))}
                      </div>
                   ) : (
                      <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                         <MessageSquare size={48} className="mx-auto text-gray-200 mb-6" />
                         <p className="text-gray-400 font-black uppercase tracking-widest text-[11px]">No feedback patterns recorded yet.</p>
                      </div>
                   )}
                   <button className="w-full h-16 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all">Submit Review Protocol</button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const VendorStorefrontPage = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { products, vendors } = useStore();
  const vendor = vendors.find(v => v.id === vendorId);
  const vendorProducts = products.filter(p => p.vendorId === vendorId);

  if (!vendor) return (
    <div className="pt-40 pb-40 text-center">
      <h2 className="text-3xl font-black uppercase tracking-tighter">Vendor Not Found</h2>
      <Link to="/" className="text-brand-500 font-bold uppercase mt-4 inline-block">Return Home</Link>
    </div>
  );

  return (
    <div className="pt-40 pb-40 animate-fade-in">
      <div className="container mx-auto px-6 sm:px-10">
        <div className="bg-gray-900 rounded-[3rem] p-12 sm:p-20 text-white mb-20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-brand-500 rounded-3xl flex items-center justify-center text-4xl font-black">
                {vendor.name[0]}
              </div>
              <div>
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{vendor.name}</h1>
                <div className="flex items-center gap-4">
                  <StarRating rating={vendor.rating} size="lg" />
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Partner since {new Date(vendor.joinedDate).getFullYear()}</span>
                </div>
              </div>
            </div>
            <p className="text-gray-400 max-w-xl text-lg font-medium">Official storefront for {vendor.name}. Discover our full range of curated premium products, delivered across Kuwait.</p>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-500/10 blur-[120px]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {vendorProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  );
};

const ProductDiscoveryPage = () => {
    const { products } = useStore();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const cat = searchParams.get('category') || null;

    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase());
            const matchesCat = cat ? p.category === cat : true;
            return matchesQuery && matchesCat;
        });
    }, [products, query, cat]);

    return (
        <div className="pt-40 pb-40 animate-fade-in">
            <div className="container mx-auto px-6 sm:px-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
                    <div>
                        <h1 className="text-6xl font-black text-gray-900 tracking-tighter uppercase mb-4">Discovery Portal</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">{filtered.length} Curated results found</p>
                    </div>
                </div>
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                      {filtered.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                ) : (
                  <div className="py-40 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200">
                    <Search size={64} className="mx-auto text-gray-200 mb-8" />
                    <h3 className="text-3xl font-black text-gray-300 uppercase tracking-tighter">No items found matching your search</h3>
                  </div>
                )}
            </div>
        </div>
    );
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <HashRouter>
              <Navbar />
              <AIChatAssistant />
              <QuickViewModal />
              <div className="min-h-screen flex flex-col font-sans selection:bg-brand-500 selection:text-white">
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductDiscoveryPage />} />
                    <Route path="/product/:productId" element={<ProductDetailPage />} />
                    <Route path="/vendors" element={<div className="pt-40 text-center font-black uppercase text-3xl">Vendor Directory Coming Soon</div>} />
                    <Route path="/vendor/:vendorId" element={<VendorStorefrontPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </HashRouter>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
