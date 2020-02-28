const { app, server, io } = require('./app')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// Heroku will set the PORT, for Dev environment it will take it from config file we are setting
// Since we use env variable PORT, we don't have to say process.env.PORT || xxxx for dev environment
const port = process.env.PORT || 5555
const log = console.log

// Base Route
// app.get('/', (req, res) => {
//     res.send('Chat App')
// })

// Let's define a variable at server, which socket.io clients can access and increment, which server then will relay to each client
// let count = 0

// Start the websocket connection using socket.io instance
// Remember, if I have 5 socket.io clients, below method is going to run 5 time, once for one client!
io.on('connection', (socket) => {

    // Listen to 'join' event for when a new user joins, grab username and room info
    // Instead of passing { username, room }, which will be sent by client, we can use shortcut, provide options object
    // Use ...options then in method call of addUser so anything sent by client goes in, e.g., username and room
    socket.on('join', (options, callback) => {

        // socket.id is unique to a user's connection. ...options meaning take anything sent by user and pass on to addUser
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }

        // socket.join meaning join a chat room. This can only be done at server
        socket.join(user.room)

        // socket.emit sends message only to a single client - new connection, user who joins the chat (room)
        socket.emit('message', generateMessage('Welcome!'))

        // Variations of socket.io method we use for chat apps:
        // socket.emit, io.emit, socket.broadcast.emit => These are regular ones
        // io.to(<room>).emit, socket.broadcast.to(<room>).emit => These are useful for chat apps

        // socket.broadcast sends event to every user (connection) except the user who initiates a message, only if user is connected to this room
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`, user.username))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        // Finally, callback without error argument
        callback()
    })

    // Let's receive any message sent by client (user) as event 'new-message' which they will also use while sending messages
    // callback is acknowledgement, defined by caller (client in this case), called by callee and you can pass arguments too!
    socket.on('message', (message, callback) => {

        // Check for profanity sent by a client, send error and do not relay that message to other clients
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        // Retrieve user using socket.id
        const user = getUser(socket.id)

        if (user) {
            // io.emit sends event to every client connected via same websocket connection (chat room in our case)
            io.to(user.room).emit('message', generateMessage(message, user.username))
            callback('Delivered!')  // call this function defined by client and pass arguments too!
        } else {
            callback({
                error: 'User could not be found!'
            })
        }
    })

    // When a user leaves a connection (closes browser), we need socket.on inside our io.on connection callback
    // we use another built in event - disconnect in this case, similar to connection with io.on
    socket.on('disconnect', () => {

        // socket.id is still available for us to call removeUser and remove this user
        const user = removeUser(socket.id)

        if (user) {
            // No need to use socket.broadcast.to.emit here since this user already disconnected and (s)he will not get this message
            // Send this message only to the room where this user was
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`, 'Admin'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    // Receive the sendLocation event by a client
    socket.on('sendLocation', (coords, callback) => {

        // Retrieve user using socket.id
        const user = getUser(socket.id)

        socket.broadcast.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${coords.lat},${coords.long}`,
            user.username)) // Every user gets it other than user who sent his/her location
        callback('Received your location, user!')   // Send back acknoledgement to client. Only one user gets it!
    })
})

// Don't forget to start the http server
server.listen(port, () => {
    log(`Server is up on port ${port}`)
})
