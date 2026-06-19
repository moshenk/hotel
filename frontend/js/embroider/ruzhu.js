window.checkoutOrder = async function(orderId){
    if(!confirm('确认办理退房？')) return;
    try {
        const res = await fetch(`${BACKEND_URL}/api/checkin/checkout/${orderId}`,{
            method:'POST',
            headers:{
                Authorization:`Bearer ${token}`
            }
        });
        const json = await res.json();
        alert(json.message);
        loadCheckinData();
    }catch(err){
        alert('网络异常，退房失败');
    }
}

function renderCheckinPage() {
    return `
        <div style="padding:20px;">
            <h2 style="margin-bottom:20px;">入住管理</h2>
            <button class="btn btn-primary" id="openAddCheckin" style="margin-bottom:20px;">新增入住</button>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f5f7fa;">
                        <th style="padding:12px;border:1px solid #eee;">房间号</th>
                        <th style="padding:12px;border:1px solid #eee;">客人姓名</th>
                        <th style="padding:12px;border:1px solid #eee;">身份证号</th>
                        <th style="padding:12px;border:1px solid #eee;">房型</th>
                        <th style="padding:12px;border:1px solid #eee;">入住时间</th>
                        <th style="padding:12px;border:1px solid #eee;">操作</th>
                    </tr>
                </thead>
                <tbody id="checkinTableBody">

                </tbody>
            </table>

            <!-- 新增入住弹窗 移到内部 -->
            <div id="addCheckinModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;">
                <div style="width:450px;background:#fff;padding:24px;border-radius:8px;">
                    <h3 style="margin-bottom:20px;">办理入住</h3>
                    <form id="checkinAddForm">
                        <div style="margin-bottom:16px;">
                            <label>选择空闲房间</label>
                            <select id="roomSelect" required style="width:100%;padding:8px;margin-top:6px;">
                                <option value="">请选择房间</option>
                            </select>
                        </div>
                        <div style="margin-bottom:16px;">
                            <label>客人姓名</label>
                            <input type="text" id="guestName" required style="width:100%;padding:8px;margin-top:6px;">
                        </div>
                        <div style="margin-bottom:20px;">
                            <label>身份证号</label>
                            <input type="text" id="idCard" required maxlength="18" style="width:100%;padding:8px;margin-top:6px;">
                        </div>
                        <div style="text-align:right;gap:10px;display:flex;justify-content:flex-end;">
                            <button type="button" id="closeModal" style="padding:8px 16px;border:1px solid #ccc;background:#fff;border-radius:4px;">取消</button>
                            <button type="submit" style="padding:8px 16px;background:#409eff;color:#fff;border:none;border-radius:4px;">确认入住</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// 加载入住列表数据渲染表格
async function loadCheckinData(){
    try {
        const res = await fetch(`${BACKEND_URL}/api/checkin/list`,{
            headers:{ Authorization:`Bearer ${token}` }
        });
        const json = await res.json();
        const tbody = document.getElementById('checkinTableBody');
        if(json.code !== 200 || !tbody) return;
        const list = json.data;
        let html = '';
        list.forEach(item=>{
            html += `
                <tr>
                    <td style="padding:12px;border:1px solid #eee;">${item.room_number}</td>
                    <td style="padding:12px;border:1px solid #eee;">${item.guest_name}</td>
                    <td style="padding:12px;border:1px solid #eee;">${item.id_card}</td>
                    <td style="padding:12px;border:1px solid #eee;">${item.room_type}</td>
                    <td style="padding:12px;border:1px solid #eee;">${item.checkin_time}</td>
                    <td style="padding:12px;border:1px solid #eee;">
                        <button class="btn btn-edit">编辑</button>
                        <button class="btn btn-delete" onclick="checkoutOrder(${item.id})">退房</button>
                    </td>
                </tr>
            `;
        })
        tbody.innerHTML = html;
    }catch(err){
        console.error('加载入住列表失败',err);
    }
}

// 绑定新增入住弹窗事件
async function bindCheckinModalEvent(){
    const openBtn = document.getElementById('openAddCheckin');
    const closeBtn = document.getElementById('closeModal');
    const modal = document.getElementById('addCheckinModal');
    const form = document.getElementById('checkinAddForm');
    const roomSel = document.getElementById('roomSelect');

    // 新增这一行，页面初始化强制隐藏弹窗
    modal.style.display = 'none';
    
    // 打开弹窗
    openBtn.onclick = async ()=>{
        modal.style.display = 'flex';
        form.reset();
        // 加载空闲房间下拉
        const res = await fetch(`${BACKEND_URL}/api/room/free`,{
            headers:{ Authorization:`Bearer ${token}` }
        });
        const json = await res.json();
        roomSel.innerHTML = '<option value="">请选择房间</option>';
        if(json.code === 200){
            if(json.data.length > 0){
                json.data.forEach(room=>{
                    const opt = document.createElement('option');
                    opt.value = room.id;
                    opt.textContent = `${room.room_number} ${room.room_type} ¥${room.price}`;
                    roomSel.appendChild(opt);
                })
            }else{
                roomSel.innerHTML = '<option value="">暂无空闲房间</option>';
            }
        }
    }
    // 关闭弹窗
    closeBtn.onclick = ()=> modal.style.display = 'none';

    // 提交新增入住
    form.onsubmit = async (e)=>{
        e.preventDefault();
        const roomId = roomSel.value;
        const name = document.getElementById('guestName').value.trim();
        const idcard = document.getElementById('idCard').value.trim();
        // 当前登录用户id
        const userId = userInfo.id;
        try {
            const res = await fetch(`${BACKEND_URL}/api/checkin/add`,{
                method:'POST',
                headers:{
                    'Content-Type':'application/json',
                    Authorization:`Bearer ${token}`
                },
                body:JSON.stringify({
                    roomId,
                    guestName:name,
                    idCard:idcard,
                    userId
                })
            });
            const json = await res.json();
            alert(json.message);
            modal.style.display = 'none';
            // 刷新表格
            loadCheckinData();
        }catch(err){
            alert('提交失败，请检查后端服务');
        }
    }
}

window.initCheckinPage = async function(){
    bindCheckinModalEvent(); // 先绑定所有弹窗DOM事件
    await loadCheckinData(); // 再加载表格数据
}
