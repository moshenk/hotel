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