const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/auth/login', (req, res) => {
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

    if (username !== 'admin' || password !== '123456') {
        return res.json({ code: 400, message: '用户名或密码错误', data: null });
    }

    const token = jwt.sign(
        { userId: 1, username: 'admin' },
        'hotel-secret-key-2026',
        { expiresIn: '2h' }
    );

    res.json({
        code: 200,
        message: '登录成功',
        data: {
            token,
            userInfo: {
                userId: 1,
                username: 'admin',
                nickname: '系统管理员'
            }
        }
    });
});

module.exports = router;