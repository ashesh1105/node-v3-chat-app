// socket.io client
const socket = io()    // You have some objects and methods available here since you set up socket.io connection

const log = console.log

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('#message-input')
const $messageFormButton = $messageForm.querySelector('#message-submit-btn')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates (Mustache)
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
// location.search is available in browser, can be checked via developer tool. Qs.parse can be used because we added qs.min.js in chat.html as script
// passing object {ignoreQueryPrefix: true} as second argument to parse method helps us get rid of question mark from query string ("?username=Ashesh&room=MTV")
// Using destructuring to directly grab username and room from resulting object from Qs.parse method. We will send these data to server with 'join' event
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// Scroll all the way to the bottom only if user is seeing the latest message.
// If (s)he scrolled up to look at chat history, it will be annoying if we keep on dragging him to bottom when new messages arrive!
const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height (what you can see without scrolling)
    const visibleHeight = $messages.offsetHeight

    // Height of message container - meaning overall height (including scroll)
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled from top
    const scrollOffset = $messages.scrollTop + visibleHeight

    // Finally, scroll to bottom only if user is at the latest message and not looking at history
    if (containerHeight - newMessageHeight <= scrollOffset) {
        // Scroll all the way
        $messages.scrollTop = $messages.scrollHeight
    }
}

// Let's listen to message event sent by server first, logging on browser console for now
socket.on('message', (messageObj) => {

    // A client gets messages sent by server. First one will be Welcome! and then as any user types a message 
    // Render the template using Mustache
    // message is our mustache variables we defined in html as {{message}} and {{createdAt}}
    const html = Mustache.render(messageTemplate, {

        username: messageObj.username,
        message: messageObj.messageText,
        // moment is a library to manupulate date and time. we added this in index.html as script, so we can use it here
        // https://momentjs.com/
        createdAt: moment(messageObj.createdAt).format('h:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

// Display location sent by server when a client shares it
socket.on('locationMessage', (locationMessage) => {

    // Render the template using Mustache
    // locationUrl and createdAt is our mustache variable we defined in html as: {{locationUrl}} and {{createdAt}}
    const html = Mustache.render(locationTemplate, {
        locationUrl: locationMessage.url,    // ES6 short hand syntax for location: location
        username: locationMessage.username,
        createdAt: moment(locationMessage.createdAt).format('h:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

// Listen to roomData event. Server sends it when 1) a new user joins a room, 2) a user disconnects from a room
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

// Add listener on form for event on submit and emit that to server
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // Since we submitted the form and are waiting for results to come back, let's disable the form elements for now
    $messageFormButton.setAttribute('disabled', 'disabled')

    // You can use below to grab user input or the one below that line
    // const message = document.querySelector('#message-input').value
    // Here, target is the form, elements is collection, message is specific field name in the form
    const message = e.target.elements.message.value

    // 3rd argument, a function runs when server server sends aknowledgement by calling this method as callback
    socket.emit('message', message, (error) => {

        // We're into final part of message form, i.e., server acknoledgement, it is right place to enable form elements again
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return log(error)
        }
        log('The message was', ackArguments)    // ackArguments can be delivered by callee (server in this case)
    })
})

// Send location from a client to server, server then broadcasts it to every client except this one
$sendLocationButton.addEventListener('click', () => {
    // Send user a message if his/her browser does not support geolocation
    // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API - browser based geolocation API
    if (!navigator.geolocation) {
        // return stops execution. Better to use modern alerts like model instead of alert statement
        return alert('Geolocation is not supported by your browser!')
    }

    // Disable the button for now till location comes back
    $sendLocationButton.setAttribute('disabled', 'disabled')

    // Browser based Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
    // This method, as of now, does not return Promise, so can't use async - await on it!
    navigator.geolocation.getCurrentPosition((position) => {

        // Send latitude and longitude of this client to server
        socket.emit('sendLocation', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, (acknoledgement) => {    // Set up callback function for server to send back acknoledgement
            // All done till this point since it is acknoledgement time, let's re-enable the button
            $sendLocationButton.removeAttribute('disabled')
            log(acknoledgement)
        })
    })
})

// When new user joins, grab the username and room info using Qs.parse method (under options section above) and send to server via 'join' event
socket.emit('join', { username, room }, (error) => {    // Provide callback function too, to be called from server
    if (error) {
        // If a user tries to join with existing name in same room, it will alert the user and redirect him/her back to index.html
        alert(error)
        location.href = '/' // redirect the user back to index.html which is root of this app
    }
})