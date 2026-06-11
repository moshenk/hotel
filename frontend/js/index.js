// 全局常量
const BACKEND_URL = 'http://localhost:3000';
const token = localStorage.getItem('hotel_token');
const userInfo = JSON.parse(localStorage.getItem('hotel_user')) || {};

// 页面加载完成后执行
window.onload = function() {
    // 权限校验：未登录跳转到登录页
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    // 显示当前登录用户名
    document.getElementById('username').textContent = userInfo.username;

    // 绑定侧边栏菜单点击事件
    bindSidebarEvents();

    // 默认渲染首页
    renderPage('home');
};

// ========== 1. 绑定侧边栏菜单事件 ==========
function bindSidebarEvents() {
    const menuItems = document.querySelectorAll('#sidebarMenu li');
    
    menuItems.forEach(item => {
        item.onclick = function() {
            // 1. 移除所有菜单的激活状态
            menuItems.forEach(i => i.classList.remove('active'));
            // 2. 给当前点击的菜单加激活状态
            this.classList.add('active');
            // 3. 获取要渲染的页面名称
            const pageName = this.dataset.page;
            // 4. 渲染对应页面
            renderPage(pageName);
        };
    });
}

// ========== 2. 核心：页面渲染分发函数 ==========
function renderPage(pageName) {
    const content = document.getElementById('mainContent');
    
    // 根据页面名称，调用对应的渲染函数
    switch(pageName) {
        case 'home':
            content.innerHTML = renderHomePage();
            break;
        case 'checkin':
            content.innerHTML = renderCheckinPage();
            break;
        case 'user':
            // 权限控制：只有管理员能访问用户管理
            if (userInfo.role !== 'admin') {
                content.innerHTML = '<div style="text-align:center;padding:100px;color:#999;">权限不足，仅管理员可访问</div>';
                return;
            }
            content.innerHTML = renderUserPage();
            // 渲染完用户管理页面后，绑定该页面的事件
            bindUserPageEvents();
            break;
        // 后续新增页面，在这里加case即可
        default:
            content.innerHTML = `<div style="text-align:center;padding:100px;color:#999;">${pageName} 页面开发中...</div>`;
    }
}

// ========== 3. 各个页面的渲染函数 ==========

// ✅ 首页渲染函数
function renderHomePage() {
    return `
        <div class="welcome-bar">
            <div>
                <p>欢迎回来，${userInfo.username}</p>
                <p style="font-size: 12px; margin-top: 4px;">晚上好，今天是2026年06月02日，星期二，祝您工作愉快！</p>
            </div>
            <div class="weather">36℃ 多云</div>
        </div>
        <div class="cards">
            <div class="card blue">
                <div class="title">今日入住</div>
                <div class="value">0间</div>
            </div>
            <div class="card green">
                <div class="title">今日退房</div>
                <div class="value">0间</div>
            </div>
            <div class="card orange">
                <div class="title">空房数</div>
                <div class="value">27间</div>
            </div>
            <div class="card purple">
                <div class="title">入住率</div>
                <div class="value">0%</div>
            </div>
            <div class="card red">
                <div class="title">今日营收</div>
                <div class="value">0元</div>
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
                <div style="height: 200px; position: relative;">
                    <svg width="100%" height="100%" viewBox="0 0 400 200">
                        <polyline points="50,180 100,150 150,80 200,80 250,180 300,180 350,180" fill="none" stroke="#3498db" stroke-width="2"/>
                        <text x="50" y="195" font-size="10">2026-05-27</text>
                        <text x="150" y="195" font-size="10">2026-05-29</text>
                        <text x="250" y="195" font-size="10">2026-05-31</text>
                        <text x="350" y="195" font-size="10">2026-06-02</text>
                    </svg>
                </div>
            </div>
            <div class="chart-box">
                <h3>客源分布图</h3>
                <div style="height: 200px; display: flex; align-items: center; justify-content: center;">
                    <svg width="150" height="150" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e74c3c" stroke-width="15" stroke-dasharray="125.6 251.2" stroke-dashoffset="0"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#3498db" stroke-width="15" stroke-dasharray="80 251.2" stroke-dashoffset="125.6"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f39c12" stroke-width="15" stroke-dasharray="40 251.2" stroke-dashoffset="205.6"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#2ecc71" stroke-width="15" stroke-dasharray="20 251.2" stroke-dashoffset="245.6"/>
                    </svg>
                </div>
            </div>
        </div>
    `;
}

// ✅ 入住管理页面渲染函数（示例）
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

// ✅ 用户管理页面渲染函数
function renderUserPage() {
    return `
        <div class="container" style="padding:20px;">
            <div class="header" style="display:flex;justify-content:space-between;margin-bottom:20px;">
                <h2>用户管理</h2>
                <button class="btn btn-primary" id="addUserBtn">新增用户</button>
            </div>
            <table style="width:100%;border-collapse:collapse;" id="userTable">
                <thead>
                    <tr style="background:#f5f7fa;">
                        <th style="padding:12px;border:1px solid #eee;">ID</th>
                        <th style="padding:12px;border:1px solid #eee;">用户名</th>
                        <th style="padding:12px;border:1px solid #eee;">角色</th>
                        <th style="padding:12px;border:1px solid #eee;">操作</th>
                    </tr>
                </thead>
                <tbody id="userTableBody">
                    <!-- 由JS动态渲染 -->
                </tbody>
            </table>
        </div>

        <!-- 新增/编辑模态框 -->
        <div class="modal" id="userModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);justify-content:center;align-items:center;">
            <div class="modal-content" style="background:#fff;padding:20px;border-radius:6px;width:400px;">
                <h3 id="modalTitle">新增用户</h3>
                <form id="userForm">
                    <input type="hidden" id="userId">
                    <div class="form-item" style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;">用户名</label>
                        <input type="text" id="username" required style="width:100%;padding:8px;border:1px solid #dcdfe6;border-radius:4px;">
                    </div>
                    <div class="form-item" id="passwordBox" style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;">密码</label>
                        <input type="password" id="password" style="width:100%;padding:8px;border:1px solid #dcdfe6;border-radius:4px;">
                    </div>
                    <div class="form-item" style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;">角色</label>
                        <select id="role" style="width:100%;padding:8px;border:1px solid #dcdfe6;border-radius:4px;">
                            <option value="normal">普通用户</option>
                            <option value="admin">管理员</option>
                        </select>
                    </div>
                    <div class="modal-footer" style="text-align:right;margin-top:20px;">
                        <button type="button" class="btn" id="cancelBtn" style="padding:6px 12px;border:none;border-radius:4px;cursor:pointer;margin-right:8px;">取消</button>
                        <button type="submit" class="btn btn-primary" style="padding:6px 12px;border:none;border-radius:4px;cursor:pointer;background:#409eff;color:#fff;">保存</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// ========== 4. 各个页面的事件绑定函数 ==========
// 用户管理页面的事件（必须在渲染完页面后调用）
function bindUserPageEvents() {
    // 加载用户列表
    loadUserList();

    // 绑定新增按钮
    document.getElementById('addUserBtn').onclick = () => {
        document.getElementById('modalTitle').textContent = '新增用户';
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('passwordBox').style.display = 'block';
        document.getElementById('userModal').style.display = 'flex';
    };

    // 绑定取消按钮
    document.getElementById('cancelBtn').onclick = () => {
        document.getElementById('userModal').style.display = 'none';
    };

    // 绑定表单提交
    document.getElementById('userForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        if (id) {
            await updateUser(id, username, role);
        } else {
            await addUser(username, password, role);
        }
    };
}

// ========== 5. 用户管理相关的API函数 ==========
async function loadUserList() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/user/list`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.code === 200) {
            renderUserTable(data.data);
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('网络错误');
    }
}

function renderUserTable(userList) {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = userList.map(user => createUserRow(user)).join('');
}

function createUserRow(user) {
    return `
        <tr data-id="${user.id}">
            <td style="padding:12px;border:1px solid #eee;">${user.id}</td>
            <td style="padding:12px;border:1px solid #eee;">${user.username}</td>
            <td style="padding:12px;border:1px solid #eee;">${user.role === 'admin' ? '管理员' : '普通用户'}</td>
            <td style="padding:12px;border:1px solid #eee;">
                <button class="btn btn-edit" onclick="editUser(${user.id}, '${user.username}', '${user.role}')" style="background:#e6a23c;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;margin-right:8px;">编辑</button>
                <button class="btn btn-delete" onclick="deleteUser(${user.id})" style="background:#f56c6c;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;">删除</button>
            </td>
        </tr>
    `;
}

async function addUser(username, password, role) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/user/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ username, password, role })
        });
        const data = await res.json();

        if (data.code === 200) {
            alert('新增成功');
            document.getElementById('userModal').style.display = 'none';
            // 局部渲染：只添加新行
            const tbody = document.getElementById('userTableBody');
            tbody.insertAdjacentHTML('beforeend', createUserRow(data.data));
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('网络错误');
    }
}

async function updateUser(id, username, role) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/user/edit`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ id, username, role })
        });
        const data = await res.json();

        if (data.code === 200) {
            alert('编辑成功');
            document.getElementById('userModal').style.display = 'none';
            // 局部渲染：只替换对应行
            const oldRow = document.querySelector(`tr[data-id="${id}"]`);
            oldRow.outerHTML = createUserRow(data.data);
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('网络错误');
    }
}

async function deleteUser(id) {
    if (!confirm('确定要删除该用户吗？')) return;

    try {
        const res = await fetch(`${BACKEND_URL}/api/user/delete/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.code === 200) {
            alert('删除成功');
            // 局部渲染：只删除对应行
            const row = document.querySelector(`tr[data-id="${id}"]`);
            row.remove();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('网络错误');
    }
}

// 注意：这里必须把这两个函数挂载到window上，因为内联onclick需要全局访问
window.editUser = function(id, username, role) {
    document.getElementById('modalTitle').textContent = '编辑用户';
    document.getElementById('userId').value = id;
    document.getElementById('username').value = username;
    document.getElementById('role').value = role;
    document.getElementById('passwordBox').style.display = 'none';
    document.getElementById('userModal').style.display = 'flex';
};

window.deleteUser = deleteUser;