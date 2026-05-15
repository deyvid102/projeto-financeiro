import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, ShoppingBag, TrendingUp, Star, ShoppingCart } from 'lucide-react';

const ShopSidebar = () => {
  const [dynamicAds, setDynamicAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => {
    let url = '';
    try {
      url = import.meta.env?.VITE_API_URL || process.env?.REACT_APP_API_URL || '';
    } catch (e) {
      url = '';
    }
    if (!url) return 'http://localhost:5000';
    return url.endsWith('/api') ? url.slice(0, -4) : url;
  };

  const defaultAds = [
    {
      id: 'def-1',
      tag: "EM ALTA",
      title: "Celulares e Smartphones",
      desc: "Confira as últimas novidades em iPhone e Android na nossa loja.",
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
        const API_BASE = getApiUrl();
        
        const response = await axios.get(`${API_BASE}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const wishlist = response.data;

        if (wishlist && wishlist.length > 0) {
          const activeItems = wishlist
            .filter(item => item.itemStatus !== 'comprado')
            .slice(0, 3);

          const personalizedAds = activeItems.map((item, index) => ({
            id: item._id || `dynamic-${index}`,
            tag: "SEU DESEJO",
            title: item.itemName,
            desc: item.estimatedPrice > 0 
              ? `Buscamos ofertas de ${item.itemName} até R$ ${item.estimatedPrice.toLocaleString('pt-BR')} na Magalu!`
              : `Veja as melhores ofertas para ${item.itemName} na nossa loja parceira.`,
            link: item.affiliateLink,
            icon: <Star size={14} className="text-brand fill-brand/20" />,
            color: "from-brand/20"
          }));

          setDynamicAds(personalizedAds.length < 2 ? [...personalizedAds, defaultAds[0]] : personalizedAds);
        } else {
          setDynamicAds(defaultAds);
        }
      } catch (error) {
        setDynamicAds(defaultAds);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistAds();
  }, []);

  if (loading) return (
    <div className="space-y-4 p-5 animate-in fade-in duration-500">
      <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-4" />
      {[1, 2].map(i => (
        <div key={i} className="h-28 w-full bg-white/5 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full p-5 justify-between animate-in fade-in duration-700">
      <div>
        {/* Header da Seção */}
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-[10px] font-black text-text-secondary uppercase italic tracking-[0.2em] whitespace-nowrap">
            Sugestões FinanceMax
          </h4>
          <div className="h-[1px] flex-1 bg-white/5 ml-4"></div>
        </div>

        {/* Lista de Cards - Ajustada para flex-row no mobile para caber perfeitamente */}
        <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
          {dynamicAds.map((ad) => (
            <a 
              key={ad.id} 
              href={ad.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group relative block min-w-[240px] md:min-w-0 flex-1"
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${ad.color} to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm`}></div>
              
              <div className="relative p-4 rounded-2xl bg-bg-secondary/20 md:bg-bg-secondary/40 border border-white/5 group-hover:border-brand/30 transition-all duration-300 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black italic px-2 py-0.5 rounded-md bg-brand/10 text-brand uppercase">
                      {ad.tag}
                    </span>
                    {ad.icon}
                  </div>
                  
                  <h5 className="text-xs font-bold text-text-primary mb-1 group-hover:text-brand transition-colors uppercase truncate">
                    {ad.title}
                  </h5>
                  
                  <p className="text-[10px] text-text-secondary leading-relaxed mb-3 line-clamp-2 opacity-70">
                    {ad.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[9px] font-bold text-brand uppercase tracking-tighter group-hover:gap-2 transition-all mt-auto">
                  Ver na Magalu <ExternalLink size={10} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Rodapé da Sidebar (Wishlist Sync) */}
      <div className="mt-6 pt-4 border-t border-white/5 text-center hidden md:block">
        <div className="flex items-center justify-center gap-2 mb-2 opacity-30">
           <ShoppingCart size={12} className="text-text-secondary" />
           <span className="text-[9px] font-bold text-text-secondary uppercase">Wishlist Sync</span>
        </div>
        <p className="text-[9px] text-text-secondary italic leading-tight opacity-40">
          Ofertas baseadas nos seus objetivos através da <span className="text-brand font-bold text-[10px]">Magazine FinanceMax</span>
        </p>
      </div>
    </div>
  );
};

export default ShopSidebar;