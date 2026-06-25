// 渲染客房管理页面HTML
function renderRoomPage() {
    return `
    <div style="padding:20px;">
        <h2 style="margin-bottom:20px;">客房管理</h2>
        <button id="openAllotClean" style="padding:8px 16px;background:#67c23a;color:#fff;border:none;border-radius:4px;margin-bottom:20px;">分配打扫</button>
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
                    <tbody id="freeRoomTbody"></tbody>
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
                    <tbody id="busyRoomTbody"></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- 分配打扫弹窗 -->
<div id="cleanModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
    <div style="width:420px;background:#fff;padding:24px;border-radius:8px;">
        <h3 style="margin-bottom:20px;">分配打扫任务</h3>
        <select id="cleanRoomSel" style="width:100%;padding:8px;margin-bottom:16px;">
            <option value="">选择房间</option>
        </select>
        <select id="cleanStaffSel" style="width:100%;padding:8px;margin-bottom:20px;">
            <option value="">选择员工</option>
        </select>
        <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button id="closeCleanModal" style="padding:6px 12px;border:1px solid #ccc;border-radius:4px;">取消</button>
            <button id="submitClean" style="padding:6px 12px;background:#67c23a;color:#fff;border:none;border-radius:4px;">确认分配</button>
        </div>
    </div>
</div>
    `;
}

// 加载客房数据
async function loadRoomData(){
    try {
        // 全局变量统一加window，和入住页面保持一致
        const res = await fetch(`${window.BACKEND_URL}/api/room/manage`,{
            headers:{ Authorization:`Bearer ${window.token}` }
        });
        const json = await res.json();

        // 获取两个tbody容器
        const freeTbody = document.getElementById('freeRoomTbody');
        const busyTbody = document.getElementById('busyRoomTbody');
        if(json.code !== 200 || !freeTbody || !busyTbody) return;

        const { freeRooms, usedRooms } = json.data;

        // 渲染左侧空闲房间
        let freeHtml = '';
        if(freeRooms.length === 0){
            freeHtml = `<tr><td colspan="4" style="text-align:center;padding:12px;color:#999;">暂无空闲/待打扫房间</td></tr>`
        }else{
            freeRooms.forEach(item=>{
                let cleanText = item.status === 0 ? "空闲" : "打扫中";
                freeHtml += `
                <tr>
                    <td style="padding:10px;border:1px solid #eee;">${item.room_number}</td>
                    <td style="padding:10px;border:1px solid #eee;">${item.room_type}</td>
                    <td style="padding:10px;border:1px solid #eee;">${item.price}元</td>
                    <td style="padding:10px;border:1px solid #eee;">${cleanText}</td>
                </tr>
                `;
            })
        }
        freeTbody.innerHTML = freeHtml;

        // 渲染右侧占用房间
        let busyHtml = '';
        if(usedRooms.length === 0){
            busyHtml = `<tr><td colspan="4" style="text-align:center;padding:12px;color:#999;">暂无已入住房间</td></tr>`
        }else{
            usedRooms.forEach(item=>{
                // 格式化时间
                const time = new Date(item.checkin_time);
                const formatTime = `${time.getFullYear()}/${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}`;
                busyHtml += `
                <tr>
                    <td style="padding:10px;border:1px solid #eee;">${item.room_number}</td>
                    <td style="padding:10px;border:1px solid #eee;">已入住</td>
                    <td style="padding:10px;border:1px solid #eee;">${item.guest_name}</td>
                    <td style="padding:10px;border:1px solid #eee;">${formatTime}</td>
                </tr>
                `;
            })
        }
        busyTbody.innerHTML = busyHtml;
    }catch(err){
        console.error('加载客房列表失败',err);
    }
}

// 分配打扫弹窗逻辑
async function bindCleanEvent(){
    const openBtn = document.getElementById('openAllotClean');
    const modal = document.getElementById('cleanModal');
    const closeBtn = document.getElementById('closeCleanModal');
    const roomSel = document.getElementById('cleanRoomSel');
    const staffSel = document.getElementById('cleanStaffSel');
    const submitBtn = document.getElementById('submitClean');

    // 强制初始化隐藏
    modal.style.display = 'none';
    // 关闭
    closeBtn.onclick = ()=> modal.style.display = 'none';

    // 打开弹窗：加载空闲房间、非admin员工
    openBtn.onclick = async ()=>{
        modal.style.display = 'flex';
        // 加载空闲房间
        const rRes = await fetch(`${window.BACKEND_URL}/api/room/cleaning`,{headers:{Authorization:`Bearer ${window.token}`}});
        const rJson = await rRes.json();
        roomSel.innerHTML = '<option value="">选择打扫中房间</option>';
        if(rJson.code===200) rJson.data.forEach(r=>roomSel.innerHTML+=`<option value="${r.id}">${r.room_number}</option>`);
        // 加载员工（自行对应你员工列表接口）
        const sRes = await fetch(`${window.BACKEND_URL}/api/employee/list`,{headers:{Authorization:`Bearer ${window.token}`}});
        const sJson = await sRes.json();
        staffSel.innerHTML = '<option value="">选择保洁员工</option>';
        if(sJson.code===200) sJson.data.forEach(u=>{
            if(u.role === 'common'){
                staffSel.innerHTML += `<option value="${u.id}">${u.username}</option>`
            }
        });
    }

    // 提交修改房间状态为打扫中 status=1
    submitBtn.onclick = async ()=>{
        const roomId = roomSel.value;
        if(!roomId) return alert('请选择房间');
        const res = await fetch(`${window.BACKEND_URL}/api/room/clean/${roomId}`,{
            method:'POST',
            headers:{Authorization:`Bearer ${window.token}`}
        });
        const json = await res.json();
        alert(json.message);
        modal.style.display = 'none';
        loadRoomData();
    }
}

// 页面入口函数（和initCheckinPage结构对齐）
window.initKefangPage = async function () {
    // 先渲染页面DOM
    document.getElementById("mainContent").innerHTML = renderRoomPage();
    // 再加载表格数据
    await loadRoomData();
    bindCleanEvent();
}