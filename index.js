require('dotenv').config();
const db = require('./config/dbconnect')
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
const router = express.Router()

app.set('Port', process.env.PORT)
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use(router, cors(), express.json(), bodyParser.urlencoded({ extended: true }));

app.listen(app.get('Port'), ()=>{console.log(`Server is running on port ${app.get('Port')}`);})

/* =============================================================== ERAS ======================================================================== */
router.get('/eras', (req, res)=>{
    const getAll = `
        SELECT * FROM eras
    `

    db.query(getAll, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            eras: results
        })
    })
})


/* ============================================================== WEAPONS ====================================================================== */
router.get('/weapons', (req, res)=>{
    const getAll = `
        SELECT * FROM weapons
    `

    db.query(getAll, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            weapons: results
        })
    })
})