import Category from '../models/ModelCategory.js';

export const getCategories = async (req, res) => {
  try {
    // Busca apenas categorias pertencentes ao usuário logado
    const categories = await Category.find({ user: req.user.id }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categorias', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, color, type } = req.body;

    // Verifica se já existe uma categoria com esse nome para o mesmo usuário
    const categoryExists = await Category.findOne({ user: req.user.id, name: name.trim() });
    
    if (categoryExists) {
      return res.status(400).json({ message: 'Você já possui uma categoria com este nome.' });
    }

    const category = await Category.create({
      user: req.user.id,
      name: name.trim(),
      color,
      type
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar categoria', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user.id });

    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    await category.deleteOne();
    res.json({ message: 'Categoria removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar categoria', error: error.message });
  }
};