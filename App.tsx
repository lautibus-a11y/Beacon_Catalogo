
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, X, Plus, Minus, Trash2,
  Settings, ChevronRight, LayoutGrid, Star,
  ArrowRight, ChevronLeft, LogOut, Package,
  Layers, Upload, Loader2, Menu, Image as ImageIcon, Edit3,
  Volume2, VolumeX, ChevronUp, ChevronDown, CheckCircle2
} from 'lucide-react';
import { DB } from './db';
import { supabase } from './supabase';
import { Product, Category, CartItem, ProductImage } from './types';

// --- Sound Engine (Generative Audio) ---
const useSoundEngine = () => {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('beacon_sounds');
    return saved === null ? true : saved === 'true';
  });

  const play = (type: 'click' | 'cart' | 'remove' | 'open' | 'success') => {
    if (!enabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      switch (type) {
        case 'click':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          break;
        case 'cart':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          break;
        case 'remove':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          break;
        case 'open':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(200, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          break;
        case 'success':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.05);
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          break;
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { }
  };

  const toggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    localStorage.setItem('beacon_sounds', String(newState));
  };

  return { play, enabled, toggle };
};

// --- Animations Constants ---
const springConfig = { type: 'spring', damping: 30, stiffness: 200 };
const staggerChildren = { animate: { transition: { staggerChildren: 0.1 } } };
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: springConfig
};

// --- Components ---

const LighthouseIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <radialGradient id="beamRadial" cx="0%" cy="50%" r="100%">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" /><stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
      </radialGradient>
    </defs>
    <motion.g animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 4, repeat: Infinity }}>
      <motion.path d="M55 30 L0 15 Q-15 30 0 45 L55 35 Z" fill="url(#beamRadial)" style={{ transformOrigin: '55px 30px' }} animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <motion.path d="M65 30 L120 15 Q135 30 120 45 L65 35 Z" fill="url(#beamRadial)" style={{ transformOrigin: '65px 30px' }} animate={{ rotate: [5, -5, 5] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
    </motion.g>
    <g fill="url(#goldGradient)">
      <circle cx="60" cy="15" r="1.5" />
      <path d="M52 22 L68 22 L60 15 Z" />
      <path d="M54 24 H66 V35 H54 V24 Z" opacity="0.3" />
      <path d="M54 38 L50 115 H70 L66 38 Z" />
      <path d="M10 145 L30 130 L55 140 L70 120 L90 140 L110 130 L130 145 V160 H10 Z" />
    </g>
    <motion.circle cx="60" cy="30" r="6" fill="#fff" filter="url(#logoGlow)" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
  </svg>
);

const SkeletonCard = () => (
  <div className="bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-full animate-pulse">
    <div className="aspect-[4/5] bg-white/5 skeleton" />
    <div className="p-6 space-y-4">
      <div className="h-6 w-3/4 bg-white/5 rounded skeleton" />
      <div className="h-4 w-full bg-white/5 rounded skeleton" />
      <div className="flex justify-between items-center pt-4">
        <div className="h-8 w-1/3 bg-white/5 rounded skeleton" />
        <div className="h-12 w-12 bg-white/5 rounded-2xl skeleton" />
      </div>
    </div>
  </div>
);

const ParticleBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute bg-[#FFD700]/10 rounded-full"
        style={{
          width: (Math.random() * 3 + 1) + 'px',
          height: (Math.random() * 3 + 1) + 'px',
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
        }}
        animate={{
          y: [0, -200],
          x: [0, (Math.random() - 0.5) * 100],
          opacity: [0, 0.5, 0]
        }}
        transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
      />
    ))}
  </div>
);

/**
 * ImageCarousel optimizado: Ratio de aspecto fijo inquebrantable
 */
const ImageCarousel = ({ images, height = "h-full", showDots = true }: { images: ProductImage[], height?: string, showDots?: boolean }) => {
  const [index, setIndex] = useState(0);
  const sortedImages = useMemo(() => [...images].sort((a, b) => a.order - b.order), [images]);

  if (sortedImages.length === 0) return (
    <div className={`${height} w-full bg-white/5 flex items-center justify-center text-gray-700 min-h-[200px]`}>
      <ImageIcon size={48} />
    </div>
  );

  return (
    <div className={`relative ${height} w-full overflow-hidden group touch-pan-y`}>
      <AnimatePresence mode="wait">
        <motion.img
          key={sortedImages[index].id}
          src={sortedImages[index].url}
          initial={{ opacity: 0, x: 50, scale: 1.1 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full object-cover object-center absolute inset-0"
          loading="lazy"
        />
      </AnimatePresence>

      {sortedImages.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setIndex(prev => (prev - 1 + sortedImages.length) % sortedImages.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md p-3 rounded-full opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-black/90 active:scale-90 hidden sm:block z-20"><ChevronLeft size={20} className="text-[#FFD700]" /></button>
          <button onClick={(e) => { e.stopPropagation(); setIndex(prev => (prev + 1) % sortedImages.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md p-3 rounded-full opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-black/90 active:scale-90 hidden sm:block z-20"><ChevronRight size={20} className="text-[#FFD700]" /></button>
          {showDots && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {sortedImages.map((_, i) => <button key={i} onClick={(e) => { e.stopPropagation(); setIndex(i); }} className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-[#FFD700] shadow-[0_0_10px_#FFD700]' : 'w-2 bg-white/20'}`} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// --- Product Modal ---
const ProductDetailModal = ({ product, onClose, onAddToCart }: { product: Product, onClose: () => void, onAddToCart: (p: Product) => void }) => {
  const { play } = useSoundEngine();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] w-full max-w-5xl overflow-hidden relative shadow-2xl flex flex-col lg:flex-row max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-50 p-4 bg-black/60 backdrop-blur-md rounded-2xl text-white hover:text-[#FFD700] transition-colors border border-white/5"
        >
          <X size={24} />
        </button>

        <div className="w-full lg:w-1/2 bg-black flex items-center justify-center relative aspect-[4/5] lg:aspect-auto">
          <ImageCarousel images={product.images} />
        </div>

        <div className="w-full lg:w-1/2 p-8 sm:p-16 overflow-y-auto no-scrollbar flex flex-col justify-center">
          <div className="mb-10">
            <span className="text-[#FFD700] font-mono text-[10px] tracking-[0.5em] uppercase font-black mb-4 block">Product Specifications</span>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 uppercase tracking-tight">{product.name}</h2>
            <div className="h-1 w-20 bg-[#FFD700] rounded-full mb-10" />
            <p className="text-gray-400 text-lg leading-relaxed mb-10 font-medium">{product.description}</p>
          </div>

          <div className="mt-auto pt-10 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Price Value</span>
              <span className="text-5xl font-black text-white tracking-tighter">${product.price.toLocaleString()}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { onAddToCart(product); onClose(); }}
              className="bg-white text-black font-black px-12 py-6 rounded-2xl hover:bg-[#FFD700] transition-all shadow-2xl tracking-widest text-xs uppercase flex items-center justify-center gap-3"
            >
              ADQUIRIR AHORA <ShoppingBag size={20} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---
export default function App() {
  const { play, enabled: soundEnabled, toggle: toggleSound } = useSoundEngine();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'store' | 'login' | 'admin'>('store');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [session, setSession] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([DB.getProducts(), DB.getCategories()]);
      setProducts(p);
      setCategories(c);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    fetchData();

    // Realtime Subscription
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  }), [products, searchTerm, selectedCategory]);

  const featuredProduct = useMemo(() => products.find(p => p.isFeatured) || products[0], [products]);
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    play('cart');
    setShowCart(true);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
    play('remove');
  };

  const handleOpenProduct = (p: Product) => {
    setSelectedProduct(p);
    play('open');
  };

  const handleCheckout = () => {
    play('success');
    const number = "1172023171";
    let message = "🔱 BEACON PREMIUM ORDER\n--------------------------\n";
    cart.forEach(item => message += `• ${item.name} [x${item.quantity}] - $${(item.price * item.quantity).toLocaleString()}\n`);
    message += `\n--------------------------\nTOTAL: $${total.toLocaleString()}\n\nPor favor confirmar pedido.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (view === 'login' && !session) return <AdminLogin onLoginSuccess={() => setView('admin')} />;
  if (view === 'admin' && session) return <AdminDashboard products={products} categories={categories} onUpdate={fetchData} onLogout={async () => { play('click'); await supabase.auth.signOut(); setView('store'); }} />;

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-[#FFD700] selection:text-black overflow-x-hidden">
      <ParticleBackground />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-20 sm:h-24 glass z-[500] border-b border-white/5 px-4 sm:px-10 flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 cursor-pointer group" onClick={() => { play('click'); window.location.href = '/'; }}>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center transition-all group-hover:border-[#FFD700]/40 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] overflow-hidden">
            <LighthouseIcon className="transform translate-y-3 scale-110 sm:scale-125" size={60} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-widest text-[#FFD700]">BEA<span className="text-white">CON</span></span>
            <span className="hidden sm:inline text-[8px] font-black tracking-[0.5em] text-gray-500 uppercase mt-1">Los mejores Gadgets</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 sm:gap-6">
          <button onClick={() => { play('click'); toggleSound(); }} className="p-3 text-gray-400 hover:text-[#FFD700] transition-colors rounded-xl hover:bg-white/5">
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button onClick={() => { play('click'); setView(session ? 'admin' : 'login'); }} className="p-3 text-gray-400 hover:text-[#FFD700] transition-colors rounded-xl hover:bg-white/5">
            <Settings size={22} />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { play('click'); setShowCart(true); }}
            className="relative p-3 sm:p-4 bg-[#FFD700]/10 rounded-2xl border border-[#FFD700]/20 group hover:border-[#FFD700]/50 transition-all shadow-xl"
          >
            <ShoppingBag size={22} className="text-[#FFD700]" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-[#FFD700] text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-black"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-3 sm:px-8 max-w-7xl mx-auto z-10 relative">
        <motion.section variants={fadeInUp} initial="initial" animate="animate" className="mb-8 sm:mb-20">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-8 items-center justify-between bg-white/5 border border-white/5 p-3 sm:p-6 rounded-3xl sm:rounded-[3rem] backdrop-blur-2xl shadow-2xl relative z-50">
            <div className="relative w-full lg:w-1/3 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#FFD700] transition-colors" size={16} />
              <input
                type="text"
                placeholder="BUSCAR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#FFD700]/30 transition-all font-bold tracking-widest text-[16px] sm:text-[10px] uppercase placeholder:text-gray-700 search-input-no-zoom"
              />
              <AnimatePresence>
                {searchTerm && filteredProducts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-[50vh] overflow-y-auto no-scrollbar z-[100]"
                  >
                    {filteredProducts.slice(0, 5).map(p => (
                      <div
                        key={p.id}
                        onClick={() => { play('click'); handleOpenProduct(p); setSearchTerm(''); }}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0"
                      >
                        <div className="w-10 h-10 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={p.images[0]?.url} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-white font-bold text-xs uppercase truncate">{p.name}</h4>
                          <span className="text-[#FFD700] text-[10px] font-mono font-bold">${p.price.toLocaleString()}</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-600" />
                      </div>
                    ))}
                    {filteredProducts.length > 5 && (
                      <div className="p-2 text-center text-[9px] uppercase text-gray-500 font-black tracking-widest border-t border-white/5">
                        Ver {filteredProducts.length - 5} más...
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 no-scrollbar items-center px-1">
              <button
                onClick={() => { play('click'); setSelectedCategory(null); }}
                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-[10px] sm:text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${!selectedCategory ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.4)] text-shadow-glow' : 'bg-white/5 text-gray-500 border-white/10 hover:text-white hover:bg-white/10'}`}
              >
                TODOS
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => { play('click'); setSelectedCategory(c.id); }}
                  className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-[10px] sm:text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${selectedCategory === c.id ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.4)] text-shadow-glow' : 'bg-white/5 text-gray-500 border-white/10 hover:text-white hover:bg-white/10 hover:text-shadow-glow-white'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {!selectedCategory && !searchTerm && featuredProduct && (
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 sm:mb-32 group">
            <div className="relative h-[350px] sm:h-[650px] w-full overflow-hidden rounded-[2rem] sm:rounded-[4rem] border border-white/5 shadow-2xl">
              <ImageCarousel images={featuredProduct.images} />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/95 via-black/30 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-0 p-6 sm:p-20 flex flex-col justify-end sm:justify-center max-w-3xl pointer-events-none z-20">
                <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-[#FFD700] font-mono text-[9px] sm:text-xs tracking-[0.6em] mb-2 sm:mb-8 flex items-center gap-4 uppercase font-black">
                  <div className="w-8 sm:w-12 h-px bg-[#FFD700]"></div> NEW
                </motion.span>
                <h2 className="text-3xl sm:text-7xl md:text-8xl font-black mb-4 sm:mb-10 leading-none tracking-tighter uppercase">{featuredProduct.name}</h2>
                <p className="hidden sm:block text-gray-400 text-xl mb-12 leading-relaxed font-medium line-clamp-3 max-w-xl">{featuredProduct.description}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpenProduct(featuredProduct)}
                  className="w-full sm:w-fit pointer-events-auto bg-white text-black font-black px-6 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-[#FFD700] transition-all shadow-2xl tracking-widest text-[10px] sm:text-[11px] uppercase"
                >
                  EXPLORAR <ArrowRight className="inline ml-2" size={14} />
                </motion.button>
              </div>
            </div>
          </motion.section>
        )}

        <div className="mb-6 sm:mb-12 flex items-center justify-between px-2 sm:px-4">
          <h2 className="text-xl sm:text-5xl font-black tracking-tighter flex items-center gap-2 sm:gap-4 uppercase">
            <LayoutGrid className="text-[#FFD700]" size={20} /> Catálogo <span className="text-[#FFD700] text-shadow-glow">Pro</span>
          </h2>
          <div className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] text-gray-700 uppercase">{filteredProducts.length} SKU</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div variants={staggerChildren} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-12">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(p => (
                <motion.div key={p.id} variants={fadeInUp} layout className="bg-white/5 border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden group hover:border-[#FFD700]/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all flex flex-col h-full backdrop-blur-sm relative">
                  <div className="relative cursor-pointer overflow-hidden aspect-[4/5] bg-black" onClick={() => handleOpenProduct(p)}>
                    <ImageCarousel images={p.images} showDots={false} />
                  </div>
                  <div className="p-4 sm:p-8 flex flex-col flex-grow">
                    <div className="flex-grow mb-3 sm:mb-6">
                      <h3 className="font-black text-sm sm:text-2xl mb-1 sm:mb-2 group-hover:text-[#FFD700] transition-colors line-clamp-1 uppercase tracking-tight">{p.name}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium hidden sm:block">{p.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto gap-2">
                      <span className="text-lg sm:text-3xl font-black text-white tracking-tighter text-shadow-glow-sm">${p.price.toLocaleString()}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                        className="bg-white text-black w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl flex items-center justify-center hover:bg-[#FFD700] transition-all shadow-xl"
                      >
                        <Plus size={16} className="sm:hidden" />
                        <Plus size={28} className="hidden sm:block" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[1000]" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:max-w-xl bg-[#080808] z-[1001] border-l border-white/5 flex flex-col shadow-2xl"
            >
              <div className="p-8 sm:p-10 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center text-[#FFD700] border border-[#FFD700]/20"><ShoppingBag size={24} /></div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Bolsa</h2>
                </div>
                <button onClick={() => { play('click'); setShowCart(false); }} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><X size={28} /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-10 space-y-10 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 opacity-20">
                    <ShoppingBag size={80} className="mb-8" />
                    <p className="text-sm font-black uppercase tracking-[0.6em]">VACÍO</p>
                  </div>
                ) :
                  cart.map((item) => (
                    <motion.div layout key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="flex gap-6 group">
                      <div className="w-28 h-28 rounded-[1.5rem] overflow-hidden border border-white/5 flex-shrink-0 bg-black aspect-square">
                        <img src={item.images[0]?.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </div>
                      <div className="flex-grow flex flex-col justify-center">
                        <h4 className="font-black text-xl mb-1 tracking-tight group-hover:text-[#FFD700] transition-colors uppercase line-clamp-1">{item.name}</h4>
                        <div className="flex items-center gap-4 mb-4 bg-white/5 w-fit px-4 py-1.5 rounded-full border border-white/5">
                          <button onClick={() => { play('click'); setCart(prev => prev.map(it => it.id === item.id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it)) }} className="text-gray-500 hover:text-[#FFD700]"><Minus size={16} /></button>
                          <span className="font-mono font-bold text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => { play('click'); setCart(prev => prev.map(it => it.id === item.id ? { ...it, quantity: it.quantity + 1 } : it)) }} className="text-gray-500 hover:text-[#FFD700]"><Plus size={16} /></button>
                        </div>
                        <p className="font-black text-[#FFD700] text-2xl tracking-tighter">${(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleRemoveFromCart(item.id)} className="text-gray-600 hover:text-red-500 self-start p-3 bg-white/5 rounded-2xl transition-all border border-white/5"><Trash2 size={22} /></button>
                    </motion.div>
                  ))
                }
              </div>
              {cart.length > 0 && (
                <div className="p-10 border-t border-white/5 bg-black/80 backdrop-blur-3xl">
                  <div className="flex justify-between items-end mb-10">
                    <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">SUBTOTAL</span>
                    <span className="text-5xl font-black text-white tracking-tighter">${total.toLocaleString()}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    className="w-full bg-[#FFD700] text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 hover:bg-[#DAA520] shadow-[0_20px_50px_rgba(255,215,0,0.15)] text-xl uppercase tracking-widest"
                  >
                    REALIZAR PEDIDO <ArrowRight size={28} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal product={selectedProduct} onClose={() => { play('click'); setSelectedProduct(null); }} onAddToCart={handleAddToCart} />
        )}
      </AnimatePresence>

      <footer className="py-24 border-t border-white/5 bg-black z-10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center">
          <LighthouseIcon size={120} className="mb-12" />
          <p className="text-gray-600 text-[10px] max-w-xl text-center mb-12 leading-relaxed uppercase tracking-[0.5em] font-black">Beacon Global Dynamics: Precision Tech & Aesthetics. The absolute standard for premium hardware distribution.</p>
          <div className="flex flex-wrap justify-center gap-12 mb-16">
            {['Instagram', 'X', 'LinkedIn', 'Terminal'].map(social => (
              <a key={social} href="#" className="text-[10px] font-black text-gray-700 hover:text-[#FFD700] transition-colors uppercase tracking-[0.4em]">{social}</a>
            ))}
          </div>
          <div className="text-[9px] font-black tracking-[0.8em] text-gray-900 uppercase">© 2024 BEACON DYNAMICS • AREA_BUE</div>
        </div>
      </footer>
    </div>
  );
}

// --- Admin Section ---

const AdminDashboard = ({ products, categories, onUpdate, onLogout }: any) => {
  const { play } = useSoundEngine();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);

  const stats = useMemo(() => ({
    total: products.length,
    value: products.reduce((a: any, b: any) => a + Number(b.price), 0),
    featured: products.filter((p: any) => p.isFeatured).length
  }), [products]);

  const handleSaveProduct = async (e: any) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.categoryId) {
      alert('El producto debe tener una categoría válida.');
      return;
    }

    try {
      await DB.saveProduct(editingProduct);
      setEditingProduct(null);
      onUpdate();
      play('success');
      onUpdate();
      play('success');
    } catch (e: any) {
      console.error('Error saving product:', e);
      if (e.message?.includes('row-level security policy')) {
        alert('Error de permisos (RLS): No tienes permiso para guardar productos. Verifica las políticas en Supabase.');
      } else {
        alert(e.message || 'Error al guardar el producto');
      }
    }
  };

  const handleSaveCategory = async (e: any) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await DB.saveCategory(editingCategory);
      setEditingCategory(null);
      onUpdate();
      play('success');
      onUpdate();
      play('success');
    } catch (e: any) {
      console.error('Error saving category:', e);
      if (e.message?.includes('row-level security policy')) {
        alert('Error de permisos (RLS): No tienes permiso para guardar categorías. Verifica las políticas en Supabase.');
      } else {
        alert(e.message || 'Error al guardar la categoría');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setUploading(true);
    try {
      const sanitizedName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${Date.now()}_${sanitizedName}`;
      const { data, error } = await supabase.storage.from('products').upload(`images/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(data.path);

      const newImages = [...editingProduct.images];
      newImages.push({
        id: `img_temp_${Date.now()}`,
        url: publicUrl,
        order: newImages.length
      });
      setEditingProduct({ ...editingProduct, images: newImages });
    } catch (e: any) {
      console.error('Error uploading image:', e);
      if (e.message?.includes('row-level security policy')) {
        alert('Error de permisos (RLS): No tienes permiso para subir imágenes. Verifica las políticas de Storage "products" en Supabase.');
      } else {
        alert(e.message || 'Error al subir la imagen');
      }
    }
    setUploading(false);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (!editingProduct) return;
    const newImages = [...editingProduct.images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newImages.length) return;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row">
      <aside className="w-full lg:w-80 border-r border-white/5 bg-black flex flex-col h-auto lg:h-screen sticky top-0 z-[100]">
        <div className="p-10 border-b border-white/5 flex items-center gap-4">
          <LighthouseIcon size={40} className="translate-y-2" />
          <span className="font-black text-[#FFD700] tracking-widest text-lg uppercase">ADMIN</span>
        </div>
        <nav className="p-8 flex-grow space-y-3">
          <button onClick={() => { play('click'); setActiveTab('products'); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'products' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Package size={20} /> Productos
          </button>
          <button onClick={() => { play('click'); setActiveTab('categories'); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'categories' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Layers size={20} /> Categorías
          </button>
        </nav>
        <div className="p-8 border-t border-white/5">
          <button onClick={() => { play('click'); onLogout(); }} className="w-full flex items-center gap-4 px-6 py-4 text-red-500 font-bold hover:bg-red-500/10 rounded-2xl transition-all">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-grow p-8 lg:p-16 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-16">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
            {activeTab === 'products' ? 'Inventario' : 'Categorías'}
          </h1>
          <button
            onClick={() => {
              if (activeTab === 'products') {
                if (categories.length === 0) {
                  alert('Debes crear al menos una categoría antes de agregar productos.');
                  return;
                }
                setEditingProduct({ id: `p_temp_${Date.now()}`, name: '', price: 0, description: '', categoryId: categories[0]?.id || '', images: [], isFeatured: false, createdAt: Date.now() });
              } else {
                setEditingCategory({ id: `c_temp_${Date.now()}`, name: '' });
              }
            }}
            className="w-full sm:w-auto bg-white text-black font-black px-10 py-4 rounded-2xl hover:bg-[#FFD700] transition-all shadow-xl uppercase text-xs tracking-widest"
          >
            + NUEVO REGISTRO
          </button>
        </header>

        {activeTab === 'products' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5"><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Items</p><p className="text-4xl font-black">{stats.total}</p></div>
              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5"><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Capital</p><p className="text-4xl font-black text-[#FFD700]">${stats.value.toLocaleString()}</p></div>
              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5"><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Destacados</p><p className="text-4xl font-black">{stats.featured}</p></div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="p-8 text-[10px] font-black uppercase text-gray-500 tracking-widest">Producto</th>
                    <th className="p-8 text-[10px] font-black uppercase text-gray-500 tracking-widest hidden sm:table-cell">Precio</th>
                    <th className="p-8 text-[10px] font-black uppercase text-gray-500 tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((p: Product) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-8"><div className="flex items-center gap-5"><div className="w-12 h-12 bg-black rounded-xl overflow-hidden border border-white/10 aspect-square"><img src={p.images[0]?.url} className="w-full h-full object-cover" /></div><span className="font-bold text-lg uppercase line-clamp-1">{p.name}</span>{p.isFeatured && <Star size={14} className="text-[#FFD700] fill-[#FFD700]" />}</div></td>
                      <td className="p-8 font-black text-xl text-[#FFD700] hidden sm:table-cell">${p.price.toLocaleString()}</td>
                      <td className="p-8">
                        <div className="flex gap-3">
                          <button onClick={() => setEditingProduct(p)} className="p-3 bg-white/5 hover:bg-[#FFD700] hover:text-black rounded-xl transition-all"><Edit3 size={18} /></button>
                          <button onClick={async () => {
                            if (confirm('Eliminar producto?')) {
                              try {
                                await DB.deleteProduct(p.id);
                                onUpdate();
                                play('remove');
                              } catch (e: any) {
                                console.error(e);
                                alert(e.message || 'Error al eliminar');
                              }
                            }
                          }} className="p-3 bg-white/5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="p-8 text-[10px] font-black uppercase text-gray-500 tracking-widest">Nombre</th>
                  <th className="p-8 text-[10px] font-black uppercase text-gray-500 tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((c: Category) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-8"><span className="font-bold text-lg uppercase">{c.name}</span></td>
                    <td className="p-8">
                      <div className="flex gap-3">
                        <button onClick={() => setEditingCategory(c)} className="p-3 bg-white/5 hover:bg-[#FFD700] hover:text-black rounded-xl transition-all"><Edit3 size={18} /></button>
                        <button onClick={async () => {
                          if (confirm('Eliminar categoría?')) {
                            try {
                              await DB.deleteCategory(c.id);
                              onUpdate();
                              play('remove');
                            } catch (e: any) {
                              console.error(e);
                              alert(e.message || 'Error al eliminar');
                            }
                          }
                        }} className="p-3 bg-white/5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Product Modal Editor */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingProduct(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-[#0d0d0d] border border-white/10 p-6 sm:p-10 rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto relative shadow-2xl no-scrollbar">
              <h2 className="text-3xl font-black mb-10 uppercase flex items-center gap-4"><Edit3 size={32} className="text-[#FFD700]" /> Editor de Producto</h2>
              <form onSubmit={handleSaveProduct} className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Nombre del Gadget</label><input value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 outline-none font-bold uppercase" required /></div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Precio ($)</label><input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 outline-none font-bold" required /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Categoría</label>
                        <select value={editingProduct.categoryId} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 outline-none font-bold appearance-none uppercase">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Descripción Técnica</label><textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 h-44 outline-none resize-none" required /></div>
                    <div className="flex items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                      <input type="checkbox" checked={editingProduct.isFeatured} onChange={e => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })} className="w-6 h-6 accent-[#FFD700] cursor-pointer" id="isFeatured" />
                      <label htmlFor="isFeatured" className="font-bold text-gray-300 uppercase text-xs tracking-widest cursor-pointer">Destacar en Portada</label>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Galería de Imágenes (Arrastra para reordenar próximamente)</label>
                      <label className={`cursor-pointer bg-[#FFD700] text-black p-3 rounded-xl hover:bg-white transition-all ${uploading ? 'opacity-50' : ''}`}>
                        <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" disabled={uploading} />
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                      </label>
                    </div>

                    <div className="space-y-4">
                      <AnimatePresence mode="popLayout">
                        {editingProduct.images.map((img, idx) => (
                          <motion.div layout key={img.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 aspect-square"><img src={img.url} className="w-full h-full object-cover" /></div>
                            <div className="flex-grow">
                              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Imagen {idx === 0 ? 'Principal' : idx + 1}</span>
                              <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{img.url}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => moveImage(idx, 'up')} disabled={idx === 0} className="p-2 text-gray-500 hover:text-white disabled:opacity-20"><ChevronUp size={18} /></button>
                              <button type="button" onClick={() => moveImage(idx, 'down')} disabled={idx === editingProduct.images.length - 1} className="p-2 text-gray-500 hover:text-white disabled:opacity-20"><ChevronDown size={18} /></button>
                              <button type="button" onClick={() => setEditingProduct({ ...editingProduct, images: editingProduct.images.filter(i => i.id !== img.id) })} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {editingProduct.images.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl opacity-30">
                          <ImageIcon size={48} className="mx-auto mb-4" />
                          <p className="text-xs uppercase font-black tracking-[0.3em]">Sin imágenes vinculadas</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-10 border-t border-white/5">
                  <button type="submit" className="flex-grow bg-[#FFD700] text-black font-black py-6 rounded-2xl shadow-[0_20px_40px_rgba(255,215,0,0.15)] uppercase tracking-widest hover:bg-white transition-all">GUARDAR CAMBIOS</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="px-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all uppercase text-xs">CANCELAR</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal Editor */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingCategory(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-[#0d0d0d] border border-white/10 p-10 rounded-[3rem] w-full max-w-md relative shadow-2xl">
              <h2 className="text-3xl font-black mb-10 uppercase flex items-center gap-4">Categoría</h2>
              <form onSubmit={handleSaveCategory} className="space-y-8">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Nombre</label><input value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 outline-none font-bold uppercase" required /></div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-grow bg-[#FFD700] text-black font-black py-5 rounded-2xl uppercase tracking-widest">GUARDAR</button>
                  <button type="button" onClick={() => setEditingCategory(null)} className="px-8 bg-white/5 rounded-2xl uppercase text-[10px] font-black">SALIR</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminLogin = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const { play } = useSoundEngine();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      play('success');
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505]">
      <ParticleBackground />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="bg-white/5 border border-white/5 p-12 rounded-[3rem] backdrop-blur-2xl shadow-2xl text-center">
          <LighthouseIcon size={100} className="mx-auto mb-10 translate-y-4" />
          <h1 className="text-3xl font-black mb-10 tracking-tighter uppercase">AUTH_<span className="text-[#FFD700]">BEACON</span></h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-2xl p-5 outline-none focus:border-[#FFD700]/30 transition-all font-bold placeholder:text-gray-700 text-sm" placeholder="ADMIN EMAIL" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-2xl p-5 outline-none focus:border-[#FFD700]/30 transition-all font-bold placeholder:text-gray-700 text-sm" placeholder="PASSWORD" required />
            {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-bold uppercase">{error}</motion.p>}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-[#FFD700] text-black font-black p-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#DAA520] disabled:opacity-50 uppercase text-xs tracking-widest transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'INICIAR ENLACE'}
            </motion.button>
          </form>
          <button onClick={() => { play('click'); window.location.href = '/'; }} className="mt-10 text-[9px] font-black tracking-widest text-gray-700 hover:text-white uppercase transition-colors">Volver al terminal público</button>
        </div>
      </motion.div>
    </div>
  );
};
