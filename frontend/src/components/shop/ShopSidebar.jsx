import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, ShoppingBag, TrendingUp, Star, ShoppingCart } from 'lucide-react';

const ShopSidebar = () => {
  const [dynamicAds, setDynamicAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para limpar a URL da API e evitar o erro de duplicidade /api/api
  const getApiUrl = () => {
    let url = '';
    try {
      url = import.meta.env?.VITE_API_URL || process.env?.REACT_APP_API_URL || '';
    } catch (e) {
      url = '';
    }

    if (!url) return 'http://localhost:5000';

    // Remove o /api do final se ele existir na variável de ambiente
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
        
        // Buscamos os itens diretamente da wishlist (cart)
        const response = await axios.get(`${API_BASE}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const wishlist = response.data;

        if (wishlist && wishlist.length > 0) {
          // Filtramos apenas itens que ainda não foram "comprados" e pegamos os 3 primeiros
          const activeItems = wishlist
            .filter(item => item.itemStatus !== 'comprado')
            .slice(0, 3);

          const personalizedAds = activeItems.map((item, index) => ({
            id: item._id || `dynamic-${index}`,
            tag: "SEU DESEJO",
            title: item.itemName,
            // Texto dinâmico usando o preço estimado
            desc: item.estimatedPrice > 0 
              ? `Buscamos ofertas de ${item.itemName} até R$ ${item.estimatedPrice.toLocaleString('pt-BR')} na Magalu!`
              : `Veja as melhores ofertas para ${item.itemName} na nossa loja parceira.`,
            link: item.affiliateLink, // O link inteligente gerado pelo backend
            icon: <Star size={14} className="text-brand fill-brand/20" />,
            color: "from-brand/20"
          }));

          // Fallback: se tiver poucos itens na wishlist, mescla com os padrões
          if (personalizedAds.length < 2) {
            setDynamicAds([...personalizedAds, defaultAds[0]]);
          } else {
            setDynamicAds(personalizedAds);
          }
        } else {
          setDynamicAds(defaultAds);
        }
      } catch (error) {
        console.error("Erro ao carregar anúncios:", error.message);
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
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 w-full bg-white/5 rounded-2xl animate-pulse" />
        ))}
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
          <a 
            key={ad.id} 
            href={ad.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group relative block"
          >
            {/* Efeito Glow no Hover */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${ad.color} to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur`}></div>
            
            <div className="relative p-4 rounded-2xl bg-bg-main border border-white/5 group-hover:border-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black italic px-2 py-0.5 rounded-full bg-white/5 text-brand uppercase">
                  {ad.tag}
                </span>
                {ad.icon}
              </div>
              
              <h5 className="text-xs font-bold text-text-primary mb-1 group-hover:text-brand transition-colors uppercase truncate">
                {ad.title}
              </h5>
              
              <p className="text-[10px] text-text-secondary leading-relaxed mb-3 line-clamp-2">
                {ad.desc}
              </p>

              <div className="flex items-center gap-1 text-[9px] font-bold text-brand uppercase tracking-tighter">
                Ver na Magalu <ExternalLink size={10} />
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-2 opacity-50">
           <ShoppingCart size={12} className="text-text-secondary" />
           <span className="text-[9px] font-bold text-text-secondary uppercase">Wishlist Sync</span>
        </div>
        <p className="text-[9px] text-text-secondary italic leading-tight">
          Ofertas baseadas nos seus objetivos através da <span className="text-brand font-bold text-[10px]">Magazine FinanceMax</span>
        </p>
      </div>
    </aside>
  );
};

export default ShopSidebar;