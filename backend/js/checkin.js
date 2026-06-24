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

    // 新增：入住直接累加入住数量+营收金额
    const statDate = new Date().toISOString().slice(0, 10);
    const [existRow] = await conn.query(`SELECT id FROM finance_daily WHERE stat_date = ?`, [statDate]);
    if (existRow.length > 0) {
      // 已有今日统计，入住数+1，营收加上本次房费
      await conn.query(`
        UPDATE finance_daily
        SET checkin_count = checkin_count + 1, revenue = revenue + ?
        WHERE stat_date = ?
      `, [price, statDate]);
    } else {
      // 今日第一条订单，初始化数据
      await conn.query(`
        INSERT INTO finance_daily(stat_date, checkin_count, checkout_count, revenue)
        VALUES (?, 1, 0, ?)
      `, [statDate, price]);
    }

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
    const roomId = order[0].room_id;

    // 更新订单退房状态
    await conn.query(`UPDATE checkin SET status=2,checkout_time=NOW() WHERE id=?`, [orderId]);
    // 更新房间为打扫中
    await conn.query('UPDATE room SET status = 1 WHERE id = ?', [roomId]);

    // 仅更新今日退房数量，不修改营收（营收入住时已统计）
    const today = new Date().toISOString().slice(0,10);
    await conn.query(`
      UPDATE finance_daily
      SET checkout_count = checkout_count + 1
      WHERE stat_date = ?
    `, [today]);

    await conn.commit();
    res.json({ code: 200, message: '退房成功，房间进入打扫状态' });
  } catch (err) {
    await conn.rollback();
    console.error('退房事务失败：', err);
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

// 8. 获取财务页面数据（今日汇总+当月总营收+今日订单）
exports.getTodayFinance = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // 1. 今日财务统计
    const [todayStat] = await pool.query(`
      SELECT stat_date, checkin_count, checkout_count, revenue
      FROM finance_daily WHERE stat_date = ?
    `, [today]);
    const total = todayStat.length ? todayStat[0] : { stat_date: today, checkin_count: 0, checkout_count: 0, revenue: 0.00 };

    // 2. 当月全部营收总和
    const [monthSum] = await pool.query(`
      SELECT IFNULL(SUM(revenue),0) AS monthTotal
      FROM finance_daily WHERE stat_date >= ?
    `, [monthStart]);

    // 3. 今日所有入住订单（关联房间）
    const [orderList] = await pool.query(`
      SELECT c.order_number, r.room_number, c.checkin_time, c.checkout_time, c.total_price
      FROM checkin c
      LEFT JOIN room r ON c.room_id = r.id
      WHERE DATE(c.checkin_time) = CURDATE()
      ORDER BY c.checkin_time DESC
    `);

    res.json({
      code: 200,
      data: {
        total,
        monthTotal: monthSum[0].monthTotal,
        orderList
      }
    });
  } catch (err) {
    console.error("财务查询失败", err);
    res.json({ code: 500, message: "财务数据查询异常" });
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
router.get('/finance/today', exports.getTodayFinance);

module.exports = router;