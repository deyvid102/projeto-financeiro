import ShoppingCart from '../models/ModelShoppingCart.js';
import { CATEGORY_DATA } from '../shop/CategoryData.js'; // Importando o mapeamento de links

// Função auxiliar para descobrir categoria e link baseado no nome
const getAffiliateMatch = (itemName) => {
  const nameLower = itemName.toLowerCase().trim();
  let matchedCategory = 'Utilidades Domésticas';
  let affiliateLink = CATEGORY_DATA['Utilidades Domésticas'].link;

  for (const [category, data] of Object.entries(CATEGORY_DATA)) {
    if (data.keywords.some(kw => nameLower.includes(kw.toLowerCase()))) {
      matchedCategory = category;
      affiliateLink = data.link;
      break;
    }
  }
  return { matchedCategory, affiliateLink };
};

export const getCartItems = async (req, res) => {
  try {
    const items = await ShoppingCart.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar itens', error: error.message });
  }
};

export const createCartItem = async (req, res) => {
  try {
    const { itemName, estimatedPrice, notes } = req.body;

    // Lógica automática de link e categoria baseada no nome
    const { matchedCategory, affiliateLink } = getAffiliateMatch(itemName);

    const item = await ShoppingCart.create({
      user: req.user.id,
      itemName: itemName.trim(),
      category: matchedCategory,
      estimatedPrice,
      affiliateLink: affiliateLink, // Link Magazine FinanceMax automático
      notes
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar item', error: error.message });
  }
};

// UPDATE: Edita o item e RECALCULA o link se o nome mudar
export const updateCartItem = async (req, res) => {
  try {
    const { itemName, estimatedPrice, itemStatus, notes } = req.body;
    
    const item = await ShoppingCart.findOne({ _id: req.params.id, user: req.user.id });

    if (!item) {
      return res.status(404).json({ message: 'Item não encontrado.' });
    }

    // Se o nome mudou, recalculamos a categoria e o link de afiliado
    if (itemName && itemName.trim() !== item.itemName) {
      const { matchedCategory, affiliateLink } = getAffiliateMatch(itemName);
      item.itemName = itemName.trim();
      item.category = matchedCategory;
      item.affiliateLink = affiliateLink;
    }

    if (estimatedPrice !== undefined) item.estimatedPrice = estimatedPrice;
    if (itemStatus) item.itemStatus = itemStatus;
    if (notes !== undefined) item.notes = notes;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar item', error: error.message });
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const item = await ShoppingCart.findOne({ _id: req.params.id, user: req.user.id });

    if (!item) {
      return res.status(404).json({ message: 'Item não encontrado.' });
    }

    await item.deleteOne();
    res.json({ message: 'Item removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar item', error: error.message });
  }
};