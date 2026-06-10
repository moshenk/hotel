const BACKEND_URL = 'http://localhost:3000';
let currentCaptchaId = '';

window.onload = function() {
    getCaptcha();
    document.getElementById('captchaImg').onclick = getCaptcha;
    document.getElementById('loginForm').onsubmit = handleLogin;
};

async function getCaptcha() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/captcha`);
        const res = await response.json();

        if (res.code === 200) {
            currentCaptchaId = res.data.captchaId;
            document.getElementById('captchaImg').innerHTML = 
                `<img src="${res.data.captchaImg}" alt="验证码" style="width:100%;height:100%;object-fit:cover;">`;
        }
    } catch (err) {
        console.error('验证码获取失败：', err);
        document.getElementById('captchaImg').innerHTML = 
            '<span style="color:red;font-size:12px;">点击重试</span>';
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const captcha = document.getElementById('captcha').value.trim();

    if (!username) return alert('请输入用户名');
    if (!password) return alert('请输入密码');
    if (!captcha) return alert('请输入验证码');

    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                captcha,
                captchaId: currentCaptchaId
            })
        });

        const res = await response.json();

        if (res.code === 200) {
            localStorage.setItem('hotel_token', res.data.token);
            localStorage.setItem('hotel_user', JSON.stringify(res.data.userInfo));
            alert('登录成功，即将跳转到首页');
            window.location.href = './index.html';
        } else {
            alert(res.message);
            getCaptcha();
        }
    } catch (err) {
        console.error('登录失败：', err);
        alert('网络错误，请检查后端是否启动');
        getCaptcha();
    }
}