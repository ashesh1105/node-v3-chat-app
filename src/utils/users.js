const users = []

const log = console.log

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({ id, username, room }) => {

    // validate username and room not null or empty
    if (!username || !room || username.trim() === '' || room.trim() === '') {
        return {
            error: 'id and username is required to created a user!',
            undefined
        }
    }

    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Ensure username is unique for a room
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    if (existingUser) {
        return {
            error: 'username must be unique in a room!',
            undefined
        }
    }

    // Store user is everything is looking good till this point
    const user = { id, username, room }
    users.push(user)
    return { undefined, user }
}

const removeUser = (id) => {
    // Find index of user to be deleted, if any
    const index = users.findIndex((user) => {
        return user.id === id
    })

    // If user is present, delete it, else return an error
    if (index !== -1) {
        // Note: splice method changes actual array too and returns an array with removed elements
        return users.splice(index, 1)[0]
    } else {
        return {
            error: 'User does not exist!'
        }
    }
}

const getUser = (id) => {
    if (!id) {
        return {
            error: 'id is required to find a user!'
        }
    }

    return users.find((user) => user.id === id) // No need of curly braces and explicitely say here: return user.id === id
}

const getUsersInRoom = (room) => {
    if (!room || room === '') {
        return {
            error: 'room can not be undefined or empty!'
        }
    }
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
