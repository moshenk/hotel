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

// 6. 客房管理页面数据（新增接口）
exports.getRoomManageData = async (req, res) => {
  try {
    // 1. 查询空闲/打扫房间 status 0、1
    const [freeRoomList] = await pool.query(`
      SELECT id, room_number, room_type, price, status
      FROM room
      WHERE status IN (0, 1)
      ORDER BY room_number ASC
    `);

    // 2. 查询已入住占用房间，关联入住表拿客人信息
    const [usedRoomList] = await pool.query(`
      SELECT r.room_number, r.status, c.guest_name, c.checkin_time
      FROM room r
      LEFT JOIN checkin c ON r.id = c.room_id AND c.status = 1
      WHERE r.status = 2
      ORDER BY r.room_number ASC
    `);

    return res.json({
      code: 200,
      data: {
        freeRooms: freeRoomList,
        usedRooms: usedRoomList
      }
    });
  } catch (err) {
    console.error("客房管理查询失败：", err);
    return res.json({ code: 500, message: "客房数据查询失败" });
  }
};
// 分配打扫：房间改为打扫中 status=1
exports.setRoomClean = async (req,res)=>{
  const id = req.params.id;
  await pool.query('UPDATE room SET status=0 WHERE id=?',[id]);
  res.json({code:200,message:'打扫完成，房间已更新为空闲状态'});
}
// 获取打扫中 status=1 的房间，对应原来的getFreeRoom
exports.getCleaningRoom = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id,room_number FROM room WHERE status = 1 ORDER BY room_number');
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.json({ code: 500, message: '查询打扫中房间失败' });
  }
};
// 查询所有员工
exports.getEmployeeList = async (req, res) => {
  try {
    const [list] = await pool.query("SELECT id,username FROM msk_user");
    res.json({
      code: 200,
      data: list
    })
  } catch (err) {
    res.json({code:500,message:"查询员工失败"})
  }
}

// 7. 获取所有房间（房态面板专用）
exports.getAllRoom = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, room_number, room_type, price, status
      FROM room
      ORDER BY room_number ASC
    `);
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '查询全部房间失败' });
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
router.get('/room/manage', exports.getRoomManageData);
router.post('/room/clean/:id', exports.setRoomClean);
router.get('/room/cleaning', exports.getCleaningRoom);
router.get('/employee/list', exports.getEmployeeList);
router.get('/room/all', exports.getAllRoom);

module.exports = router;