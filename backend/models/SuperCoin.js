//backend/models/SuperCoin.js
const mongoose = require('mongoose');

const SuperCoinTransactionSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  attributeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperCoinAttribute',
    required: true
  },
  message: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const SuperCoinBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  totalReceived: {
    type: Number,
    default: 0
  },
  totalGiven: {
    type: Number,
    default: 0
  },
  lastRecharge: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const SuperCoinAttributeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  cost: {
    type: Number,
    required: true,
    min: 1
  },
  icon: String,
  color: String,
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SuperCoinConfigSchema = new mongoose.Schema({
  monthlyRechargeAmount: {
    type: Number,
    default: 100
  },
  rechargeDay: {
    type: Number,
    default: 1, // Dia do mês para recarga
    min: 1,
    max: 28
  },
  active: {
    type: Boolean,
    default: true
  }
});

module.exports = {
  SuperCoinTransaction: mongoose.model('SuperCoinTransaction', SuperCoinTransactionSchema),
  SuperCoinBalance: mongoose.model('SuperCoinBalance', SuperCoinBalanceSchema),
  SuperCoinAttribute: mongoose.model('SuperCoinAttribute', SuperCoinAttributeSchema),
  SuperCoinConfig: mongoose.model('SuperCoinConfig', SuperCoinConfigSchema)
};