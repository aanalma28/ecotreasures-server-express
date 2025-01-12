// Import all moduels
require('dotenv').config()
const pg = require('pg')
const { Pool } = pg
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const express = require('express')
const app = express()
const port = 3000


// Initialize DB and return pool
const initializeDatabase = async () => {
    // database configuration
    const pool = new Pool({
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DB,
        password: process.env.PG_PASSWORD,
        port: process.env.PG_PORT
    })

    // connection test
    try{
        const res = await pool.query('SELECT NOW()')
        console.log('Connected to PostgreSQL: ', res.rows[0])
    }catch(err){
        console.error('Error connecting to PostgreSQL: ', err)
    }

    return pool
}


// run server
initializeDatabase().then(pool => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`)

        // save pool for reusability connection
        app.set('pool', pool)
    })
}).catch(err => {
    console.log('Database Initialization Failed: ', err)
})

// Middleware untuk parsing JSON
app.use(express.json());

app.get('/', (req,res) => {
    res.send("Hallo dunia")
})

// Users action
app.post('/api/user/register', async(req,res) => {    
    try{
        const { name, email, phone, password } = req.body
        const pool = app.get('pool')
        const checkEmail = await pool.query("SELECT * FROM users WHERE email = $1", [email])


        if(checkEmail.rows.length > 0){
            res.status(409).json({
                message: 'Email has already registered !'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const id = Math.floor(Math.random() * 100) + 1
        const register = await pool.query(
            "INSERT INTO users (id,name,email,phone,password,role,image,active_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
            [id, name, email, phone, hashedPassword, 'user', null, true]
        )
        const result = register.rows[0]
        res.status(201).json({
            message: "Registration Successfully !",
            data: {
                id,
                name,
                email
            }
        })

    }catch(err){
        console.error('Error registering user: ', err)
        res.status(500).json({
            message: "Internal Server Error"            
        })
    }
})

app.post('/api/auth/login', async(req,res) => {
    try{
        const {email, password} = req.body

        const pool = app.get('pool')
        const checkEmail = await pool.query("SELECT * FROM users where email = $1", [email])
        const result = checkEmail.rows[0]
        
        const comparePass = result ? await bcrypt.compare(password, result.password) : null

        if(result && comparePass){
            const token = jwt.sign({id: result.id, username: result.name}, process.env.JWT_SECRET, {
                expiresIn: '14d'
            })

            res.status(200).json({
                message: "Login Successfully !",
                username: result.name,
                email: result.email,
                token: token                
            })
        }else{
            res.status(401).json({
                message: 'Incorrect username or password',                
            })
        }

    }catch(err){
        console.error('Error logging in user: ', err)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
})