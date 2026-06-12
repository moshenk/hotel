// 全局常量
const BACKEND_URL = 'http://localhost:3000';
const token = localStorage.getItem('hotel_token');
const userInfo = JSON.parse(localStorage.getItem('hotel_user')) || {};

// 新增：存储后端首页实时统计数据
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

    // 可选：每5分钟自动刷新一次首页数据
    setInterval(()=>{
        if(document.querySelector('#sidebarMenu li.active')?.dataset.page === 'home'){
            fetchHomeStats();
        }
    }, 5 * 60 * 1000);
};

// ========== 1. 绑定侧边栏菜单事件 ==========
function bindSidebarEvents() {
    const menuItems = document.querySelectorAll('#sidebarMenu li');
    
    menuItems.forEach(item => {
        item.onclick = function() {
            // 移除所有菜单的激活状态
            menuItems.forEach(i => i.classList.remove('active'));
            // 给当前点击的菜单加激活状态
            this.classList.add('active');
            // 获取要渲染的页面名称
            const pageName = this.dataset.page;
            // 渲染对应页面
            renderPage(pageName);
        };
    });
}

// ========== 新增：请求后端首页统计接口，拉取数据库实时数据 ==========
async function fetchHomeStats(){
    try {
        const res = await fetch(`${BACKEND_URL}/api/home/stats`);
        const json = await res.json();
        if(json.code === 200){
            homeStats = json.data;
            // 数据更新后重新渲染首页DOM + 图表
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

// ========== 2. 核心：页面渲染分发函数 ==========
function renderPage(pageName) {
    const content = document.getElementById('mainContent');
    
    // 根据页面名称，调用对应的渲染函数
    switch(pageName) {
        case 'home':
            // 切到首页立刻请求最新数据
            fetchHomeStats();
            // 先渲染加载占位
            content.innerHTML = `<div style="padding:40px;text-align:center;">数据加载中...</div>`;
            break;
        case 'checkin':
            content.innerHTML = renderCheckinPage();
            break;
        case 'room':
            content.innerHTML = renderRoomPage();
            break;
        case 'status':
            content.innerHTML = renderStatusPage();
            break;
        case 'finance':
            content.innerHTML = renderFinancePage();
            break;
        default:
            content.innerHTML = `<div style="text-align:center;padding:100px;color:#999;">${pageName} 页面开发中...</div>`;
    }
}

// ========== 3. 各个页面的渲染函数 ==========

// ✅ 首页渲染函数（已改造：使用后端homeStats动态数值）
function renderHomePage() {
    // 数据还没拿到，展示加载
    if(!homeStats){
        return `<div style="padding:40px;text-align:center;">数据加载中...</div>`;
    }
    // 解构后端返回统计字段
    const {todayIn, todayOut, emptyRoom, checkRate, todayIncome} = homeStats;
    const uname = userInfo.username;

    return `
        <div class="welcome-bar">
            <div>
                <p>欢迎回来，${uname}</p>
                <p style="font-size: 12px; margin-top: 4px;">晚上好，今天是2026年06月12日，星期五，祝您工作愉快！</p>
            </div>
            <div class="weather">36℃ 多云</div>
        </div>
        <div class="cards">
            <div class="card blue">
                <div class="title">今日入住</div>
                <div class="value">${todayIn}间</div>
            </div>
            <div class="card green">
                <div class="title">今日退房</div>
                <div class="value">${todayOut}间</div>
            </div>
            <div class="card orange">
                <div class="title">空房数</div>
                <div class="value">${emptyRoom}间</div>
            </div>
            <div class="card purple">
                <div class="title">入住率</div>
                <div class="value">${checkRate}%</div>
            </div>
            <div class="card red">
                <div class="title">今日营收</div>
                <div class="value">${todayIncome}元</div>
            </div>
        </div>
        <div class="charts">
            <div class="chart-box">
                <h3>入住率趋势</h3>
                <div class="chart-tabs">
                    <button class="active">近7天</button>
                    <button>近一个月</button>
                    <button>近一年</button>
                </div>
                <div style="height: 200px; position: relative;" id="lineChartBox"></div>
            </div>
            <div class="chart-box">
                <h3>客源分布图</h3>
                <div style="height: 200px; display: flex; align-items: center; justify-content: center;" id="pieChartBox"></div>
            </div>
        </div>
    `;
}

// ========== 新增：动态绘制折线图（根据后端trend数组生成SVG） ==========
function drawLineChart(){
    if(!homeStats?.trend || homeStats.trend.length === 0) return;
    const box = document.getElementById('lineChartBox');
    const trendList = homeStats.trend;
    const w = 400, h = 200, padX = 50, padY = 20;
    const maxCount = Math.max(...trendList.map(item=>item.cnt), 1);

    let pointStr = '';
    let textHtml = '';
    trendList.forEach((item, idx)=>{
        // 坐标换算
        const x = padX + idx * ((w - padX*2) / (trendList.length - 1 || 1));
        const y = h - padY - (item.cnt / maxCount) * (h - padY*2);
        pointStr += `${x},${y} `;
        textHtml += `<text x="${x}" y="${h-5}" font-size="10">${item.check_in_date}</text>`;
    })

    box.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}">
            <polyline points="${pointStr.trim()}" fill="none" stroke="#3498db" stroke-width="2"/>
            ${textHtml}
        </svg>
    `;
}

// ========== 新增：动态绘制客源饼图（根据后端source数组生成分段圆环） ==========
function drawPieChart(){
    if(!homeStats?.source || homeStats.source.length === 0) return;
    const box = document.getElementById('pieChartBox');
    const sourceList = homeStats.source;
    const totalNum = sourceList.reduce((sum, item)=>sum + item.cnt, 0);
    const colorArr = ['#e74c3c','#3498db','#f39c12','#2ecc71'];
    const fullCircle = 2 * Math.PI * 40; // 圆环周长
    let offsetDash = 0;
    let circleHtml = '';

    sourceList.forEach((item, idx)=>{
        const ratio = item.cnt / totalNum;
        const dashLen = fullCircle * ratio;
        circleHtml += `
            <circle cx="50" cy="50" r="40" fill="none"
                stroke="${colorArr[idx % colorArr.length]}" stroke-width="15"
                stroke-dasharray="${dashLen} ${fullCircle - dashLen}"
                stroke-dashoffset="${-offsetDash}"
            />
        `;
        offsetDash += dashLen;
    })

    box.innerHTML = `
        <svg width="150" height="150" viewBox="0 0 100 100">
            ${circleHtml}
        </svg>
    `;
}

// ✅ 入住管理页面渲染函数（静态模板，后续可同样改造接口加载实时数据）
function renderCheckinPage() {
    return `
        <div style="padding:20px;">
            <h2 style="margin-bottom:20px;">入住管理</h2>
            <button class="btn btn-primary" style="margin-bottom:20px;">新增入住</button>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f5f7fa;">
                        <th style="padding:12px;border:1px solid #eee;">房间号</th>
                        <th style="padding:12px;border:1px solid #eee;">客人姓名</th>
                        <th style="padding:12px;border:1px solid #eee;">身份证号</th>
                        <th style="padding:12px;border:1px solid #eee;">入住时间</th>
                        <th style="padding:12px;border:1px solid #eee;">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:12px;border:1px solid #eee;">101</td>
                        <td style="padding:12px;border:1px solid #eee;">张三</td>
                        <td style="padding:12px;border:1px solid #eee;">110101199001011234</td>
                        <td style="padding:12px;border:1px solid #eee;">2026-06-02</td>
                        <td style="padding:12px;border:1px solid #eee;">
                            <button class="btn btn-edit">编辑</button>
                            <button class="btn btn-delete">退房</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// ✅ 客房管理渲染函数
function renderRoomPage() {
    return `
    <div style="padding:20px;">
        <h2 style="margin-bottom:20px;">客房管理</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
            <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 4px #eee;">
                <h3 style="color:#27ae60;margin-bottom:16px;">空闲房间</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f8f9fa;">
                            <th style="padding:10px;border:1px solid #eee;">房间号</th>
                            <th style="padding:10px;border:1px solid #eee;">房型</th>
                            <th style="padding:10px;border:1px solid #eee;">单价</th>
                            <th style="padding:10px;border:1px solid #eee;">打扫状态</th>
                        </tr>
                    </thead>
                    <tbody id="freeRoomTbody">
                        <tr>
                            <td style="padding:10px;border:1px solid #eee;">101</td>
                            <td style="padding:10px;border:1px solid #eee;">单床房</td>
                            <td style="padding:10px;border:1px solid #eee;">79元</td>
                            <td style="padding:10px;border:1px solid #eee;">打扫中</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 4px #eee;">
                <h3 style="color:#e74c3c;margin-bottom:16px;">占用房间</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f8f9fa;">
                            <th style="padding:10px;border:1px solid #eee;">房间号</th>
                            <th style="padding:10px;border:1px solid #eee;">状态</th>
                            <th style="padding:10px;border:1px solid #eee;">入住客人</th>
                            <th style="padding:10px;border:1px solid #eee;">入住时间</th>
                        </tr>
                    </thead>
                    <tbody id="busyRoomTbody">
                        <tr>
                            <td style="padding:10px;border:1px solid #eee;">102</td>
                            <td style="padding:10px;border:1px solid #eee;">已入住</td>
                            <td style="padding:10px;border:1px solid #eee;">李四</td>
                            <td style="padding:10px;border:1px solid #eee;">2026/6/8 16:04</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;
}

// ✅ 房态面板渲染函数
function renderStatusPage() {
    return `
    <div style="padding:20px;">
        <h2 style="margin-bottom:24px;">实时房态面板</h2>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;" id="roomGridBox">
            <!-- 绿色=空闲0 橙色=打扫中1 红色=已入住2 -->
            <div style="background:#27ae60;color:#fff;padding:24px;border-radius:8px;text-align:center;">
                <div style="font-size:26px;font-weight:bold;">101</div>
                <div style="margin:6px 0;">单床房</div>
                <div>79元/天</div>
            </div>
            <div style="background:#e74c3c;color:#fff;padding:24px;border-radius:8px;text-align:center;">
                <div style="font-size:26px;font-weight:bold;">102</div>
                <div style="margin:6px 0;">单床房</div>
                <div>79元/天</div>
            </div>
            <div style="background:#f39c12;color:#fff;padding:24px;border-radius:8px;text-align:center;">
                <div style="font-size:26px;font-weight:bold;">103</div>
                <div style="margin:6px 0;">大床房</div>
                <div>119元/天</div>
            </div>
        </div>
        <div style="margin-top:20px;display:flex;gap:20px;">
            <span><span style="display:inline-block;width:16px;height:16px;background:#27ae60;margin-right:6px;"></span>空闲可入住</span>
            <span><span style="display:inline-block;width:16px;height:16px;background:#f39c12;margin-right:6px;"></span>打扫中</span>
            <span><span style="display:inline-block;width:16px;height:16px;background:#e74c3c;margin-right:6px;"></span>已入住</span>
        </div>
    </div>
    `;
}

// ✅ 财务管理渲染函数
function renderFinancePage() {
    return `
    <div style="padding:20px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
            <div style="background:linear-gradient(135deg,#409eff,#667eea);color:#fff;padding:30px;border-radius:10px;">
                <div style="font-size:14px;opacity:0.9;">本月总收入</div>
                <div style="font-size:38px;font-weight:bold;margin-top:10px;" id="monthMoney">¥0.00</div>
            </div>
            <div style="background:linear-gradient(135deg,#ff7d97,#f5576c);color:#fff;padding:30px;border-radius:10px;">
                <div style="font-size:14px;opacity:0.9;">今日营收</div>
                <div style="font-size:38px;font-weight:bold;margin-top:10px;" id="dayMoney">¥0.00</div>
            </div>
        </div>
        <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 4px #eee;">
            <h3 style="margin-bottom:16px;">今日订单明细</h3>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f8f9fa;">
                        <th style="padding:12px;border:1px solid #eee;text-align:left;">订单编号</th>
                        <th style="padding:12px;border:1px solid #eee;">房间号</th>
                        <th style="padding:12px;border:1px solid #eee;">入住时间</th>
                        <th style="padding:12px;border:1px solid #eee;">退房时间</th>
                        <th style="padding:12px;border:1px solid #eee;text-align:right;">消费金额</th>
                    </tr>
                </thead>
                <tbody id="financeTbody">
                    <tr>
                        <td style="padding:12px;border:1px solid #eee;">20260612-001</td>
                        <td style="padding:12px;border:1px solid #eee;">102</td>
                        <td style="padding:12px;border:1px solid #eee;">2026-06-12 08:30</td>
                        <td style="padding:12px;border:1px solid #eee;">—</td>
                        <td style="padding:12px;border:1px solid #eee;text-align:right;">¥79.00</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `;
}