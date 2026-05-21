import StrategyCard from '../models/strategy/ModelStrategyCard.js';
import StrategyCategory from '../models/strategy/ModelStrategyCategory.js';

export const createStrategyCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    const category = await StrategyCategory.create({ user: req.user._id, name, color });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateStrategyCategory = async (req, res) => {
  try {
    const { name, color } = req.body;
    const category = await StrategyCategory.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, color },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: 'Categoria não encontrada.' });
    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStrategyCategories = async (req, res) => {
  try {
    const categories = await StrategyCategory.find({ user: req.user._id });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStrategyCategory = async (req, res) => {
  try {
    const category = await StrategyCategory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada.' });
    res.status(200).json({ message: 'Categoria de estratégia removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStrategyCard = async (req, res) => {
  try {
    const cardData = { ...req.body, user: req.user._id };
    const card = await StrategyCard.create(cardData);
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStrategyCards = async (req, res) => {
  try {
    const cards = await StrategyCard.find({ user: req.user._id })
      .populate('connectedTo.targetId', 'title')
      .populate('childCards.category');
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStrategyCard = async (req, res) => {
  try {
    const card = await StrategyCard.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    .populate('connectedTo.targetId', 'title')
    .populate('childCards.category');

    if (!card) return res.status(404).json({ message: 'Card estratégico não encontrado.' });
    res.status(200).json(card);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteStrategyCard = async (req, res) => {
  try {
    const card = await StrategyCard.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: 'Card estratégico não encontrado.' });
    res.status(200).json({ message: 'Card estratégico removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addChildCard = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const card = await StrategyCard.findOne({ _id: req.params.parentId, user: req.user._id });

    if (!card) return res.status(404).json({ message: 'Card pai não encontrado.' });

    card.childCards.push({ name, description, category });
    await card.save();

    await card.populate('connectedTo.targetId', 'title');
    await card.populate('childCards.category');
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateChildCard = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const card = await StrategyCard.findOne({ _id: req.params.parentId, user: req.user._id });

    if (!card) return res.status(404).json({ message: 'Card pai não encontrado.' });

    const child = card.childCards.id(req.params.childId);
    if (!child) return res.status(404).json({ message: 'Item (filho) não encontrado.' });

    child.name = name;
    child.description = description;
    child.category = category;

    await card.save();
    await card.populate('connectedTo.targetId', 'title');
    await card.populate('childCards.category');
    res.status(200).json(card);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeChildCard = async (req, res) => {
  try {
    const card = await StrategyCard.findOne({ _id: req.params.parentId, user: req.user._id });
    if (!card) return res.status(404).json({ message: 'Card pai não encontrado.' });

    card.childCards.id(req.params.childId).deleteOne();
    await card.save();

    await card.populate('connectedTo.targetId', 'title');
    await card.populate('childCards.category');
    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};