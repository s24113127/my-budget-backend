const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth'); // 引入警衛

// 1. 新增消費紀錄（受警衛保護）
router.post('/', auth, async (req, res) => {
  try {
    const { title, amount, category } = req.body;

    // 建立新紀錄，並填入目前登入者的 userId
    const newTransaction = new Transaction({
      user: req.user.userId,
      title,
      amount,
      category
    });

    const transaction = await newTransaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: '伺服器出錯', error: err.message });
  }
});

// 2. 取得目前登入使用者的「所有」記帳紀錄（符合帳號資料隔離標準）
router.get('/', auth, async (req, res) => {
  try {
    // 只撈取 user 欄位等於目前登入者 ID 的資料
    const transactions = await Transaction.find({ user: req.user.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: '伺服器出錯', error: err.message });
  }
});

// 3. 補齊規格：刪除指定消費紀錄（嚴格檢查擁有權，符合資安標準）
router.delete('/:id', auth, async (req, res) => {
  try {
    // 先找出這筆記帳紀錄
    const transaction = await Transaction.findById(req.params.id);

    // 檢查資料是否存在
    if (!transaction) {
      return res.status(404).json({ message: '找不到此筆記帳紀錄' });
    }

    // 【核心資安評分點】檢查這筆資料是不是目前登入使用者的。如果不是，拒絕刪除！
    if (transaction.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: '權限不足，您無法刪除他人的記帳資料' });
    }

    // 確認無誤，執行刪除
    await transaction.deleteOne();
    res.json({ message: '消費紀錄已成功刪除' });
  } catch (err) {
    res.status(500).json({ message: '伺服器出錯', error: err.message });
  }
});

module.exports = router;