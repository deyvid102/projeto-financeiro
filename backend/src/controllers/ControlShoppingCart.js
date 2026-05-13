// 1. Mude require para import (adicione .js no final)
import ShoppingCart from '../models/ModelShoppingCart.js';

const ShoppingCartController = {
  // CREATE: Adicionar item
  createItem: async (req, res) => {
    try {
      const { itemName, category, estimatedPrice, notes } = req.body;
      
      const newItem = new ShoppingCart({
        user: req.user.id, 
        itemName,
        category,
        estimatedPrice,
        notes
      });

      const savedItem = await newItem.save();
      res.status(201).json(savedItem);
    } catch (error) {
      res.status(500).json({ message: 'Error creating item', error: error.message });
    }
  },

  // READ: Listar todos os itens do usuário logado
  getItems: async (req, res) => {
    try {
      const items = await ShoppingCart.find({ user: req.user.id }).sort({ createdAt: -1 });
      res.status(200).json(items);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching items', error: error.message });
    }
  },

  // UPDATE: Atualizar dados ou status do item
  updateItem: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      let item = await ShoppingCart.findOne({ _id: id, user: req.user.id });

      if (!item) {
        return res.status(404).json({ message: 'Item not found or unauthorized' });
      }

      item = await ShoppingCart.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.status(200).json(item);
    } catch (error) {
      res.status(500).json({ message: 'Error updating item', error: error.message });
    }
  },

  // DELETE: Remover item do carrinho
  deleteItem: async (req, res) => {
    try {
      const { id } = req.params;

      const item = await ShoppingCart.findOneAndDelete({ _id: id, user: req.user.id });

      if (!item) {
        return res.status(404).json({ message: 'Item not found or unauthorized' });
      }

      res.status(200).json({ message: 'Item removed from cart' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting item', error: error.message });
    }
  }
};

// 2. Mude module.exports para export default
export default ShoppingCartController;