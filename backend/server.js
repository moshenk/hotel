const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.locals.captchaStore = new Map();

const captchaRouter = require('./js/captcha');
const loginRouter = require('./js/login');
app.use('/api', captchaRouter);
app.use('/api', loginRouter);

app.listen(PORT, () => {
    console.log(`✅ 后端服务器已启动，地址：http://localhost:${PORT}`);
    console.log('🔑 测试账号：admin / 123456');
});