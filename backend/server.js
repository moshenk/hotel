const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.locals.captchaStore = new Map();

// 引入路由
const captchaRouter = require('./js/captcha');
const loginRouter = require('./js/login');
const homeRouter = require('./js/index');
const checkinRouter = require('./js/checkin');
const empRouter = require('./js/emp');

// 接口挂载
app.use('/api', captchaRouter);
app.use('/api', loginRouter);
app.use('/api', checkinRouter);
app.use('/api', empRouter);
// 首页单独分组，不干扰验证码登录
app.use('/api/home', homeRouter);

app.listen(PORT, () => {
    console.log(`✅ 后端服务器已启动，地址：http://localhost:${PORT}`);
});