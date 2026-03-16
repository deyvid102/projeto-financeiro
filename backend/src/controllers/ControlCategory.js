import Category from '../models/ModelCategory.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user.id }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categorias', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, color, type } = req.body;

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

// NOVA ROTA: Update (Edit)
export const updateCategory = async (req, res) => {
  try {
    const { name, color, type } = req.body;
    
    // 1. Busca a categoria garantindo que pertence ao usuário
    const category = await Category.findOne({ _id: req.params.id, user: req.user.id });

    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    // 2. Se estiver mudando o nome, verifica se o novo nome já existe em outra categoria
    if (name && name.trim() !== category.name) {
      const nameExists = await Category.findOne({ 
        user: req.user.id, 
        name: name.trim(),
        _id: { $ne: req.params.id } // Ignora a própria categoria que está sendo editada
      });

      if (nameExists) {
        return res.status(400).json({ message: 'Já existe outra categoria com este nome.' });
      }
      category.name = name.trim();
    }

    // 3. Atualiza os outros campos se forem enviados
    if (color) category.color = color;
    if (type) category.type = type;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar categoria', error: error.message });
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