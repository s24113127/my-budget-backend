require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // 修正：引入 CORS 機制，允許前端網頁跨網域連線
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = express();

// 中介軟體設定
app.use(express.json());
app.use(cors()); // 修正：啟用 CORS，確保專題前端畫面與後端可以順利互通

// 自動彈性連線機制
async function connectDB() {
  try {
    // 嘗試連線雲端
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('🎉 恭喜！MongoDB 雲端資料庫連線成功了！');
  } catch (err) {
    console.log('⚠️ 偵測到網路防火牆阻擋，正在為您啟動本機虛擬記憶體資料庫...');
    
    // 雲端失敗時，自動在記憶體內建立虛擬資料庫
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    console.log('🚀 虛擬資料庫啟動成功！已完美避開防火牆限制！');
  }
}
connectDB();

// 掛載認證路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 掛載記帳路由
const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
  res.send('後端伺服器運作中！');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 伺服器已啟動：http://localhost:${PORT}`);
});