
import React, { useState, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Package, Star, ShoppingCart, ChevronRight, ChevronLeft, ChevronDown,
  Check, Store, Search, X, User, 
  ArrowRight, Sparkles, TrendingUp,
  MapPin, Clock, ShieldCheck, Minus, Plus, Trash2,
  LayoutDashboard, LogOut, ShoppingBag, 
  Award, Wallet, Eye, MessageSquare, Send, Bot, Calendar, Verified,
  Filter, ArrowLeft, SendHorizontal, ThumbsUp, Maximize2
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

// Fix: Explicitly defined constructor to ensure 'props' and 'state' are correctly recognized by TypeScript within the class instance.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
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
    <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-gray-950 text-white rounded-full ${size === 'lg' ? 'scale-110 px-4 py-2' : ''} shadow-lg`}>
      <span className="text-[11px] font-black tracking-tight">{rating.toFixed(1)}</span>
      <Star size={size === 'lg' ? 14 : 10} className="fill-brand-500 text-brand-500" />
    </div>
    {count !== undefined && count > 0 && <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">({count})</span>}
  </div>
);

const WordAlignedTitle = ({ text, className = "" }: { text: string, className?: string }) => {
  return (
    <div className={`flex flex-wrap gap-x-2 gap-y-0 ${className}`}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="uppercase tracking-tighter inline-block">{word}</span>
      ))}
    </div>
  );
};

const VendorBadge = ({ vendor, light = false }: { vendor: Vendor, light?: boolean }) => (
  <Link 
    to={`/vendor/${vendor.id}`} 
    className={`flex items-start gap-3 group/v transition-all ${light ? 'hover:bg-white/10 bg-white/5' : 'hover:bg-gray-50 bg-gray-50/50'} p-3 rounded-[1.5rem] border border-transparent hover:border-gray-200 transition-all duration-300`}
  >
    <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white font-black text-lg group-hover/v:bg-brand-500 transition-all duration-500 shadow-xl overflow-hidden shrink-0">
      {vendor.name[0]}
    </div>
    <div className="flex flex-col min-w-0 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-[11px] font-black uppercase tracking-widest truncate ${light ? 'text-white' : 'text-gray-900'}`}>{vendor.name}</span>
        <Verified size={12} className="text-brand-500 shrink-0" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
           <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-500/10 text-brand-600 rounded-md">
             <Star size={10} className="fill-brand-500" />
             <span className="text-[10px] font-black">{vendor.rating.toFixed(1)}</span>
           </div>
           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Verified Store</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-300">
           <Calendar size={10} />
           <span className="text-[9px] font-bold uppercase tracking-tighter">Member since {new Date(vendor.joinedDate).getFullYear()}</span>
        </div>
      </div>
    </div>
  </Link>
);

const QuickViewModal = () => {
  const { quickViewProduct, closeQuickView } = useStore();
  const { addToCart } = useCart();
  const [currentImg, setCurrentImg] = useState(0);

  if (!quickViewProduct) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={closeQuickView} />
      
      <div className="relative bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-4xl flex flex-col md:flex-row animate-scale-in max-h-[90vh]">
        <button 
          onClick={closeQuickView}
          className="absolute top-6 right-6 z-20 p-4 bg-white/80 hover:bg-brand-500 hover:text-white rounded-2xl shadow-xl transition-all"
        >
          <X size={24} />
        </button>

        {/* Gallery */}
        <div className="md:w-1/2 bg-gray-50 p-8 flex flex-col">
          <div className="flex-1 flex items-center justify-center relative group">
            <img 
              src={quickViewProduct.images[currentImg]} 
              className="max-h-[400px] object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
              alt=""
            />
            {quickViewProduct.images.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setCurrentImg(prev => (prev - 1 + quickViewProduct.images.length) % quickViewProduct.images.length)}
                  className="p-3 bg-white shadow-xl rounded-xl hover:bg-brand-500 hover:text-white transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setCurrentImg(prev => (prev + 1) % quickViewProduct.images.length)}
                  className="p-3 bg-white shadow-xl rounded-xl hover:bg-brand-500 hover:text-white transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-8 justify-center overflow-x-auto no-scrollbar pb-2">
            {quickViewProduct.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentImg(idx)}
                className={`w-16 h-16 rounded-xl border-2 transition-all p-2 bg-white ${currentImg === idx ? 'border-brand-500 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
              >
                <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="md:w-1/2 p-8 sm:p-12 overflow-y-auto no-scrollbar">
          <div className="mb-8">
            <StarRating rating={quickViewProduct.rating} count={quickViewProduct.reviewCount} />
          </div>
          
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-6 leading-[0.9]">
            <WordAlignedTitle text={quickViewProduct.name} />
          </h2>

          <div className="flex items-center gap-4 mb-8">
             <span className="text-3xl font-black text-gray-900">KD {quickViewProduct.discountPrice?.toFixed(3) || quickViewProduct.price.toFixed(3)}</span>
             {quickViewProduct.discountPrice && <span className="text-lg text-gray-300 line-through font-bold">KD {quickViewProduct.price.toFixed(3)}</span>}
          </div>

          <p className="text-gray-500 font-medium leading-relaxed mb-10">
            {quickViewProduct.description}
          </p>

          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 mb-10">
             <VendorBadge vendor={quickViewProduct.vendor} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <button 
               onClick={() => { addToCart(quickViewProduct); closeQuickView(); }}
               className="flex-1 h-20 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-brand-500 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
             >
               <ShoppingCart size={18} /> Add to Bag
             </button>
             <Link 
               to={`/product/${quickViewProduct.id}`}
               onClick={closeQuickView}
               className="h-20 px-8 border-2 border-gray-100 text-gray-900 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
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

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev + 1) % product.images.length);
  };
  
  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div 
      className="group bg-white rounded-[2.5rem] p-5 border border-gray-100 hover:shadow-4xl transition-all duration-700 flex flex-col h-full relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setCurrentImg(0); }}
    >
      <div 
        className="relative aspect-square rounded-[2rem] bg-gray-50 overflow-hidden flex items-center justify-center mb-6 cursor-pointer" 
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img 
          src={product.images[currentImg]} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-out" 
          alt={product.name} 
        />

        {/* Quick View Button Overlay */}
        <div className={`absolute bottom-6 left-6 right-6 z-30 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
           <button 
             onClick={(e) => { e.stopPropagation(); openQuickView(product); }}
             className="w-full bg-white/90 backdrop-blur text-gray-900 h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-2xl hover:bg-brand-500 hover:text-white transition-all flex items-center justify-center gap-2"
           >
             <Maximize2 size={14} /> Quick View
           </button>
        </div>

        {/* Carousel Overlay */}
        {product.images.length > 1 && isHovered && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-20 pointer-events-none">
            <button onClick={prevImg} className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-xl pointer-events-auto hover:bg-brand-500 hover:text-white transition-all transform -translate-x-12 group-hover:translate-x-0 duration-500">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextImg} className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-xl pointer-events-auto hover:bg-brand-500 hover:text-white transition-all transform translate-x-12 group-hover:translate-x-0 duration-500">
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="absolute top-4 right-4 z-10">
          <StarRating rating={product.rating} />
        </div>

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {product.discountPrice && (
            <div className="bg-brand-500 text-white text-[9px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.2em] shadow-lg">
              SALE
            </div>
          )}
        </div>

        {/* Carousel Dots */}
        {product.images.length > 1 && isHovered && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {product.images.map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImg ? 'bg-brand-500 w-4' : 'bg-gray-300'}`} />
            ))}
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="mb-6">
           <VendorBadge vendor={product.vendor} />
        </div>
        
        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-6 group-hover:text-brand-500 transition-colors cursor-pointer min-h-[52px] leading-tight" onClick={() => navigate(`/product/${product.id}`)}>
          <WordAlignedTitle text={product.name} />
        </h3>
        
        <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
          <div className="flex flex-col">
             <div className="flex items-baseline gap-2">
               <span className="text-2xl font-black text-gray-900 tracking-tighter">KD {product.discountPrice?.toFixed(3) || product.price.toFixed(3)}</span>
               {product.discountPrice && <span className="text-[10px] text-gray-300 line-through font-bold">KD {product.price.toFixed(3)}</span>}
             </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
            className="p-5 bg-gray-900 text-white rounded-2xl hover:bg-brand-500 transition-all shadow-xl active:scale-90"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const VendorStorefrontPage = () => {
  const { vendorId } = useParams();
  const { products, vendors } = useStore();
  const vendor = vendors.find(v => v.id === vendorId);
  const vendorProducts = useMemo(() => products.filter(p => p.vendorId === vendorId), [products, vendorId]);

  if (!vendor) return <Navigate to="/products" />;

  return (
    <div className="pt-32 animate-fade-in pb-40">
      <section className="bg-gray-950 py-32 mb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-500/10 blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-32 h-32 rounded-[3rem] bg-brand-500 text-white flex items-center justify-center font-black text-5xl shadow-4xl animate-float">
              {vendor.name[0]}
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <span className="bg-brand-500 text-white text-[10px] font-black px-6 py-2.5 rounded-2xl uppercase tracking-[0.4em] shadow-lg">Verified Partner</span>
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Est. {vendor.joinedDate}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-8">
                <WordAlignedTitle text={vendor.name} />
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-10">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Store Rating</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={vendor.rating} size="lg" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Sales</span>
                  <span className="text-2xl font-black text-white">{vendor.totalSales.toLocaleString()} Items</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Location</span>
                  <span className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-tighter"><MapPin size={20} className="text-brand-500" /> {vendor.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-10">
        <div className="flex items-center justify-between mb-16 border-b-2 border-gray-100 pb-10">
           <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Vendor Collection</h2>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">{vendorProducts.length} Premium Drops</p>
        </div>

        {vendorProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {vendorProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="py-40 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200">
             <ShoppingBag size={80} className="mx-auto text-gray-200 mb-8" />
             <h3 className="text-3xl font-black text-gray-400 uppercase tracking-tighter">No products listed by this vendor</h3>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const { products, addReview } = useStore();
  const { addToCart } = useCart();
  const { user, triggerAuthRequired } = useAuth();
  const product = products.find(p => p.id === id);
  const [currentImg, setCurrentImg] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  if (!product) return <Navigate to="/products" />;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { triggerAuthRequired(); return; }
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    setTimeout(() => {
        addReview(product.id, { userName: user.name, rating: reviewRating, comment: reviewComment });
        setReviewComment(''); setReviewRating(5); setIsSubmittingReview(false);
    }, 800);
  };

  return (
    <div className="animate-fade-in pt-40 pb-40">
      <div className="container mx-auto px-8">
        <div className="flex flex-col lg:flex-row gap-20">
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="aspect-square bg-gray-50 rounded-[4rem] overflow-hidden flex items-center justify-center p-20 relative group">
              <img src={product.images[currentImg]} className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-1000" alt={product.name} />
              <div className="absolute top-8 left-8">
                <span className="bg-brand-500 text-white text-[10px] font-black uppercase tracking-[0.4em] px-6 py-2.5 rounded-2xl shadow-xl">{product.category}</span>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setCurrentImg(idx)} className={`min-w-[100px] h-[100px] rounded-3xl p-4 bg-gray-50 border-2 transition-all ${currentImg === idx ? 'border-brand-500 shadow-xl' : 'border-transparent hover:bg-gray-100'}`}>
                  <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
             <div className="flex items-center gap-6 mb-10">
                <StarRating rating={product.rating} count={product.reviewCount} size="lg" />
                <div className="w-px h-8 bg-gray-200" />
                <VendorBadge vendor={product.vendor} />
             </div>
             <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-[0.85] tracking-tighter uppercase mb-12">
               <WordAlignedTitle text={product.name} />
             </h1>
             <p className="text-gray-500 font-medium text-lg leading-relaxed mb-12 max-w-xl">{product.detailedDescription || product.description}</p>
             <div className="flex items-center gap-8 mb-16">
               <div className="flex flex-col">
                  <span className="text-5xl font-black text-gray-900 tracking-tighter">KD {product.discountPrice?.toFixed(3) || product.price.toFixed(3)}</span>
                  {product.discountPrice && <span className="text-xl text-gray-300 line-through font-bold">KD {product.price.toFixed(3)}</span>}
               </div>
               <div className="flex-1 h-px bg-gray-100" />
               <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Inventory status</p>
                  <p className={`text-xs font-black uppercase ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{product.stock > 0 ? `In Stock (${product.stock})` : 'Sold Out'}</p>
               </div>
             </div>
             <div className="flex flex-col sm:flex-row gap-6">
               <button onClick={() => addToCart(product)} disabled={product.stock <= 0} className="flex-1 h-24 bg-gray-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-brand-500 transition-all flex items-center justify-center gap-4 shadow-3xl active:scale-95 disabled:opacity-50">
                 <ShoppingCart size={20} /> Add to Bag
               </button>
               <button className="px-12 h-24 border-2 border-gray-100 text-gray-900 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-gray-50 hover:border-gray-200 transition-all">
                 Contact Vendor
               </button>
             </div>
          </div>
        </div>
        <section className="mt-40 pt-40 border-t-2 border-gray-50">
           <div className="flex flex-col lg:flex-row gap-24">
              <div className="lg:w-1/3">
                 <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-8">Client Testimony</h2>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px] mb-12 leading-relaxed">Genuine feedback from our Kuwaiti community.</p>
                 <form onSubmit={handleReviewSubmit} className="bg-white p-10 rounded-[3rem] border-2 border-gray-100 shadow-xl">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-8">Write a Review</h3>
                    <div className="flex gap-4 mb-8">
                       {[1,2,3,4,5].map(star => (
                          <button key={star} type="button" onClick={() => setReviewRating(star)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${reviewRating >= star ? 'bg-brand-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                             <Star size={20} className={reviewRating >= star ? 'fill-white' : ''} />
                          </button>
                       ))}
                    </div>
                    <textarea placeholder="Share your experience..." className="w-full h-40 bg-gray-50 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 ring-brand-500/20 mb-6" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                    <button type="submit" disabled={isSubmittingReview} className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-500 transition-all">
                       {isSubmittingReview ? <Sparkles size={16} className="animate-spin mx-auto" /> : "Publish Comment"}
                    </button>
                 </form>
              </div>
              <div className="flex-1 space-y-12">
                 {product.reviews && product.reviews.length > 0 ? product.reviews.map((rev) => (
                    <div key={rev.id} className="p-12 bg-white border border-gray-100 rounded-[3.5rem] hover:shadow-2xl transition-all group">
                       <div className="flex justify-between items-start mb-8">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 font-black text-lg group-hover:bg-brand-500 group-hover:text-white transition-all">{rev.userName[0]}</div>
                             <div>
                                <p className="text-lg font-black text-gray-900 uppercase tracking-tighter">{rev.userName}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{rev.date}</p>
                             </div>
                          </div>
                          <div className="flex gap-1">
                             {[1,2,3,4,5].map(s => <Star key={s} size={14} className={`${s <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-100'}`} />)}
                          </div>
                       </div>
                       <p className="text-gray-500 font-medium text-lg italic leading-relaxed">"{rev.comment}"</p>
                    </div>
                 )) : (
                    <div className="py-24 text-center bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200">
                       <MessageSquare size={64} className="mx-auto text-gray-300 mb-6" />
                       <p className="text-xl font-black text-gray-400 uppercase tracking-widest">No reviews yet</p>
                    </div>
                 )}
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

const VendorRegistrationPage = () => {
  const { applyAsVendor } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ businessName: '', contactName: '', email: '', phone: '', category: Category.ELECTRONICS, location: '' });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); applyAsVendor(formData); setSubmitted(true); };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 animate-fade-in">
        <div className="max-w-2xl w-full bg-white rounded-[4rem] p-20 shadow-4xl text-center border border-gray-100">
           <div className="w-24 h-24 bg-brand-500 text-white rounded-full flex items-center justify-center mx-auto mb-10 animate-float"><Check size={48} /></div>
           <h1 className="text-6xl font-black text-gray-900 tracking-tighter uppercase mb-6">Application Logged</h1>
           <p className="text-gray-400 font-medium text-lg mb-12">Our liaison team will reach out within 24 hours.</p>
           <Link to="/" className="inline-block bg-gray-900 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-brand-500 transition-all">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-48 pb-40 animate-fade-in">
       <div className="container mx-auto px-8">
          <div className="flex flex-col lg:flex-row gap-24 items-center">
             <div className="lg:w-1/2">
                <span className="inline-block bg-brand-500 text-white text-[10px] font-black uppercase tracking-[0.5em] px-8 py-3 rounded-2xl mb-10 shadow-xl">PARTNER ECOSYSTEM</span>
                <h1 className="text-7xl lg:text-[7rem] font-black text-gray-900 leading-[0.85] tracking-tighter uppercase mb-12">
                   Open your <span className="text-brand-500">Global</span> storefront
                </h1>
                <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-xl mb-12">Join the elite multi-vendor community of NSTORE.</p>
             </div>
             <div className="flex-1 w-full">
                <form onSubmit={handleSubmit} className="bg-white rounded-[4rem] p-12 lg:p-20 shadow-4xl border border-gray-100">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Business Name</label><input required placeholder="Al-Majestic Tech" className="w-full h-16 bg-gray-50 border-none rounded-2xl px-6 font-bold" onChange={e => setFormData({...formData, businessName: e.target.value})} /></div>
                      <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Primary Contact</label><input required placeholder="Full Name" className="w-full h-16 bg-gray-50 border-none rounded-2xl px-6 font-bold" onChange={e => setFormData({...formData, contactName: e.target.value})} /></div>
                      <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Email</label><input required type="email" placeholder="vendor@domain.com" className="w-full h-16 bg-gray-50 border-none rounded-2xl px-6 font-bold" onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                      <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Phone</label><input required placeholder="+965 1234 5678" className="w-full h-16 bg-gray-50 border-none rounded-2xl px-6 font-bold" onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                   </div>
                   <button type="submit" className="w-full h-24 bg-gray-900 text-white rounded-3xl mt-16 font-black uppercase tracking-[0.4em] text-xs hover:bg-brand-500 transition-all shadow-3xl">Submit Application</button>
                </form>
             </div>
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
            <div className="container mx-auto px-8">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
                    <div>
                        <h1 className="text-6xl font-black text-gray-900 tracking-tighter uppercase mb-4">Discovery Portal</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">{filtered.length} Curated results</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {filtered.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            </div>
        </div>
    );
};

// --- App Root ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLight = scrolled || pathname !== '/';

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ease-in-out ${
      scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 py-4 shadow-2xl' : 'bg-transparent py-8 border-b border-transparent'
    }`}>
      <div className="container mx-auto px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-brand-500 p-2.5 rounded-[1rem] shadow-xl group-hover:rotate-12 transition-transform"><Package className="text-white" size={24} /></div>
          <span className={`text-2xl font-black tracking-tighter uppercase ${isLight ? 'text-gray-900' : 'text-white'}`}>NSTORE<span className="text-brand-500">.ONLINE</span></span>
        </Link>
        <nav className="hidden lg:flex items-center gap-12">
          <Link to="/products" className={`text-[11px] font-black hover:text-brand-500 transition-colors uppercase tracking-[0.2em] ${isLight ? 'text-gray-900' : 'text-white'}`}>Catalog</Link>
          <Link to="/register-vendor" className="text-[11px] font-black text-brand-500 hover:text-brand-600 transition-colors uppercase tracking-[0.2em] flex items-center gap-2"><Store size={14} /> Sell with us</Link>
        </nav>
        <div className="flex items-center gap-6">
          {user ? (
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 p-1.5 pr-5 bg-gray-900 rounded-full">
              <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-brand-500" alt="" />
              <span className="text-[10px] font-black text-white hidden sm:block uppercase tracking-widest">{user.name.split(' ')[0]}</span>
              <ChevronDown size={14} className="text-white/60" />
            </button>
          ) : (
            <Link to="/register-user" className={`p-3 rounded-full hover:bg-black/5 transition-all flex items-center gap-3 font-black uppercase tracking-widest text-[10px] ${isLight ? 'text-gray-900' : 'text-white'}`}><User size={20} className="stroke-[3]" /></Link>
          )}
          <Link to="/cart" className={`relative p-3 rounded-full hover:bg-black/5 transition-all ${isLight ? 'text-gray-900 bg-gray-50' : 'text-white bg-white/5'}`}>
            <ShoppingCart size={20} className="stroke-[3]" />
            {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{totalItems}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
};

const HomePage = () => {
  const { products } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => { const timer = setInterval(() => setCurrentSlide(s => (s + 1) % HERO_SLIDES.length), 10000); return () => clearInterval(timer); }, []);
  return (
    <div className="animate-fade-in">
      <section className="relative h-[100vh] w-full overflow-hidden bg-gray-950">
        <div className="hero-carousel-container" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {HERO_SLIDES.map((slide) => (
            <div key={slide.id} className="hero-slide relative flex items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/40 to-transparent z-10"></div>
              <img src={slide.image} className="absolute inset-0 w-full h-full object-cover" alt="" />
              <div className="container mx-auto px-10 relative z-20">
                <div className="max-w-5xl text-left">
                  <span className="inline-block bg-brand-500 text-white text-[10px] font-black uppercase tracking-[0.6em] px-8 py-3 rounded-2xl mb-10 shadow-2xl">{slide.category}</span>
                  <h1 className="text-8xl md:text-[10rem] font-black text-white tracking-tighter leading-[0.8] mb-12 uppercase">
                    <WordAlignedTitle text={slide.title} />
                  </h1>
                  <p className="text-2xl text-gray-300 font-medium mb-16 max-w-2xl leading-relaxed">{slide.subtitle}</p>
                  <Link to="/products" className="bg-brand-500 text-white px-20 py-8 rounded-[2.5rem] font-black tracking-[0.2em] text-[11px] hover:bg-white hover:text-gray-950 transition-all uppercase">Explore Now</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="py-48 bg-white">
        <div className="container mx-auto px-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-32">
            <div>
              <div className="flex items-center gap-4 text-brand-500 font-black tracking-[0.5em] text-[10px] uppercase mb-6"><TrendingUp size={20} /><span>Latest Trends</span></div>
              <h2 className="text-7xl font-black tracking-tighter text-gray-900 leading-[0.9] uppercase max-w-md">Curated Premium Drops</h2>
            </div>
            <Link to="/products" className="group flex items-center gap-6 text-xl font-black tracking-tighter text-gray-900 border-b-4 border-brand-500 pb-4 hover:text-brand-500 transition-all uppercase">Enter Catalog <ArrowRight size={24} /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {products.filter(p => p.isFeatured).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>
    </div>
  );
};

const AIChatAssistant = () => {
    const { products } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([{ role: 'bot', text: "Marhaba! How can I help you find the perfect product today?" }]);
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
      <div className="fixed bottom-10 right-10 z-[200]">
        {!isOpen ? (
          <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-brand-500 text-white rounded-[1.5rem] shadow-4xl animate-float flex items-center justify-center group"><Sparkles size={28} className="group-hover:rotate-12 transition-transform" /></button>
        ) : (
          <div className="w-[380px] bg-white rounded-[2.5rem] shadow-4xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in-up">
            <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="p-2 bg-brand-500 rounded-xl"><Bot size={20}/></div><p className="text-xs font-black uppercase tracking-widest">NSTORE AI</p></div>
              <button onClick={() => setIsOpen(false)}><X size={20}/></button>
            </div>
            <div ref={scrollRef} className="h-96 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {messages.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-medium ${m.role === 'user' ? 'bg-brand-500 text-white' : 'bg-gray-50 text-gray-900'}`}>{m.text}</div></div>))}
            </div>
            <div className="p-6 pt-0"><div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask me anything..." className="bg-transparent border-none focus:ring-0 text-xs font-bold flex-1 px-3" /><button onClick={handleSend} className="p-3 bg-gray-900 text-white rounded-xl"><Send size={16} /></button></div></div>
          </div>
        )}
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
              <div className="min-h-screen flex flex-col font-sans">
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductDiscoveryPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/register-vendor" element={<VendorRegistrationPage />} />
                    <Route path="/vendor/:vendorId" element={<VendorStorefrontPage />} />
                    <Route path="/dashboard" element={<p className="pt-48 text-center uppercase font-black text-3xl">Dashboard</p>} />
                    <Route path="/cart" element={<p className="pt-48 text-center uppercase font-black text-3xl">Cart</p>} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
                <footer className="bg-gray-950 border-t border-white/5 py-40">
                  <div className="container mx-auto px-10 text-center">
                    <div className="flex items-center justify-center gap-4 mb-16">
                      <div className="bg-brand-500 p-4 rounded-2xl"><Package className="text-white" size={36} /></div>
                      <span className="text-4xl font-black tracking-tighter text-white uppercase">NSTORE<span className="text-brand-500">.ONLINE</span></span>
                    </div>
                    <p className="text-gray-800 text-[10px] font-black tracking-[0.7em] uppercase">© 2024 KUWAIT PREMIUM MARKETPLACE.</p>
                  </div>
                </footer>
              </div>
            </HashRouter>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
