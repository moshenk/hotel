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