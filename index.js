// Import all moduels
require('dotenv').config()
const pg = require('pg')
const { Pool } = pg
const bcrypt = require('bcrypt')
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
        console.log('Connected to PostgreSQL: ', res.row[0])
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



app.get('/', (req,res) => {
    res.send("Hallo dunia")
})

// Users action
app.post('/register', async(req,res) => {
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
            "INSERT INTO users (user_id,name,email,phone,password,image,active_status,role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
            [id, name, email, phone, hashedPassword, null, true, 'user']
        )
        const result = register.rows[0]
        res.status(201).json({
            message: "Registration Successfully !",
            data: {
                id, username, email
            }
        })

    }catch(err){
        console.error('Error registering user: ', e)
        res.status(500).json({
            message: "Internal Server Error"            
        })
    }
})