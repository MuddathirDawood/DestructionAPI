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



// --------------------- GET WEAPONS FROM ERA ---------------------- //
router.get('/eras/weapons/:id', (req, res)=>{
    const getSingle = `
        SELECT w.weapon_id,w.name,w.image,e.era_id FROM weapons w
        INNER JOIN eras e
        ON w.eraID = e.era_id
        WHERE w.eraID = ${req.params.id}
        LIMIT 3
    `

    db.query(getSingle, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            era_weapons: results
        })
    })
})


// ----------------------- EDIT ERA ---------------------- //
router.put('/eras/:id', bodyParser.json(),(req, res)=>{
    const edit = `
       UPDATE eras
       SET era_name = ?, era_period = ?, history = ?
       WHERE era_id = ${req.params.id}
    `

    db.query(edit, [req.body.era_name, req.body.era_period, req.body.history], (err, results)=>{
        if (err) throw err
        if (req.params.id > 5) {
            res.json({
                status: 404,
                msg: 'There is no era with that id'
            })
        } else {
            res.json({
                status: 204,
                msg: "Era has been edited successfully"
            })
        }
    })
})


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
        SELECT w.*,e.era_name FROM weapons w
        INNER JOIN eras e
        ON w.eraID = e.era_id
        WHERE w.weapon_id = ${req.params.id}
    `

    db.query(getSingle, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            weapon: results
        })
    })
})



// --------------------- ADD WEAPON ---------------------- //
router.post('/weapons', bodyParser.json(), (req, res)=>{
    const add = `
        INSERT INTO weapons(name, description, image, eraID)
        VALUES(?, ?, ?, ?)
    `

    db.query(add, [req.body.name, req.body.description, req.body.image, req.body.eraID], (err, results)=>{
        if (err) throw err
        res.json({
            status: 204,
            msg: 'Weapon added successfully'
        })
    })
})



// --------------------- GET WEAPONS BY ERA ---------------------- //
router.get('/weapons/era/:eraID', (req, res)=>{
    const getSingle = `
        SELECT w.weapon_id,w.name,w.description,w.image,w.eraID,e.era_name FROM weapons w
        INNER JOIN eras e
        ON w.eraID = e.era_id
        WHERE w.eraID = ${req.params.eraID}
    `

    db.query(getSingle, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            weapons_era: results
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

    let emailC = body.emailAddress
    db.query(email, emailC , async(err ,results)=>{
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
                INSERT INTO users(username, emailAddress, phone_number, password, profilePic, dateJoined)
                VALUES(?, ?, ?, ?, ?, ?)
            `

            db.query(add, [body.username, body.emailAddress, body.phone_number, body.password, body.profilePic, body.dateJoined], (err, results)=>{
                if (err) throw err
                res.json({
                    status: 204,
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
                        profilePic: results[0].profilePic,
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
        SET username = ?, emailAddress = ?, phone_number = ?, password = ?, profilePic = ?
        WHERE userID = ${req.params.id}
    `

    let generateSalt = await bcrypt.genSalt()
    body.password = await bcrypt.hash(body.password, generateSalt)
    db.query(edit, [body.username, body.emailAddress, body.phone_number, body.password, body.profilePic], (err, results)=>{
        if (err) throw err
        res.json({
            status: 204,
            msg: 'User has been edited successfully'
        })
    })
})




/* ============================================================ FAVOURITES ===================================================================== */
// GET FAVOURITES
router.get('/users/:id/fav', (req, res)=>{
    const favouritesQ = `
        SELECT favourites FROM users 
        WHERE userID = ${req.params.id}
    `

    db.query(favouritesQ, (err, results)=>{
        if (err) throw err

        if (results[0].favourites !== null) {
            res.json({
                status: 200,
                favourites: JSON.parse(results[0].favourites)
            }) 
        } else {
            res.json({
                status: 404,
                message: 'There is no weapons in your favourites'
            })
        }
    })
})


// ADD FAVOURITES
router.post('/users/:id/fav', bodyParser.json(),(req, res)=>{
    let bd = req.body
    const favouritesQ = `
        SELECT favourites FROM users 
        WHERE userID = ${req.params.id}
    `

    db.query(favouritesQ, (err, results)=>{
        if (err) throw err
        if (results.length > 0) {
            let favourites;
            if (results[0].favourites == null) {
                favourites = []
            } else {
                favourites = JSON.parse(results[0].favourites)
            }
            let weapon = {
                "favouritesID" : favourites.length + 1,
                "name": bd.name,
                "description": bd.description,
                "image": bd.image,
                "eraID": bd.eraID
            }
            favourites.push(weapon);
            const query = `
                UPDATE users
                SET favourites = ?
                WHERE userID = ${req.params.id}
            `

            db.query(query , JSON.stringify(favourites), (err, results)=>{
                if (err) throw err
                res.json({
                    status: 200,
                    results: 'Weapon successfully added into favourites'
                })
            })
        } else {
            res.json({
                status: 404,
                results: 'There is no user with that id'
            })
        }
    })
})

// DELETE favourites
router.delete('/users/:id/favourites', (req,res)=>{
    const delfavourites = `
        SELECT favourites FROM users 
        WHERE userID = ${req.params.id}
    `
    db.query(delfavourites, (err,results)=>{
        if(err) throw err;
        if(results.length >0){
            const query = `
                UPDATE users 
                SET favourites = null 
                WHERE userID = ${req.params.id}
            `
            db.query(query,(err,results)=>{
                if(err) throw err
                res.json({
                    status:200,
                    results: `Successfully cleared the favourites`
                })
            });
        }else{
            res.json({
                status:400,
                result: `There is no user with that ID`
            });
        }
    })
})

router.delete('/users/:id/fav/:favouritesId', (req,res)=>{
        const delSinglefavouritesProd = `
            SELECT favourites FROM users 
            WHERE userID = ${req.params.id}
        `
        db.query(delSinglefavouritesProd, (err,results)=>{
            if(err) throw err;

            if(results.length > 0){
                if(results[0].favourites != null){

                    const result = JSON.parse(results[0].favourites).filter((favourites)=>{
                        return favourites.favouritesID != req.params.favouritesId;
                    })
                    result.forEach((favourites,i) => {
                        favourites.favouritesID = i + 1
                    });
                    const query = `
                        UPDATE users 
                        SET favourites = ? 
                        WHERE userID = ${req.params.id}
                    `

                    db.query(query, [JSON.stringify(result)], (err,results)=>{
                        if(err) throw err;
                        res.json({
                            status:200,
                            result: "Successfully deleted the selected weapon from favourites"
                        });
                    })

                }else{
                    res.json({
                        status:400,
                        result: "This user has an empty favourites"
                    })
                }
            }else{
                res.json({
                    status:400,
                    result: "There is no user with that id"
                });
            }
        })

})

app.use((req, res)=>{
    res.sendFile(__dirname + '/views/404.html')
})