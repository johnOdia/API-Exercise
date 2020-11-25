const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()
const pool = require('./DB/database')
const dotenv = require('dotenv')
const verify = require('./auth/verifyToken')
const verifyUser = require('./auth/verifyUser')

dotenv.config()

app.use(express.json())

const PORT = process.env.port || 3000

app.get('/api/users', verify, async (req, res) => {
    const allUsers = await pool.query('SELECT * FROM userInfo')
    res.json(allUsers.rows)
})

app.get('/api/users/:id', verifyUser, async (req, res) => {
    const id = Number(req.params.id)
    const getUserById = await pool.query('SELECT * FROM userInfo WHERE user_id = $1', [id])
    res.json(getUserById.rows)
})

app.patch('/api/users/:id', verifyUser, async (req, res) => {
    console.log(req.params);

    const id = Number(req.params.id)
    const username = req.body.username
    const password = req.body.password
    try {
        const updateUser = await pool.query('UPDATE userInfo SET username = $1, user_password = $2 WHERE user_id = $3 RETURNING *', [username, password, id])
        res.status(200).json(updateUser.rows)
    } catch (error) {
        console.error(error.message);
    }
})

app.delete('/api/users/:id', verifyUser, async (req, res) => {
    const id = Number(req.params.id)
    try {
        const deleteUser = await pool.query(
            'DELETE FROM userInfo WHERE user_id = $1', [id]
        )
        res.status(204).send('deleted')
    } catch (error) {
        res.status(400).send(error.message)
    }
})

app.post('/api/users', async (req, res) => {
    try {
        let { username, password } = req.body
        let newUser

        //check that password is an integer
        if (typeof password !== 'number') return res.send('Password must be a number!')

        //check for unique username
        const checkUniqueUserName = await pool.query(
            'SELECT * FROM userInfo WHERE username = $1', [username]
        ).then(resp => {
            if (resp.rows[0]) return res.send('Username is already taken!')
        })

        //set as admin or regular user
        if (password === '123456') {
            newUser = await pool.query(
                'INSERT INTO userinfo (username, user_password, isadmin) VALUES ($1, $2, true) RETURNING *', [username, password]
            )
        }
        else {
            newUser = await pool.query(
                'INSERT INTO userinfo (username, user_password) VALUES ($1, $2) RETURNING *', [username, password]
            ).catch(err => console.error(err.message))
        }

        //generate token
        const token = jwt.sign({ isadmin: newUser.rows[0].isadmin, user_id: newUser.rows[0].user_id }, process.env.TOKEN_SECRET)

        res.status(201).header('auth-token', token).json({ token: token, user: newUser.rows[0] })
    } catch (error) {
        console.error(error.message);
    }
})

app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body

    try {
        const loginUser = await pool.query(
            'SELECT * FROM userInfo WHERE username = $1 AND user_password = $2', [username, password]
        ).catch(error => console.error(error.message))

        if (!loginUser.rows[0]) return res.status(400).send('Invalid username or password')

        else {
            const token = jwt.sign({ isadmin: loginUser.rows[0].isadmin, user_id: loginUser.rows[0].user_id }, process.env.TOKEN_SECRET)

            res.status(200).send(token)
        }
    } catch (error) {
        res.status(400).send(error.message)
    }
})

app.listen(PORT, () => {
    console.log('listening on 3000');
})