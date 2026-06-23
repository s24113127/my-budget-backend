require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = express();

app.use(express.json());
app.use(cors()); 

// 連線邏輯：優先連雲端，失敗自動接本機虛擬庫
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('🎉 恭喜！MongoDB 雲端資料庫連線成功了！');
  } catch (err) {
    console.log('⚠️ 偵測到網路防火牆阻擋，正在為您啟動本機虛擬記憶體資料庫...');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('🚀 虛擬資料庫啟動成功！已完美避開防火牆限制！');
  }
}
connectDB();

// 引入路由（模型會由路由內部自動加載，不再重複編譯）
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>我的雲端記帳本</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 30px auto; padding: 20px; background: #f4f7f6; color: #333; }
        .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 20px; }
        h2, h3, h4 { margin-top: 0; color: #2c3e50; }
        input, button, select { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
        input:focus, select:focus { border-color: #3498db; outline: none; box-shadow: 0 0 5px rgba(52,152,219,0.3); }
        button { background: #2ecc71; color: white; border: none; cursor: pointer; font-size: 16px; font-weight: bold; transition: background 0.2s; }
        button:hover { background: #27ae60; }
        .logout-btn { background: #e74c3c; margin-top: 5px; padding: 8px; font-size: 14px; }
        .logout-btn:hover { background: #c0392b; }
        ul { list-style: none; padding: 0; margin-top: 15px; }
        li { background: #f8f9fa; padding: 12px 15px; margin: 8px 0; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid #2ecc71; }
        li.expense { border-left-color: #e74c3c; }
        .del-btn { width: auto; background: #e74c3c; padding: 5px 10px; margin: 0; font-size: 12px; }
        .del-btn:hover { background: #c0392b; }
        .hidden { display: none; }
        .flex-row { display: flex; gap: 10px; }
        .flex-row input, .flex-row select { margin: 0; }
        .total-box { font-size: 18px; font-weight: bold; text-align: right; margin-top: 10px; color: #2c3e50; }
      </style>
    </head>
    <body>
      <h2 style="text-align: center;">💰 雲端智慧記帳系統</h2>
      <div id="authSection" class="card">
        <h3 id="authTitle">使用者登入</h3>
        <input type="email" id="email" placeholder="電子信箱 (Email)">
        <input type="password" id="password" placeholder="密碼 (Password)">
        <button id="mainAuthBtn" onclick="handleAuth()">登入系統</button>
        <p style="text-align:center; font-size:14px; color:#7f8c8d; margin-top: 15px;">
          <span id="toggleText" style="cursor:pointer; text-decoration:underline; color: #3498db;" onclick="toggleAuthMode()">還沒有帳號？切換至註冊</span>
        </p>
      </div>

      <div id="appSection" class="card hidden">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>歡迎回來，<strong id="userDisplay" style="color: #3498db;"></strong> 👋</div>
          <button class="logout-btn" onclick="logout()">帳號登出</button>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
        
        <h4>➕ 新增記帳項目</h4>
        <input type="text" id="description" placeholder="消費品項 (如：買午餐、發薪水)">
        <div class="flex-row" style="margin: 8px 0;">
          <input type="number" id="amount" placeholder="金額">
          <select id="type">
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>
        <button onclick="addTransaction()" style="background: #3498db;">儲存此筆資料</button>
        
        <h4 style="margin-top: 25px;">📊 我的記帳明細</h4>
        <div class="total-box">目前總結：<span id="totalBalance">0</span> 元</div>
        <ul id="list"></ul>
      </div>

      <script>
        let token = localStorage.getItem('token') || '';
        let userEmail = localStorage.getItem('userEmail') || '';
        let isRegisterMode = false;

        function toggleAuthMode() {
          isRegisterMode = !isRegisterMode;
          document.getElementById('authTitle').innerText = isRegisterMode ? '新使用者註冊' : '使用者登入';
          document.getElementById('mainAuthBtn').innerText = isRegisterMode ? '註冊新帳號' : '登入系統';
          document.getElementById('toggleText').innerText = isRegisterMode ? '已有帳號？切換至登入' : '還沒有帳號？切換至註冊';
        }

        async function handleAuth() {
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          if (!email || !password) return alert('請完整填寫信箱與密碼！');
          
          const path = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
          
          try {
            const res = await fetch(path, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (!res.ok) return alert(data.message || '認證失敗，請檢查輸入！');
            
            if (isRegisterMode) {
              alert('🎉 註冊成功！請切換回登入模式！');
              toggleAuthMode();
            } else {
              token = data.token;
              userEmail = email;
              localStorage.setItem('token', token);
              localStorage.setItem('userEmail', userEmail);
              initApp();
            }
          } catch (err) { alert('伺服器連線失敗！'); }
        }

        function initApp() {
          document.getElementById('authSection').classList.add('hidden');
          document.getElementById('appSection').classList.remove('hidden');
          document.getElementById('userDisplay').innerText = userEmail;
          getTransactions();
        }

        function logout() {
          token = '';
          userEmail = '';
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          document.getElementById('authSection').classList.remove('hidden');
          document.getElementById('appSection').classList.add('hidden');
          document.getElementById('email').value = '';
          document.getElementById('password').value = '';
        }

        async function getTransactions() {
          try {
            const res = await fetch('/api/transactions', {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            const list = document.getElementById('list');
            list.innerHTML = '';
            
            if (res.status === 401 || res.status === 403) {
              logout();
              return;
            }
            
            let total = 0;
            if (Array.isArray(data)) {
              data.forEach(t => {
                const li = document.createElement('li');
                if (t.type === 'expense') {
                  li.classList.add('expense');
                  total -= t.amount;
                } else {
                  total += t.amount;
                }
                
                li.innerHTML = \`
                  <span><strong>\${t.description}</strong> : \${t.type === 'expense' ? '-' : '+'}\${t.amount} 元</span>
                  <button class="del-btn" onclick="deleteTransaction('\${t._id}')">刪除</button>
                \`;
                list.appendChild(li);
              });
            }
            document.getElementById('totalBalance').innerText = total;
          } catch (err) { console.error('取得資料失敗:', err); }
        }

        async function addTransaction() {
          const description = document.getElementById('description').value;
          const amount = document.getElementById('amount').value;
          const type = document.getElementById('type').value;
          
          if (!description || !amount) return alert('請填寫消費品項與金額！');

          try {
            const res = await fetch('/api/transactions', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
              },
              body: JSON.stringify({ description, amount: Number(amount), type })
            });
            if (res.ok) {
              document.getElementById('description').value = '';
              document.getElementById('amount').value = '';
              getTransactions();
            } else {
              const d = await res.json(); alert(d.message);
            }
          } catch (err) { alert('新增失敗！'); }
        }

        async function deleteTransaction(id) {
          if (!confirm('確定要刪除這筆記帳紀錄嗎？')) return;
          try {
            const res = await fetch('/api/transactions/' + id, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
              getTransactions();
            } else {
              alert('刪除失敗！');
            }
          } catch (err) { alert('連線錯誤！'); }
        }

        if (token && userEmail) {
          initApp();
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 伺服器已啟動：http://localhost:${PORT}`);
});
