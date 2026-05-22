import StrategyCard from '../models/strategy/ModelStrategyCard.js';
import StrategyCategory from '../models/strategy/ModelStrategyCategory.js';
import ModelGoal from '../models/ModelGoal.js';
import ModelInvestment from '../models/ModelInvestment.js';
import ModelRecurrence from '../models/ModelRecurrence.js';
import ModelShoppingCart from '../models/ModelShoppingCart.js';
import ModelCard from '../models/ModelCard.js';

// ── Função auxiliar para popular linkedFunction baseado no tipo ──
const populateLinkedFunction = async (childCard) => {
  if (!childCard.linkedFunction || !childCard.linkedFunction.referenceId) {
    return childCard;
  }

  try {
    let linkedData;
    switch (childCard.linkedFunction.type) {
      case 'goal':
        linkedData = await ModelGoal.findById(childCard.linkedFunction.referenceId);
        break;
      case 'investment':
        linkedData = await ModelInvestment.findById(childCard.linkedFunction.referenceId);
        break;
      case 'recurrence':
        linkedData = await ModelRecurrence.findById(childCard.linkedFunction.referenceId);
        break;
      case 'shoppingcart':
        linkedData = await ModelShoppingCart.findById(childCard.linkedFunction.referenceId);
        break;
      case 'card':
        linkedData = await ModelCard.findById(childCard.linkedFunction.referenceId);
        break;
      default:
        linkedData = null;
    }
    
    if (linkedData) {
      childCard.linkedFunction.item = linkedData;
    }
  } catch (err) {
    console.error(`Erro ao popular linkedFunction: ${err.message}`);
  }

  return childCard;
};

// ── Função para popular todos os linkedFunctions de um card ──
const populateAllLinkedFunctions = async (card) => {
  if (card.childCards && Array.isArray(card.childCards)) {
    card.childCards = await Promise.all(
      card.childCards.map(child => populateLinkedFunction(child))
    );
  }
  return card;
};

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
    let cards = await StrategyCard.find({ user: req.user._id })
      .populate('connectedTo.targetId', 'title')
      .populate('childCards.category');
    
    // Popular linkedFunctions para todos os cards
    cards = await Promise.all(
      cards.map(card => populateAllLinkedFunctions(card))
    );
    
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStrategyCard = async (req, res) => {
  try {
    let card = await StrategyCard.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    .populate('connectedTo.targetId', 'title')
    .populate('childCards.category');

    if (!card) return res.status(404).json({ message: 'Card estratégico não encontrado.' });
    
    // Popular linkedFunctions
    card = await populateAllLinkedFunctions(card);
    
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
    const { name, description, category, linkedFunction } = req.body;
    const card = await StrategyCard.findOne({ _id: req.params.parentId, user: req.user._id });

    if (!card) return res.status(404).json({ message: 'Card pai não encontrado.' });

    card.childCards.push({ name, description, category, linkedFunction });
    await card.save();

    await card.populate('connectedTo.targetId', 'title');
    await card.populate('childCards.category');
    
    // Popular linkedFunctions
    await populateAllLinkedFunctions(card);
    
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateChildCard = async (req, res) => {
  try {
    const { name, description, category, linkedFunction } = req.body;
    const card = await StrategyCard.findOne({ _id: req.params.parentId, user: req.user._id });

    if (!card) return res.status(404).json({ message: 'Card pai não encontrado.' });

    const child = card.childCards.id(req.params.childId);
    if (!child) return res.status(404).json({ message: 'Item (filho) não encontrado.' });

    child.name = name;
    child.description = description;
    child.category = category;
    child.linkedFunction = linkedFunction;

    await card.save();
    await card.populate('connectedTo.targetId', 'title');
    await card.populate('childCards.category');
    
    // Popular linkedFunctions
    await populateAllLinkedFunctions(card);
    
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
    
    // Popular linkedFunctions
    await populateAllLinkedFunctions(card);
    
    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};