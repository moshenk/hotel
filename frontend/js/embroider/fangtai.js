function renderStatusPage() {
    return `
    <div style="padding:20px;">
        <h2 style="margin-bottom:24px;">实时房态面板</h2>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;" id="roomGridBox">
            <!-- 房间方块由JS动态渲染 -->
        </div>
        <div style="margin-top:20px;display:flex;gap:20px;">
            <span><span style="display:inline-block;width:16px;height:16px;background:#27ae60;margin-right:6px;"></span>空闲可入住</span>
            <span><span style="display:inline-block;width:16px;height:16px;background:#f39c12;margin-right:6px;"></span>打扫中</span>
            <span><span style="display:inline-block;width:16px;height:16px;background:#e74c3c;margin-right:6px;"></span>已入住</span>
        </div>
    </div>
    `;
}

async function loadRoomStatusData() {
    console.log("进入房态加载函数");
    // 全局变量校验
    if (!window.BACKEND_URL || !window.token) {
        console.error("缺失后端地址或登录token");
        return;
    }
    try {
        const box = document.getElementById('roomGridBox');
        if (!box) {
            console.error("找不到roomGridBox容器");
            return;
        }
        const url = `${window.BACKEND_URL}/api/room/all`;
        console.log("请求地址：", url);
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${window.token}` }
        });
        const json = await res.json();
        console.log("接口返回数据：", json);
        if (json.code !== 200) {
            console.error("接口返回失败", json.message);
            return;
        }
        const roomList = json.data;
        let html = '';
        // 无房间兜底提示
        if (roomList.length === 0) {
            html = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">暂无房间数据</div>`;
        } else {
            roomList.forEach(item => {
                let bgColor = '#cccccc';
                if (item.status === 0) bgColor = '#27ae60';
                if (item.status === 1) bgColor = '#f39c12';
                if (item.status === 2) bgColor = '#e74c3c';
                html += `
                    <div style="background:${bgColor};color:#fff;padding:24px;border-radius:8px;text-align:center;">
                        <div style="font-size:26px;font-weight:bold;">${item.room_number}</div>
                        <div style="margin:6px 0;">${item.room_type}</div>
                        <div>${item.price}元/天</div>
                    </div>
                `;
            })
        }
        box.innerHTML = html;
        console.log("渲染房间完成，总数：", roomList.length);
    } catch (err) {
        console.error('加载房态失败', err);
    }
}

window.initStatusPage = async function () {
    // 1. 先渲染页面骨架
    document.getElementById("mainContent").innerHTML = renderStatusPage();
    // 延时等待DOM渲染完成，解决获取不到容器的时序问题
    setTimeout(async () => {
        await loadRoomStatusData();
    }, 30);
}