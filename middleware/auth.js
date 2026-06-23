const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 從前端發送的 Header（標頭）中取得 token 通行證
  const token = req.header('x-auth-token');

  // 如果根本沒有帶通行證
  if (!token) {
    return res.status(401).json({ message: '沒有通行證，拒絕存取安全路由' });
  }

  try {
    // 驗證通行證是否正確（密鑰必須和 .env 的 JWT_SECRET 一模一樣）
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 把解密出來的 userId 塞進 req.user 中，讓後面的記帳路由可以直接使用
    req.user = decoded;
    
    // 驗證成功，叫下一個流程（記帳路由）繼續執行
    next();
  } catch (err) {
    res.status(401).json({ message: '通行證無效或已過期' });
  }
};