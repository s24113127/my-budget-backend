const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 1. 註冊路由
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 檢查帳號是否重複
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: '此帳號已被註冊' });
    }

    // 建立新使用者 (User.js 的 pre-save 會在這裡自動把密碼加密)
    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({ message: '註冊成功！' });
  } catch (err) {
    res.status(500).json({ message: '伺服器出錯', error: err.message });
  }
});

// 2. 登入路由
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 找看看有沒有這個人
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 比對密碼 (bcrypt 會自動把明文拿去跟資料庫的 $2b$ 亂碼比對)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '帳號或密碼錯誤' });
    }

    // 發放 JWT 通行證碼（有效期限 1 天）
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: '登入成功！', token });
  } catch (err) {
    res.status(500).json({ message: '伺服器出錯', error: err.message });
  }
});

module.exports = router;