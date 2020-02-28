const generateMessage = (messageText, username) => {
    return {
        messageText,    // ES6 short hand syntax for messageText: messageText
        createdAt: new Date().getTime(),
        username
    }
}

const generateLocationMessage = (url, username) => {
    return {
        url,
        createdAt: new Date().getTime(),
        username
    }
}

module.exports = {
    // ES6 shorthand syntax for generateMessage: generateMessage
    generateMessage,
    generateLocationMessage
}