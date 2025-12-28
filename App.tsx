import React, { useState, useEffect, createContext, useContext, Component, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, useSearchParams, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { 
  Package, Star, ShoppingCart, ChevronRight, ChevronLeft, 
  Check, Store, Search, X, User, 
  ArrowRight, Sparkles, TrendingUp,
  MapPin, Clock, ShieldCheck, Minus, Plus, Trash2,
  LayoutDashboard, LogOut, ShoppingBag, 
  CreditCard as CreditCardIcon, ChevronDown, ChevronUp, 
  Award, Wallet, Eye, MessageSquare, Send, Bot, Calendar, ShoppingCart as CartIcon, Verified
} from 'lucide-react';
import { FilterState, Category, Product, CartItem, Order, Review, Vendor, VendorApplication, UserProfile, PaymentMethod } from './types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORY_HIERARCHY, VENDORS as INITIAL_VENDORS, HERO_SLIDES, MOCK_USER } from './constants';
import { GoogleGenAI } from "@google/genai";

// --- AI Service Logic ---

const getShoppingAdvice = async (userQuery: string, products: Product[]): Promise<string> => {
  // Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly.
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
    // Correctly calling generateContent with the model name and required parameters.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userQuery,
      config: { systemInstruction }
    });
    // Access the .text property directly from the response object.
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

// Fix: Using imported Component and explicitly defining the constructor to resolve property access issues in TypeScript.
class ErrorBoundary extends Component<{children?: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children?: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }

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

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- UI Sub-Components ---

const StarRating = ({ rating, count, size = "sm" }: { rating: number, count: number, size?: "sm" | "lg" }) => (
  <div className="flex items-center gap-2">
    <div className={`flex items-center gap-0.5 px-2.5 py-1 bg-gray-900 text-white rounded-full ${size === 'lg' ? 'scale-110' : ''}`}>
      <span className="text-[10px] font-black tracking-tighter">{rating.toFixed(1)}</span>
      <Star size={size === 'lg' ? 12 : 8} className="fill-yellow-400 text-yellow-400" />
    </div>
    <span className="text-[10px] font-black text-gray-400 tracking-widest">({count})</span>
  </div>
);

const WordAlignedTitle = ({ text, className = "" }: { text: string, className?: string }) => {
  const words = text.split(' ');
  return (
    <div className={`flex flex-wrap gap-x-1.5 gap-y-0.5 ${className}`}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span className="uppercase tracking-tighter">{word}</span>
          {i % 2 === 1 && <div className="w-full h-0" />}
        </React.Fragment>
      ))}
    </div>
  );
};

// --- Main Components ---

const QuickViewModal = ({ product, onClose }: { product: Product, onClose: () => void }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const handleNext = () => setCurrentImgIndex((prev) => (prev + 1) % product.images.length);
  const handlePrev = () => setCurrentImgIndex((prev) => (prev - 1 + product.images.length) % product.images.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-white rounded-[3.5rem] shadow-3xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up border border-white/20">
        <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-gray-100/80 hover:bg-brand-500 hover:text-white transition-all rounded-full z-10 shadow-sm backdrop-blur">
          <X size={20} />
        </button>
        
        <div className="w-full md:w-1/2 aspect-square bg-gray-50 flex items-center justify-center p-12 relative overflow-hidden group/modal">
          <img 
            key={currentImgIndex}
            src={product.images[currentImgIndex]} 
            className="max-h-full object-contain mix-blend-multiply animate-fade-in scale-110" 
            alt={product.name} 
          />
          
          {product.images.length > 1 && (
            <>
              <button onClick={handlePrev} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur shadow-2xl opacity-0 group-hover/modal:opacity-100 transition-all hover:bg-brand-500 hover:text-white">
                <ChevronLeft size={24} />
              </button>
              <button onClick={handleNext} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur shadow-2xl opacity-0 group-hover/modal:opacity-100 transition-all hover:bg-brand-500 hover:text-white">
                <ChevronRight size={24} />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {product.images.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentImgIndex(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === currentImgIndex ? 'bg-brand-500 w-6' : 'bg-gray-300 hover:bg-gray-400'}`} />
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="flex-1 p-10 md:p-16 flex flex-col justify-center bg-white">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-500 bg-brand-50 px-4 py-1.5 rounded-full">{product.category}</span>
            <StarRating rating={product.rating} count={product.reviewCount} size="lg" />
          </div>
          
          <h2 className="text-5xl font-black text-gray-900 leading-[0.9] mb-6">
            <WordAlignedTitle text={product.name} />
          </h2>
          
          <div className="flex items-center gap-3 mb-8">
            <Link to={`/vendor/${product.vendorId}`} className="group/v flex items-center gap-3 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100 hover:bg-brand-500 transition-all">
              <Store size={16} className="text-brand-500 group-hover/v:text-white" />
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-600 group-hover/v:text-white">{product.vendor.name}</span>
              <Verified size={14} className="text-brand-500 group-hover/v:text-white" />
            </Link>
          </div>
          
          <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 max-w-sm">
            {product.description}
          </p>
          
          <div className="flex items-center gap-5 mb-10">
            <span className="text-4xl font-black text-gray-900 tracking-tighter">KD {product.discountPrice?.toFixed(3) || product.price.toFixed(3)}</span>
            {product.discountPrice && (
              <span className="text-xl text-gray-300 line-through font-bold">KD {product.price.toFixed(3)}</span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => { addToCart(product); onClose(); }} 
              className="flex-1 h-20 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-brand-500 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
            >
              <ShoppingCart size={18} /> Add to Bag
            </button>
            <button 
              onClick={() => { navigate(`/products/${product.id}`); onClose(); }}
              className="px-10 h-20 border-2 border-gray-100 text-gray-900 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-95"
            >
              Details
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
      <div className="group bg-white rounded-[2.5rem] p-4 border border-gray-100 hover:shadow-3xl transition-all duration-700 flex flex-col h-full relative overflow-hidden">
        <div className="relative aspect-square rounded-[2rem] bg-gray-50 overflow-hidden flex items-center justify-center mb-6 cursor-pointer">
          <img 
            src={product.images[0]} 
            onClick={() => navigate(`/products/${product.id}`)} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000 ease-out" 
            alt={product.name} 
          />
          
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowQuickView(true); }}
              className="bg-white text-gray-900 p-5 rounded-2xl shadow-2xl hover:bg-brand-500 hover:text-white transition-all transform translate-y-12 group-hover:translate-y-0 duration-700 font-black uppercase tracking-widest text-[9px] flex items-center gap-3"
            >
              <Eye size={18} /> Quick View
            </button>
          </div>

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.discountPrice && (
              <div className="bg-brand-500 text-white text-[9px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.2em] shadow-lg">
                SALE
              </div>
            )}
            <div className="bg-white/90 backdrop-blur text-gray-900 text-[9px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 border border-white/50">
              <Verified size={10} className="text-brand-500" /> VENDOR CHOICE
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col px-2">
          <div className="flex items-center justify-between mb-4">
             <Link to={`/vendor/${product.vendorId}`} className="flex items-center gap-2 group/vendor">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-soft" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[100px] group-hover/vendor:text-brand-500 transition-colors">{product.vendor.name}</span>
             </Link>
             <StarRating rating={product.rating} count={product.reviewCount} />
          </div>
          
          <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-6 group-hover:text-brand-500 transition-colors cursor-pointer min-h-[50px] leading-tight" onClick={() => navigate(`/products/${product.id}`)}>
            <WordAlignedTitle text={product.name} />
          </h3>
          
          <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
            <div className="flex flex-col">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Standard Price</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-xl font-black text-gray-900 tracking-tighter">KD {product.discountPrice?.toFixed(3) || product.price.toFixed(3)}</span>
                 {product.discountPrice && <span className="text-[10px] text-gray-300 line-through font-bold">KD {product.price.toFixed(3)}</span>}
               </div>
            </div>
            <button 
              onClick={() => addToCart(product)} 
              className="p-5 bg-gray-900 text-white rounded-2xl hover:bg-brand-500 transition-all shadow-xl active:scale-90"
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

const VendorStorefrontPage = () => {
  const { vendorId } = useParams();
  const { vendors, products } = useStore();
  const vendor = vendors.find(v => v.id === vendorId);
  
  const vendorProducts = useMemo(() => {
    return products.filter(p => p.vendorId === vendorId);
  }, [products, vendorId]);

  if (!vendor) return <Navigate to="/" />;

  return (
    <div className="animate-fade-in pt-32 pb-48">
      {/* Editorial Vendor Header */}
      <section className="bg-gray-50 border-b border-gray-100 py-32 mb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-500/5 blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-10 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4 mb-10">
                <span className="bg-brand-500 text-white text-[10px] font-black uppercase tracking-[0.4em] px-6 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
                  <Verified size={14} /> Verified Merchant
                </span>
                <span className="text-gray-300 text-[10px] font-black uppercase tracking-[0.4em]">NSTORE PARTNER SINCE {vendor.joinedDate.split('-')[0]}</span>
              </div>
              
              <h1 className="text-7xl md:text-9xl font-black text-gray-900 tracking-tighter leading-[0.85] mb-12 uppercase">
                <WordAlignedTitle text={vendor.name} />
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-xl transition-all">
                  <div className="p-3 bg-brand-50 rounded-2xl text-brand-500"><Star size={24} className="fill-brand-500" /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Store Rating</p>
                    <p className="text-2xl font-black text-gray-900">{vendor.rating.toFixed(1)} / 5.0</p>
                  </div>
                </div>
                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-xl transition-all">
                  <div className="p-3 bg-brand-50 rounded-2xl text-brand-500"><MapPin size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Location</p>
                    <p className="text-2xl font-black text-gray-900">{vendor.location}</p>
                  </div>
                </div>
                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-xl transition-all">
                  <div className="p-3 bg-brand-50 rounded-2xl text-brand-500"><CartIcon size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
                    <p className="text-2xl font-black text-gray-900">{vendorProducts.length}</p>
                  </div>
                </div>
                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-xl transition-all">
                  <div className="p-3 bg-brand-50 rounded-2xl text-brand-500"><Calendar size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Established</p>
                    <p className="text-2xl font-black text-gray-900">{vendor.joinedDate.split('-')[1]}/{vendor.joinedDate.split('-')[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="container mx-auto px-10">
        <div className="flex items-center justify-between mb-24 border-b-4 border-gray-900 pb-10">
          <h2 className="text-5xl font-black tracking-tighter text-gray-900 uppercase">Collection</h2>
          <div className="flex gap-4">
             <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                <Search size={18} className="text-gray-400" />
                <input placeholder="Search this store..." className="bg-transparent border-none focus:ring-0 text-sm font-black uppercase tracking-widest" />
             </div>
          </div>
        </div>

        {vendorProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {vendorProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="py-48 text-center bg-gray-50 rounded-[5rem] border-4 border-dashed border-gray-100">
             <ShoppingBag size={80} className="mx-auto text-gray-200 mb-8" />
             <h3 className="text-4xl font-black text-gray-400 uppercase tracking-tighter">Inventory is currently empty</h3>
             <p className="text-gray-300 font-bold uppercase tracking-widest text-[11px] mt-4">Check back later for new premium drops.</p>
          </div>
        )}
      </section>
    </div>
  );
};

const AIChatAssistant = () => {
  const { products } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Marhaba! I'm your NSTORE Assistant. How can I help you find the perfect product today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    
    const botResponse = await getShoppingAdvice(userMsg, products);
    setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-10 right-10 z-[200]">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-brand-500 text-white rounded-[1.5rem] shadow-3xl hover:bg-gray-900 transition-all flex items-center justify-center animate-float group"
        >
          <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
        </button>
      ) : (
        <div className="w-[380px] bg-white rounded-[2.5rem] shadow-4xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-500 rounded-xl"><Bot size={20}/></div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">NSTORE AI</p>
                <p className="text-[10px] text-brand-500 font-bold">Online & Ready</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-brand-500 transition-colors"><X size={20}/></button>
          </div>
          
          <div ref={scrollRef} className="h-96 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed font-medium ${m.role === 'user' ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-gray-50 text-gray-900 rounded-tl-none border border-gray-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 p-4 rounded-2xl animate-pulse flex gap-1">
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 pt-0">
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:ring-2 ring-brand-500/10 transition-all">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about premium gadgets..." 
                className="bg-transparent border-none focus:ring-0 text-xs font-bold flex-1 px-3"
              />
              <button onClick={handleSend} className="p-3 bg-gray-900 text-white rounded-xl hover:bg-brand-500 transition-all">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
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
      <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-4xl flex items-center gap-6 relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500 blur-[100px] opacity-20"></div>
        <div className="bg-brand-500/10 p-4 rounded-2xl text-brand-500 border border-brand-500/20">
          <Award size={32} />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-sm tracking-widest uppercase mb-1">Customer Access</h4>
          <p className="text-xs text-gray-400 font-bold leading-relaxed">Sign in to track orders and earn points on every purchase.</p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => { closeAuthNotify(); navigate('/register-user'); }} className="bg-brand-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-900 transition-all">Sign In</button>
          <button onClick={closeAuthNotify} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">Maybe Later</button>
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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ease-in-out ${
      scrolled 
        ? 'bg-black/70 backdrop-blur-md border-b border-white/10 py-4 shadow-xl' 
        : 'bg-transparent py-8 border-b border-transparent'
    }`}>
      <div className="container mx-auto px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-brand-500 p-2.5 rounded-[1rem] shadow-xl shadow-brand-500/30 group-hover:rotate-12 transition-transform">
            <Package className="text-white" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase">
            NSTORE<span className="text-brand-500">.ONLINE</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-12">
          <Link to="/products" className="text-[11px] font-black text-white/80 hover:text-brand-500 transition-colors uppercase tracking-[0.2em]">Curated Catalog</Link>
          <Link to="/register-vendor" className="text-[11px] font-black text-brand-500 hover:text-brand-600 transition-colors uppercase tracking-[0.2em] flex items-center gap-2">
             <Store size={14} /> Become a Vendor
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <div className="relative">
            {user ? (
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1.5 pr-5 bg-white/10 hover:bg-white/20 transition-all border border-white/10 rounded-full"
              >
                <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-brand-500" alt="" />
                <span className="text-[10px] font-black text-white hidden sm:block uppercase tracking-widest">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-white/60" />
              </button>
            ) : (
              <Link to="/register-user" className="p-3 rounded-full hover:bg-white/10 transition-all text-white flex items-center gap-3 font-black uppercase tracking-widest text-[10px]">
                <User size={20} className="stroke-[3]" />
                <span className="hidden sm:block">Identity</span>
              </Link>
            )}

            {showUserMenu && user && (
              <div className="absolute right-0 top-full pt-4 w-64 animate-fade-in-up" onMouseLeave={() => setShowUserMenu(false)}>
                <div className="bg-white rounded-[2.5rem] shadow-4xl border border-gray-100 p-3 flex flex-col gap-1 overflow-hidden">
                  <div className="px-6 py-5 bg-gray-50 rounded-2xl mb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated Account</p>
                    <p className="text-[11px] font-black text-gray-900 truncate tracking-tight">{user.email}</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-brand-50 text-[11px] font-black text-gray-600 hover:text-brand-500 transition-all uppercase tracking-widest">
                    <LayoutDashboard size={18} /> My Space
                  </Link>
                  <button onClick={logout} className="flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-red-50 text-[11px] font-black text-red-500 transition-all w-full text-left uppercase tracking-widest">
                    <LogOut size={18} /> De-authenticate
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link to="/cart" className="relative p-3 rounded-full hover:bg-white/10 transition-all text-white bg-white/5">
            <ShoppingCart size={20} className="stroke-[3]" />
            {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-900 animate-pulse">{totalItems}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
};

const HomePage = () => {
  const { products } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(s => (s + 1) % HERO_SLIDES.length), 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-fade-in">
      <section className="relative h-[100vh] w-full overflow-hidden bg-gray-950">
        <div className="hero-carousel-container" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {HERO_SLIDES.map((slide) => (
            <div key={slide.id} className="hero-slide relative flex items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/40 to-transparent z-10"></div>
              <img src={slide.image} className="absolute inset-0 w-full h-full object-cover scale-105" alt="" />
              <div className="container mx-auto px-10 relative z-20 flex flex-col items-start justify-center">
                <div className="max-w-5xl text-left">
                  <span className="inline-block bg-brand-500 text-white text-[10px] font-black uppercase tracking-[0.6em] px-8 py-3 rounded-2xl mb-10 shadow-2xl animate-fade-in-down">{slide.category}</span>
                  <h1 className="text-8xl md:text-[11rem] font-black text-white tracking-tighter leading-[0.8] mb-12 animate-fade-in-up uppercase">
                    <WordAlignedTitle text={slide.title} />
                  </h1>
                  <p className="text-2xl text-gray-300 font-medium mb-16 max-w-2xl animate-fade-in-up leading-relaxed tracking-tight opacity-80">{slide.subtitle}</p>
                  <div className="flex flex-wrap gap-8 animate-fade-in-up">
                    <Link to="/products" className="bg-brand-500 text-white px-20 py-8 rounded-[2.5rem] font-black tracking-[0.2em] text-[11px] hover:bg-white hover:text-gray-950 transition-all shadow-3xl flex items-center gap-4 group uppercase">
                      {slide.cta} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="absolute bottom-20 left-20 z-30 flex gap-6">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 transition-all duration-1000 rounded-full ${i === currentSlide ? 'w-24 bg-brand-500' : 'w-8 bg-white/20 hover:bg-white/40'}`} />
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
            <Link to="/products" className="group flex items-center gap-6 text-xl font-black tracking-tighter text-gray-900 border-b-4 border-brand-500 pb-4 hover:text-brand-500 transition-all uppercase">Enter Official Catalog <ArrowRight className="group-hover:translate-x-3 transition-transform" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {products.filter(p => p.isFeatured).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>
    </div>
  );
}