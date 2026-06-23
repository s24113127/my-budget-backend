const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  // 這裡用 user 綁定 User 的 _id，用來區分這是誰的記帳紀錄
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },       // 消費品項（例如：午餐、搭捷運）
  amount: { type: Number, required: true },      // 金額（正數代表收入，負數代表支出）
  category: { type: String, required: true },    // 分類（例如：餐飲、交通、娛樂）
  date: { type: Date, default: Date.now }        // 記帳日期（預設為當下時間）
});

module.exports = mongoose.model('Transaction', TransactionSchema);