const express = require('express');
const router = express.Router();
const db = require('./db');

// 接口地址 /api/home/stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1.今日入住：checkin_time日期等于今天，状态1=入住中
    const [inRes] = await db.query(`SELECT COUNT(*) num FROM checkin WHERE DATE(checkin_time)=? AND status=1`,[today]);
    const todayIn = inRes[0].num;

    // 2.今日退房：checkout_time日期等于今天，状态2=已退房
    const [outRes] = await db.query(`SELECT COUNT(*) num FROM checkin WHERE DATE(checkout_time)=? AND status=2`,[today]);
    const todayOut = outRes[0].num;

    // 3.房间统计 room表 status：0空闲，1打扫，2已入住
    const [totalRoom] = await db.query(`SELECT COUNT(*) total FROM room`);
    const [usedRoom] = await db.query(`SELECT COUNT(*) used FROM room WHERE status=2`);
    const total = totalRoom[0].total;
    const used = usedRoom[0].used;
    const emptyRoom = total - used;
    const checkRate = total === 0 ? 0 : (used / total * 100).toFixed(1);

    // 4.今日营收：当天入住订单，排除无总价/取消（你订单status只有1、2，没有取消，直接统计）
    const [incomeRes] = await db.query(`SELECT IFNULL(SUM(total_price),0) income FROM checkin WHERE DATE(checkin_time)=?`,[today]);
    const todayIncome = incomeRes[0].income;

    // 5.近7天入住趋势
    const trend = await db.query(`
      SELECT DATE(checkin_time) AS check_in_date,COUNT(*) cnt 
      FROM checkin 
      WHERE DATE(checkin_time) >= DATE_SUB(?,INTERVAL 6 DAY)
      GROUP BY DATE(checkin_time) ORDER BY DATE(checkin_time)
    `,[today]);

    // 6.客源分布：你表没有source字段，这里临时返回空数组，不报错
    const source = [];

    res.json({
      code:200,
      data:{todayIn,todayOut,emptyRoom,checkRate,todayIncome,trend,source}
    })
  } catch (err) {
    console.error('统计查询错误：',err);
    res.json({code:500,message:'统计查询失败'})
  }
})

module.exports = router;