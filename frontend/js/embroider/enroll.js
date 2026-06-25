window.initEmployeePage = function () {
    let editTargetId = null;
    // 权限拦截
    const user = JSON.parse(localStorage.getItem('hotel_user')) || {};
    if (user.role === 'common') {
        alert('您无管理员权限');
        renderPage('home');
        return;
    }

    // 只写页面HTML，暂时删除所有接口、事件、方法
    document.getElementById("mainContent").innerHTML = `
        <div style="padding:20px;">
            <h2 style="margin-bottom:20px;">员工账号管理</h2>
            <button id="openAddEmp">添加员工</button>

            <table style="width:100%;border-collapse:collapse;margin-top:20px;">
                <thead>
                    <tr style="background:#f5f7fa;">
                        <th style="padding:12px;border:1px solid #eee;">用户名</th>
                        <th style="padding:12px;border:1px solid #eee;">登录密码</th>
                        <th style="padding:12px;border:1px solid #eee;">账号权限</th>
                        <th style="padding:12px;border:1px solid #eee;">操作</th>
                    </tr>
                </thead>
                <tbody id="empTableBody">
                </tbody>
            </table>

            <!-- 新增弹窗 -->
            <div id="addEmpModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;">
                <div style="width:450px;background:#fff;padding:24px;border-radius:8px;">
                    <h3>添加员工账号</h3>
                    <form id="empAddForm">
                        <div style="margin:16px 0;">
                            <label>用户名</label>
                            <input type="text" id="addUsername" style="width:100%;padding:8px;">
                        </div>
                        <div style="margin:16px 0;">
                            <label>密码</label>
                            <input type="password" id="addPassword" style="width:100%;padding:8px;">
                        </div>
                        <div style="margin:16px 0;">
                            <label>权限</label>
                            <select id="addRole" style="width:100%;padding:8px;">
                                <option value="common">普通员工</option>
                                <option value="admin">管理员</option>
                            </select>
                        </div>
                        <div style="display:flex;gap:10px;justify-content:flex-end;">
                            <button type="button" id="closeModal">取消</button>
                            <button type="submit">确认添加</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- 编辑弹窗 -->
            <div id="editModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
                <div style="width:420px;background:#fff;padding:24px;border-radius:8px;">
                    <h3>修改员工信息</h3>
                    <form id="editForm">
                        <div style="margin:16px 0;">
                            <label>用户名</label>
                            <input type="text" id="editUsername" style="width:100%;padding:8px;">
                        </div>
                        <div style="margin:16px 0;">
                            <label>密码（留空不修改）</label>
                            <input type="password" id="editPassword" style="width:100%;padding:8px;">
                        </div>
                        <div style="margin:16px 0;">
                            <label>权限</label>
                            <select id="editRole" style="width:100%;padding:8px;">
                                <option value="common">普通员工</option>
                                <option value="admin">管理员</option>
                            </select>
                        </div>
                        <div style="display:flex;gap:10px;justify-content:flex-end;">
                            <button type="button" id="closeEditModal">取消</button>
                            <button type="submit">保存修改</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('addEmpModal').style.display = 'none';
    document.getElementById('editModal').style.display = 'none';

        // 打开新增弹窗
    document.getElementById('openAddEmp').onclick = function(){
        document.getElementById('addEmpModal').style.display = 'flex';
    }
    // 关闭新增弹窗
    document.getElementById('closeModal').onclick = function(){
        document.getElementById('addEmpModal').style.display = 'none';
    }
    // 关闭编辑弹窗
    document.getElementById('closeEditModal').onclick = function(){
        document.getElementById('editModal').style.display = 'none';
    }

    // 新增提交
    document.getElementById('empAddForm').onsubmit = async function(e){
        e.preventDefault();
        const res = await fetch(`${BACKEND_URL}/api/emp/add`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                Authorization:`Bearer ${token}`
            },
            body:JSON.stringify({
                username: document.getElementById('addUsername').value,
                password: document.getElementById('addPassword').value,
                role: document.getElementById('addRole').value
            })
        });
        const json = await res.json();
        alert(json.message);
        document.getElementById('addEmpModal').style.display = 'none';
        loadEmpList();
    }

    // 修改提交
    document.getElementById('editForm').onsubmit = async function(e){
        e.preventDefault();
        const res = await fetch(`${BACKEND_URL}/api/emp/edit`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                Authorization:`Bearer ${token}`
            },
            body:JSON.stringify({
                id: editTargetId,
                username: document.getElementById('editUsername').value,
                password: document.getElementById('editPassword').value,
                role: document.getElementById('editRole').value
            })
        });
        const json = await res.json();
        alert(json.message);
        document.getElementById('editModal').style.display = 'none';
        loadEmpList();
    }

    window.openEditWin = function(id, username, role) {
        editTargetId = id;
        document.getElementById('editUsername').value = username;
        document.getElementById('editRole').value = role;
        document.getElementById('editModal').style.display = 'flex';
    }

    window.deleteEmp = async function(id){
    if(!confirm('确认删除？')) return;
    await fetch(`${BACKEND_URL}/api/emp/del/${id}`,{
        method:'DELETE',
        headers:{Authorization:`Bearer ${token}`}
    })
    loadEmpList();
}

    async function loadEmpList() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/emp/list`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json();
        let html = '';
        json.data.forEach(item => {
            html += `
                <tr>
                    <td>${item.username}</td>
                    <td>******</td>
                    <td>${item.role === 'admin' ? '管理员' : '普通员工'}</td>
                    <td>
                        <button onclick="openEditWin(${item.id},'${item.username}','${item.role}')">编辑</button>
                        <button onclick="deleteEmp(${item.id})">删除</button>
                    </td>
                </tr>
            `
        })
        document.getElementById('empTableBody').innerHTML = html;
    } catch (err) {
        console.log(err)
        }
    }
    loadEmpList();
}