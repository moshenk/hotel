// 全局常量 挂载window，子页面通用
window.BACKEND_URL = 'http://localhost:3000';
window.token = localStorage.getItem('hotel_token');
window.userInfo = JSON.parse(localStorage.getItem('hotel_user')) || {};
// 存储后端首页实时统计数据
let homeStats = null;

// 页面加载完成后执行
window.onload = function() {
    // 权限校验：未登录跳转到登录页
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    // 显示当前登录用户名
    const nameDom = document.getElementById('username');
    if(nameDom) nameDom.textContent = userInfo.username;

    // 绑定侧边栏菜单点击事件
    bindSidebarEvents();

    // 默认渲染首页
    renderPage('home');

    // 每5分钟自动刷新一次首页数据
    setInterval(()=>{
        if(document.querySelector('#sidebarMenu li.active')?.dataset.page === 'home'){
            fetchHomeStats();
        }
    }, 5 * 60 * 1000);
};

// 绑定侧边栏菜单事件
function bindSidebarEvents() {
    const menuItems = document.querySelectorAll('#sidebarMenu li');
    
    menuItems.forEach(item => {
        item.onclick = function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const pageName = this.dataset.page;
            renderPage(pageName);
        };
    });
}

// 请求后端首页统计接口
async function fetchHomeStats(){
    try {
        const res = await fetch(`${BACKEND_URL}/api/home/stats`);
        const json = await res.json();
        if(json.code === 200){
            homeStats = json.data;
            const content = document.getElementById('mainContent');
            content.innerHTML = renderHomePage();
            drawLineChart();
            drawPieChart();
        } else {
            console.warn('首页数据请求异常：', json.message);
        }
    } catch (err) {
        console.error('连接后端失败，请启动server.js', err);
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div style="padding:40px;color:red;text-align:center;font-size:16px;">
                ⚠️ 无法加载统计数据，请检查后端服务是否启动
            </div>
        `;
    }
}

// 页面渲染分发函数
function renderPage(pageName) {
    const content = document.getElementById('mainContent');
    
    switch(pageName) {
        case 'home':
            fetchHomeStats();
            content.innerHTML = `<div style="padding:40px;text-align:center;">数据加载中...</div>`;
            break;
        case 'checkin':
            content.innerHTML = renderCheckinPage();
            initCheckinPage();
            break;
        case 'room':
            content.innerHTML = renderRoomPage();
            initKefangPage(); 
            break;
        case 'status':
            content.innerHTML = renderStatusPage();
            initStatusPage();
            break;
        case 'finance':
            content.innerHTML = renderFinancePage();
            initFinancePage();
            break;
        case 'employee':
            if(window.initEmployeePage){
                initEmployeePage();
            }
            break;
        default:
            content.innerHTML = `<div style="text-align:center;padding:100px;color:#999;">${pageName} 页面开发中...</div>`;
    }
}
