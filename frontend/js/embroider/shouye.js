// 首页渲染、绘图全局函数
function renderHomePage() {
    if(!homeStats){
        return `<div style="padding:40px;text-align:center;">数据加载中...</div>`;
    }
    const {todayIn, todayOut, emptyRoom, checkRate, todayIncome} = homeStats;
    const uname = userInfo.username;

    return `
        <div class="welcome-bar">
            <div>
                <p>欢迎回来，${uname}</p>
                <p style="font-size: 12px; margin-top: 4px;">祝您工作愉快！</p>
            </div>
        </div>
        <div class="cards">
            <div class="card blue">
                <div class="title">当前入住</div>
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
        <div class="charts" style="display:block;width:100%;">
            <div class="chart-box" style="width:100%;">
                <h3>入住率趋势</h3>
                <div style="height: 200px; position: relative;" id="lineChartBox"></div>
            </div>
        </div>
    `;
}

function drawLineChart(){
    if(!homeStats?.trend || homeStats.trend.length === 0) return;
    const box = document.getElementById('lineChartBox');
    const trendList = homeStats.trend;
    // 去掉固定宽w=400，改用容器真实宽度
    const w = box.clientWidth, h = 200, padX = 50, padY = 20;
    const maxCount = Math.max(...trendList.map(item=>item.count), 1);

    let pointStr = '';
    let textHtml = '';
    trendList.forEach((item, idx)=>{
        // 横坐标按容器完整宽度均分，铺满左右
        const x = padX + idx * ((w - padX*2) / (trendList.length - 1 || 1));
        const y = h - padY - (item.count / maxCount) * (h - padY*2);
        pointStr += `${x},${y} `;
        textHtml += `<text x="${x}" y="${h-5}" font-size="10">${item.hour}时</text>`;
    })

    // svg宽高100%自适应父容器
    box.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}">
            <polyline points="${pointStr.trim()}" fill="none" stroke="#3498db" stroke-width="2"/>
            ${textHtml}
        </svg>
    `;
}

function drawPieChart(){
    if(!homeStats?.source || homeStats.source.length === 0) return;
    const box = document.getElementById('pieChartBox');
    const sourceList = homeStats.source;
    const totalNum = sourceList.reduce((sum, item)=>sum + item.cnt, 0);
    const colorArr = ['#e74c3c','#3498db','#f39c12','#2ecc71'];
    const fullCircle = 2 * Math.PI * 40;
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