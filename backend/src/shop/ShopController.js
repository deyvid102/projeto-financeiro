import ShoppingCart from '../models/ModelShoppingCart.js';
import { CATEGORY_DATA } from './CategoryData.js';

/**
 * Cria um item na wishlist com inteligência de categoria e link de afiliado
 */
export const createSmartItem = async (req, res) => {
  try {
    const { itemName, estimatedPrice, notes } = req.body;

    if (!itemName) {
      return res.status(400).json({ message: "O nome do item é obrigatório." });
    }

    // 1. Normalização para busca (minúsculo e sem espaços extras)
    const nameLower = itemName.toLowerCase().trim();

    // 2. Valores Padrão (Fallback caso não encontre match)
    let matchedCategory = 'Utilidades Domésticas';
    let affiliateLink = CATEGORY_DATA['Utilidades Domésticas'].link;

    /**
     * 3. Lógica de Match Inteligente:
     * Percorre cada categoria e verifica se alguma palavra-chave está contida no nome do item.
     */
    const categories = Object.keys(CATEGORY_DATA);
    
    for (const category of categories) {
      const keywords = CATEGORY_DATA[category].keywords;
      
      // Verifica se alguma keyword da categoria atual existe no itemName
      const hasMatch = keywords.some(keyword => nameLower.includes(keyword.toLowerCase()));

      if (hasMatch) {
        matchedCategory = category;
        affiliateLink = CATEGORY_DATA[category].link;
        break; // Interrompe no primeiro match encontrado para performance
      }
    }

    // 4. Criação do documento no MongoDB usando o seu Model ajustado
    const newItem = new ShoppingCart({
      user: req.user.id, // Supõe que você usa um middleware de auth que popula req.user
      itemName,
      estimatedPrice: estimatedPrice || 0,
      category: matchedCategory,
      affiliateLink: affiliateLink, // Link específico da sua loja Magazine FinanceMax 
      notes: notes || '',
      itemStatus: 'pending'
    });

    await newItem.save();

    res.status(201).json({
      message: "Item adicionado com sucesso!",
      data: newItem
    });

  } catch (error) {
    console.error("Erro no ShopController:", error);
    res.status(500).json({ 
      message: "Erro interno ao processar sugestão de compra.",
      error: error.message 
    });
  }
};

/**
 * Lista itens do usuário com os links de afiliados prontos para o frontend
 */
export const getUserWishlist = async (req, res) => {
  try {
    const items = await ShoppingCart.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar wishlist", error: error.message });
  }
};