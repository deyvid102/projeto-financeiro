import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, ShoppingBag, TrendingUp, Sparkles, ShoppingCart } from 'lucide-react';

const ShopSidebar = () => {
  const [dynamicAds, setDynamicAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Solução para o erro 'process is not defined'
  // Tenta Vite (import.meta.env) ou CRA (process.env) ou fallback para localhost
  const getApiUrl = () => {
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
      if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
      }
    } catch (e) {
      // Ignora erro de referência
    }
    return 'http://localhost:5000'; // URL padrão
  };

  const defaultAds = [
    {
      id: 'def-1',
      tag: "OFERTA",
      title: "Celulares e Smartphones",
      desc: "Confira as últimas novidades em iPhone e Android.",
      link: "https://www.magazinevoce.com.br/magazinefinancemax/celulares-e-smartphones/l/te/",
      icon: <TrendingUp size={14} className="text-brand" />,
      color: "from-brand/20"
    },
    {
      id: 'def-2',
      tag: "CASA",
      title: "Eletrodomésticos",
      desc: "Tudo o que a sua cozinha precisa com os melhores preços.",
      link: "https://www.magazinevoce.com.br/magazinefinancemax/eletrodomesticos/l/ed/",
      icon: <ShoppingBag size={14} className="text-orange-500" />,
      color: "from-orange-500/10"
    }
  ];

  useEffect(() => {
    const fetchWishlistAds = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = getApiUrl();
        
        const response = await axios.get(`${API_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const wishlist = response.data;

        if (wishlist && wishlist.length > 0) {
          const userCategories = [...new Set(wishlist.map(item => item.category))];

          const personalizedAds = userCategories.map((cat, index) => {
            const item = wishlist.find(i => i.category === cat);
            return {
              id: `dynamic-${index}`,
              tag: "PARA VOCÊ",
              title: cat,
              desc: `Baseado no seu interesse em "${item.itemName}".`,
              link: item.affiliateLink,
              icon: <Sparkles size={14} className="text-brand" />,
              color: "from-brand/20"
            };
          }).slice(0, 3);

          setDynamicAds(personalizedAds.length < 2 ? [...personalizedAds, defaultAds[0]] : personalizedAds);
        } else {
          setDynamicAds(defaultAds);
        }
      } catch (error) {
        console.error("Erro ao carregar anúncios dinâmicos:", error.message);
        setDynamicAds(defaultAds);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistAds();
  }, []);

  if (loading) return (
    <aside className="hidden xl:flex w-72 flex-col p-6 border-l border-white/5 bg-bg-secondary/30 h-full">
      <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-8" />
      <div className="space-y-4">
        <div className="h-32 w-full bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-32 w-full bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </aside>
  );

  return (
    <aside className="hidden xl:flex w-72 flex-col p-6 border-l border-white/5 bg-bg-secondary/30 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-[10px] font-black text-text-secondary uppercase italic tracking-[0.2em]">
          Sugestões FinanceMax
        </h4>
        <div className="h-[1px] flex-1 bg-white/5 ml-4"></div>
      </div>

      <div className="flex flex-col gap-5">
        {dynamicAds.map((ad) => (
          <a key={ad.id} href={ad.link} target="_blank" rel="noopener noreferrer" className="group relative block">
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${ad.color} to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur`}></div>
            <div className="relative p-4 rounded-2xl bg-bg-main border border-white/5 group-hover:border-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black italic px-2 py-0.5 rounded-full bg-white/5 text-brand">{ad.tag}</span>
                {ad.icon}
              </div>
              <h5 className="text-xs font-bold text-text-primary mb-1 group-hover:text-brand transition-colors">{ad.title}</h5>
              <p className="text-[10px] text-text-secondary leading-relaxed mb-3">{ad.desc}</p>
              <div className="flex items-center gap-1 text-[9px] font-bold text-brand uppercase tracking-tighter">
                Ver na loja <ExternalLink size={10} />
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <p className="text-[9px] text-text-secondary italic text-center leading-tight">
          Ofertas exclusivas via <span className="text-brand font-bold">Magazine FinanceMax</span>
        </p>
      </div>
    </aside>
  );
};

export default ShopSidebar;