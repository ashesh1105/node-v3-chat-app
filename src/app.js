const express = require('express')
const path = require('path')    // path is a core module, not an npm package
const http = require('http')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)   // express does it by default anyway
const io = socketio(server)   // You need http and express to create a websocket server

// Customize our server. express package provides something to pass in and extract as Json
app.use(express.json())

// Configure public directory from which static contents can be served
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

// Add the router to use
// app.use(userRouter)
// app.use(taskRouter)

// export app to be used outside of this file. This helps using it with automated tests as well
module.exports = {
    app,
    server,
    io
}