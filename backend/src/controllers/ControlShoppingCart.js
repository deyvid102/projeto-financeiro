import ShoppingCart from '../models/ModelShoppingCart.js';

/**
 * Gera o link de afiliado dinâmico com busca e filtro de preço
 * Padrão Magalu: /busca/termo/?filters=price---0%3AMAX
 */
const generateSmartLink = (itemName, price) => {
  const storeID = "magazinefinancemax";
  
  // 1. Limpa o nome: remove acentos, símbolos e troca espaços por +
  const cleanName = itemName
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s]/gi, '')        // Remove símbolos
    .replace(/\s+/g, '+')            // Espaços viram +
    .toLowerCase();

  // 2. Formata o preço para o padrão de centavos colados (1300.00 -> 130000)
  // O padrão do filtro é 0%3A + preço final sem vírgula
  let priceFilter = "";
  if (price && price > 0) {
    const maxPriceCents = Math.round(price * 100); 
    priceFilter = `?filters=price---0%3A${maxPriceCents}`;
  }

  return `https://www.magazinevoce.com.br/${storeID}/busca/${cleanName}/${priceFilter}`;
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

    // Gera o link inteligente baseado no nome e preço digitados
    const affiliateLink = generateSmartLink(itemName, estimatedPrice);

    const item = await ShoppingCart.create({
      user: req.user.id,
      itemName: itemName.trim(),
      category: "Shopping", // Categoria padrão ou você pode manter a lógica de keywords se desejar
      estimatedPrice,
      affiliateLink: affiliateLink, 
      notes
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar item', error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { itemName, estimatedPrice, itemStatus, notes } = req.body;
    
    const item = await ShoppingCart.findOne({ _id: req.params.id, user: req.user.id });

    if (!item) {
      return res.status(404).json({ message: 'Item não encontrado.' });
    }

    // Se o nome OU o preço mudarem, o link de afiliado precisa ser atualizado
    const nameChanged = itemName && itemName.trim() !== item.itemName;
    const priceChanged = estimatedPrice !== undefined && estimatedPrice !== item.estimatedPrice;

    if (nameChanged || priceChanged) {
      const novoNome = itemName ? itemName.trim() : item.itemName;
      const novoPreco = estimatedPrice !== undefined ? estimatedPrice : item.estimatedPrice;
      
      item.itemName = novoNome;
      item.estimatedPrice = novoPreco;
      item.affiliateLink = generateSmartLink(novoNome, novoPreco);
    }

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