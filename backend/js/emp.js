const express = require('express')
const router = express.Router()
const db = require('./db')

router.get('/emp/list', async (req, res)=>{
    const [rows] = await db.query('SELECT id,username,role FROM msk_user')
    res.json({code:200, data:rows})
})

router.post('/emp/add', async (req, res)=>{
    const {username,password,role} = req.body
    await db.query('INSERT INTO msk_user(username,password,role) VALUES (?,?,?)',[username,password,role])
    res.json({code:200, message:'添加成功'})
})

router.post('/emp/edit', async (req, res)=>{
    const {id,username,password,role} = req.body
    if(password){
        await db.query('UPDATE msk_user SET username=?,password=?,role=? WHERE id=?',[username,password,role,id])
    }else{
        await db.query('UPDATE msk_user SET username=?,role=? WHERE id=?',[username,role,id])
    }
    res.json({code:200, message:'修改成功'})
})

router.delete('/emp/del/:id', async (req, res) => {
    await db.query('DELETE FROM msk_user WHERE id=?', [req.params.id])
    res.json({ code: 200 })
})

module.exports = router