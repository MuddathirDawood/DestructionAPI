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
app.use(express.static('view'))
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use(router, cors(), express.json(), bodyParser.urlencoded({ extended: true }));

app.listen(app.get('Port'), ()=>{console.log(`Server is running on port ${app.get('Port')}`);})



/* =========================================================== WELCOME PAGE ==================================================================== */
app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/views/home.html')
})



/* =============================================================== ERAS ======================================================================== */
// --------------------- GET ALL ERAS ---------------------- //
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



// --------------------- GET SINGLE ERA ---------------------- //
router.get('/eras/:id', (req, res)=>{
    const getSingle = `
        SELECT * FROM eras WHERE era_id = ${req.params.id}
    `

    db.query(getSingle, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            era: results
        })
    })
})


// ----------------------- EDIT ERA ---------------------- //



/* ============================================================== WEAPONS ====================================================================== */
// --------------------- GET ALL WEAPONS ---------------------- //
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


// --------------------- GET SINGLE WEAPON ---------------------- //
router.get('/weapons/:id', (req, res)=>{
    const getSingle = `
        SELECT * FROM weapons WHERE weapon_id = ${req.params.id}
    `

    db.query(getSingle, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            weapon: results
        })
    })
})


/* =============================================================== USERS ======================================================================= */
// --------------------- GET ALL USERS ---------------------- //
router.get('/users', (req, res)=>{
    const getAll = `
        SELECT * FROM users
    `

    db.query(getAll, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            users: results
        })
    })
})

// --------------------- GET SINGLE USER ---------------------- //
router.get('/users/:id', (req, res)=>{
    const getSingle = `
        SELECT * FROM users WHERE userID = ${req.params.id}
    `

    db.query(getSingle, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            user: results
        })
    })
})

// ---------------- REGISTER ---------------------- //
router.post('/users', bodyParser.json(), (req, res)=>{
    const body = req.body
    const email = `
        SELECT * FROM users WHERE emailAddress = ?
    `

    let emailC = {
        emailAddress: body.emailAddress
    }
    db.query(email, emailC ,async(err ,results)=>{
        if (err) throw err
        if (results.length > 0) {
            res.json({
                status: 400,
                msg: 'The provided email already exists'
            })
        } else {
            let generateSalt = await bcrypt.genSalt()
            body.password = await bcrypt.hash(body.password, generateSalt)
            body.dateJoined = new Date().toISOString().slice(0, 10)

            const add = `
                INSERT INTO users(username, emailAddress, phone_number, password, dateJoined)
                VALUES(?, ?, ?, ?, ?)
            `

            db.query(add, [body.username, body.emailAddress, body.phone_number, body.password, body.dateJoined], (err, results)=>{
                if (err) throw err
                res.json({
                    status: 200,
                    msg: 'Registration Successful'
                })
            })
        }
    })
})


// ------------------- LOGIN ---------------------- //
router.patch('/users', bodyParser.json(), (req, res)=>{
    const body = req.body
    const login = `
        SELECT * FROM users WHERE ?
    `

    let email = {
        emailAddress: body.emailAddress
    }
    db.query(login, email, async(err, results)=>{
        if (err) throw err
        if (results.length === 0) {
            res.json({
                status: 400,
                msg: 'Email Not Found'
            })
        } else {
            if (await bcrypt.compare(body.password, results[0].password) == false) {
                res.json({
                    status: 404,
                    msg: 'Password is Incorrect'
                })
            } else {
                const payload = {
                    user: {
                        username: results[0].username,
                        emailAddress: results[0].emailAddress,
                        phone_number: results[0].phone_number,
                        password: results[0].password,
                        dateJoined: results[0].dateJoined
                    }
                };

                jwt.sign(payload, process.env.jwtsecret, {expiresIn: "7d"}, (err, token)=>{
                    if (err) throw err
                    res.json({
                        status: 200,
                        user: results,
                        token: token
                    })
                })
            }
        }
    })
})


// --------------------- DELETE USER ---------------------- //
router.delete('/users/:id', (req, res)=>{
    const deleteUser = `
        DELETE FROM users WHERE userID = ${req.params.id};
        ALTER TABLE users AUTO_INCREMENT = 1;
    `

    db.query(deleteUser, (err, results)=>{
        if (err) throw err
        res.json({
            status: 204,
            msg: 'User Deleted Successfully'
        })
    })
})


// --------------------- EDIT USER ---------------------- //
router.put('/users/:id', bodyParser.json(), async(req, res)=>{
    const body = req.body
    const edit = `
        UPDATE users
        SET username = ?, emailAddress = ?, phone_number = ?, password = ?
        WHERE userID = ${req.params.id}
    `

    let generateSalt = await bcrypt.genSalt()
    body.password = await bcrypt.hash(body.password, generateSalt)
    db.query(edit, [body.username, body.emailAddress, body.phone_number, body.password], (err, results)=>{
        if (err) throw err
        res.json({
            status: 204,
            msg: 'User has been edited successfully'
        })
    })
})