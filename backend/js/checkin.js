const pool = require('./db');

// 1. 获取入住订单列表
exports.getCheckinList = async (req, res) => {
  try {
    const sql = `
        SELECT c.id,c.order_number,c.guest_name,c.id_card,c.checkin_time,c.total_price,r.room_number,r.room_type
        FROM checkin c
        LEFT JOIN room r ON c.room_id=r.id
        WHERE c.status = 1
        ORDER BY c.checkin_time DESC
    `;
    const [rows] = await pool.query(sql);
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '查询入住列表失败' });
  }
};

// 2. 获取空闲房间
exports.getFreeRoom = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM room WHERE status = 0 ORDER BY room_number');
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.json({ code: 500, message: '查询空闲房间失败' });
  }
};

// 3. 新增入住
exports.addCheckin = async (req, res) => {
  const { roomId, guestName, idCard, userId } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const [count] = await conn.query(`SELECT COUNT(*) num FROM checkin WHERE DATE(checkin_time) = CURDATE()`);
    const orderNo = `${today}-${String(count[0].num + 1).padStart(3, '0')}`;
    const [roomInfo] = await conn.query('SELECT price FROM room WHERE id = ?', [roomId]);
    const price = roomInfo[0].price;
    await conn.query(`
      INSERT INTO checkin(order_number,room_id,guest_name,id_card,total_price,create_user)
      VALUES (?,?,?,?,?,?)
    `, [orderNo, roomId, guestName, idCard, price, userId]);
    await conn.query('UPDATE room SET status = 2 WHERE id = ?', [roomId]);
    await conn.commit();
    res.json({ code: 200, message: '入住办理成功' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.json({ code: 500, message: '办理入住失败' });
  } finally {
    conn.release();
  }
};

// 4. 退房
exports.checkoutOrder = async (req, res) => {
  const orderId = req.params.id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [order] = await conn.query('SELECT room_id, total_price FROM checkin WHERE id = ? AND status = 1', [orderId]);
    if(order.length === 0) return res.json({code:400,message:'订单不存在或已退房'});
    // 修复：数据库字段是room_id，不是roomId
    const roomId = order[0].room_id;
    const money = order[0].total_price;

    // 更新订单为已退房
    await conn.query(`UPDATE checkin SET status=2,checkout_time=NOW() WHERE id=?`, [orderId]);
    // 更新房间为打扫中 status=1
    await conn.query('UPDATE room SET status = 1 WHERE id = ?', [roomId]);
    console.log('退房更新房间ID：', roomId); // 打印日志，确认roomId是否正常

    // 财务日报逻辑
    const today = new Date().toISOString().slice(0,10);
    const [exist] = await conn.query('SELECT id FROM finance_daily WHERE stat_date = ?', [today]);
    if(exist.length > 0){
      await conn.query(`UPDATE finance_daily SET checkout_count = checkout_count + 1, revenue = revenue + ? WHERE stat_date = ?`, [money, today]);
    }else{
      await conn.query(`INSERT INTO finance_daily(stat_date,checkin_count,checkout_count,revenue) VALUES (?,0,1,?)`, [today, money]);
    }
    await conn.commit();
    res.json({ code: 200, message: '退房成功，房间进入打扫状态' });
  } catch (err) {
    await conn.rollback();
    console.error('退房事务失败：', err); // 打印完整错误
    res.json({ code: 500, message: '退房失败：' + err.message });
  } finally {
    conn.release();
  }
};

// 5. 编辑入住信息（仅修改姓名、身份证）
exports.editCheckin = async (req, res) => {
  const { id, guestName, idCard } = req.body;
  try {
    const sql = `UPDATE checkin SET guest_name = ?, id_card = ? WHERE id = ? AND status = 1`;
    const [result] = await pool.query(sql, [guestName, idCard, id]);
    if (result.affectedRows === 0) {
      return res.json({ code: 400, message: '订单不存在或已退房，无法编辑' });
    }
    res.json({ code: 200, message: '信息修改成功' });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '修改失败' });
  }
};

const express = require('express');
const router = express.Router();

// 绑定接口路径
router.get('/checkin/list', exports.getCheckinList);
router.get('/room/free', exports.getFreeRoom);
router.post('/checkin/add', exports.addCheckin);
router.post('/checkin/checkout/:id', exports.checkoutOrder);
router.post('/checkin/edit', exports.editCheckin);

module.exports = router;