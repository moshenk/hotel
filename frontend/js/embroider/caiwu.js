// 页面渲染模板（沿用你写好的样式）
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
                        <td colspan="5" style="padding:30px;text-align:center;color:#999;">数据加载中...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `;
}

// 统一时间格式化工具（复用项目通用格式 YYYY-MM-DD HH:mm）
function formatDateTime(timeStr) {
    if (!timeStr) return "—";
    const d = new Date(timeStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${mi}`;
}

// 加载财务数据
async function loadFinanceData() {
    try {
        const res = await fetch(`${window.BACKEND_URL}/api/finance/today`, {
            headers: { Authorization: `Bearer ${window.token}` }
        });
        const json = await res.json();
        if (json.code !== 200) {
            console.error("财务接口异常", json.message);
            return;
        }
        const { total, orderList, monthTotal } = json.data;

        // 填充今日营收卡片
        document.getElementById("dayMoney").textContent = `¥${Number(total.revenue).toFixed(2)}`;
        // 填充本月总收入卡片
        document.getElementById("monthMoney").textContent = `¥${Number(monthTotal).toFixed(2)}`;

        // 渲染订单表格
        const tbody = document.getElementById("financeTbody");
        let tableHtml = "";
        if (orderList.length === 0) {
            tableHtml = `<tr><td colspan="5" style="padding:30px;text-align:center;color:#999;">今日暂无订单</td></tr>`;
        } else {
            orderList.forEach(item => {
                const inTime = formatDateTime(item.checkin_time);
                const outTime = formatDateTime(item.checkout_time);
                tableHtml += `
                    <tr>
                        <td style="padding:12px;border:1px solid #eee;text-align:left;">${item.order_number}</td>
                        <td style="padding:12px;border:1px solid #eee;text-align:center;">${item.room_number}</td>
                        <td style="padding:12px;border:1px solid #eee;text-align:center;">${inTime}</td>
                        <td style="padding:12px;border:1px solid #eee;text-align:center;">${outTime}</td>
                        <td style="padding:12px;border:1px solid #eee;text-align:right;">¥${Number(item.total_price).toFixed(2)}</td>
                    </tr>
                `;
            });
        }
        tbody.innerHTML = tableHtml;
    } catch (err) {
        console.error("加载财务数据失败：", err);
        document.getElementById("financeTbody").innerHTML = `
            <tr>
                <td colspan="5" style="padding:30px;text-align:center;color:red;">数据加载失败，请检查后端服务</td>
            </tr>
        `;
    }
}

// 页面初始化入口函数，挂载全局供index.js调用
window.initFinancePage = async function () {
    // 渲染页面骨架
    document.getElementById("mainContent").innerHTML = renderFinancePage();
    // 延时等待DOM渲染完成再请求接口，避免获取不到tbody
    setTimeout(async () => {
        await loadFinanceData();
    }, 50);
}