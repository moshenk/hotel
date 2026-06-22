let editTargetId = null;

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

// 打开独立编辑弹窗，回填原有数据
window.openEditWin = function(orderId, name, idcard){
    editTargetId = orderId;
    const editModal = document.getElementById('editModal');
    const nameInput = document.getElementById('editName');
    const idcardInput = document.getElementById('editIdcard');
    // 回填数据
    nameInput.value = name;
    idcardInput.value = idcard;
    // 显示编辑弹窗
    editModal.style.display = 'flex';
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

            <!-- 弹窗2：独立编辑弹窗（全新单独窗口，只修改姓名身份证） -->
            <div id="editModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
                <div style="width:420px;background:#fff;padding:24px;border-radius:8px;">
                    <h3 style="margin-bottom:20px;">修改入住信息</h3>
                    <form id="editForm">
                        <div style="margin-bottom:16px;">
                            <label>客人姓名</label>
                            <input type="text" id="editName" required style="width:100%;padding:8px;margin-top:6px;">
                        </div>
                        <div style="margin-bottom:20px;">
                            <label>身份证号</label>
                            <input type="text" id="editIdcard" maxlength="18" required style="width:100%;padding:8px;margin-top:6px;">
                        </div>
                        <div style="text-align:right;gap:10px;display:flex;justify-content:flex-end;">
                            <button type="button" id="closeEditModal" style="padding:8px 16px;border:1px solid #ccc;background:#fff;border-radius:4px;">取消</button>
                            <button type="submit" style="padding:8px 16px;background:#409eff;color:#fff;border:none;border-radius:4px;">保存修改</button>
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
                    <td style="padding:12px;border:1px solid #eee;">${(()=>{
                        const d = new Date(item.checkin_time);
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const h = String(d.getHours()).padStart(2, '0');
                        const m = String(d.getMinutes()).padStart(2, '0');
                        const s = String(d.getSeconds()).padStart(2, '0');
                        return `${year}-${month}-${day} ${h}:${m}:${s}`;
                    })()}</td>
                    <td style="padding:12px;border:1px solid #eee;">
                        <button class="btn btn-edit" onclick="openEditWin(${item.id},'${item.guest_name}','${item.id_card}')">编辑</button>
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

    // 强制弹窗页面初始化都隐藏
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

        // ========== 编辑弹窗绑定事件 ==========
    const editModal = document.getElementById('editModal');
    const closeEditBtn = document.getElementById('closeEditModal');
    const editForm = document.getElementById('editForm');

    editModal.style.display = 'none';

    // 关闭编辑弹窗
    closeEditBtn.onclick = ()=>{
        editModal.style.display = 'none';
        editForm.reset();
    };

    // 编辑表单提交
    editForm.onsubmit = async (e)=>{
        e.preventDefault();
        const newName = document.getElementById('editName').value.trim();
        const newIdcard = document.getElementById('editIdcard').value.trim();
        try {
            const res = await fetch(`${BACKEND_URL}/api/checkin/edit`,{
                method:'POST',
                headers:{
                    'Content-Type':'application/json',
                    Authorization:`Bearer ${token}`
                },
                body:JSON.stringify({
                    id: editTargetId,
                    guestName: newName,
                    idCard: newIdcard
                })
            });
            const json = await res.json();
            alert(json.message);
            editModal.style.display = 'none';
            loadCheckinData(); // 刷新表格
        }catch(err){
            alert('修改失败，请检查后端服务');
            console.error(err);
        }
    }
}

window.initCheckinPage = async function(){
    // 1. 先渲染入住管理完整页面（包含两个弹窗DOM）
    document.getElementById("mainContent").innerHTML = renderCheckinPage();
    // 新增兜底：渲染完立刻强制隐藏编辑弹窗
    const tempEdit = document.getElementById("editModal");
    if(tempEdit) tempEdit.style.display = 'none';
    // 2. DOM存在后，再绑定弹窗/按钮事件
    await bindCheckinModalEvent();
    // 3. 最后加载表格数据
    await loadCheckinData();
}
