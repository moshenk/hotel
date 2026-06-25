const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('./db');

router.post('/auth/login', async (req, res) => {
    const { username, password, captcha, captchaId } = req.body;
    const captchaStore = req.app.locals.captchaStore;

    const storedCaptcha = captchaStore.get(captchaId);
    if (!storedCaptcha) {
        return res.json({ code: 400, message: '验证码已过期', data: null });
    }
    if (storedCaptcha.text !== captcha.toLowerCase()) {
        captchaStore.delete(captchaId);
        return res.json({ code: 400, message: '验证码错误', data: null });
    }
    captchaStore.delete(captchaId);

    let user;
    try {
        const [rows] = await db.query(
            'SELECT id,username,role FROM msk_user WHERE username=? AND password=?',
            [username,password]
        );
        if(rows.length === 0){
            return res.json({ code: 400, message: '用户名或密码错误', data: null });
        }
        user = rows[0];
    } catch (err) {
        return res.json({code:500,message:'数据库查询失败',data:null});
    }

    const token = jwt.sign(
        { userId: user.id, username: user.username },
        'hotel-secret-key-2026',
        { expiresIn: '2h' }
    );


    res.json({
        code: 200,
        message: '登录成功',
        data: {
            token,
            userInfo: {
                userId: user.id,
                username: user.username,
                role: user.role   // 把数据库里的角色发给前端
            }
        }
    });
});

module.exports = router;