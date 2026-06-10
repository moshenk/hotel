const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');

router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create({ size: 4, noise: 2, color: true });
  const captchaId = Date.now().toString();
  req.app.locals.captchaStore.set(captchaId, {
    text: captcha.text.toLowerCase(),
    expire: Date.now() + 5 * 60 * 1000
  });
  const base64Img = Buffer.from(captcha.data).toString('base64');
  res.json({
    code: 200,
    message: '获取成功',
    data: { captchaId, captchaImg: `data:image/svg+xml;base64,${base64Img}` }
  });
});

module.exports = router;