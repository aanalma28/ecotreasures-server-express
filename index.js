require('dotenv').config()
const pg = require('pg')
const { Client } = pg
const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
})
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req,res) => {
    res.send("Hallo dunia")
})


app.listen(port, async() => {
    console.log("connecting to postgresql client...")
    await client.connect()
    console.log("connected to postgresql client")
    console.log(`Server on port ${port}`)    
})