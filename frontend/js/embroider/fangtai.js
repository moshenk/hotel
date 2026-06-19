function renderStatusPage() {
    return `
    <div style="padding:20px;">
        <h2 style="margin-bottom:24px;">实时房态面板</h2>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;" id="roomGridBox">
            <div style="background:#27ae60;color:#fff;padding:24px;border-radius:8px;text-align:center;">
                <div style="font-size:26px;font-weight:bold;">101</div>
                <div style="margin:6px 0;">单床房</div>
                <div>79元/天</div>
            </div>
            <div style="background:#e74c3c;color:#fff;padding:24px;border-radius:8px;text-align:center;">
                <div style="font-size:26px;font-weight:bold;">102</div>
                <div style="margin:6px 0;">单床房</div>
                <div>79元/天</div>
            </div>
            <div style="background:#f39c12;color:#fff;padding:24px;border-radius:8px;text-align:center;">
                <div style="font-size:26px;font-weight:bold;">103</div>
                <div style="margin:6px 0;">大床房</div>
                <div>119元/天</div>
            </div>
        </div>
        <div style="margin-top:20px;display:flex;gap:20px;">
            <span><span style="display:inline-block;width:16px;height:16px;background:#27ae60;margin-right:6px;"></span>空闲可入住</span>
            <span><span style="display:inline-block;width:16px;height:16px;background:#f39c12;margin-right:6px;"></span>打扫中</span>
            <span><span style="display:inline-block;width:16px;height:16px;background:#e74c3c;margin-right:6px;"></span>已入住</span>
        </div>
    </div>
    `;
}