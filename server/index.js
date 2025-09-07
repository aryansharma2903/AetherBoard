// we need this application because we are creating a express server
// express is just a framework or library for node.js
// it allows us to create a simple server in node.js
const express = require("express");
const app = express();
const http = require("http");
// to avoid cors problems in our server
const cors = require("cors");
const { Server } = require("socket.io");
// const { updateElement } = require("../my-app/src/Whiteboard/utils");

// creating our server, and passing in the express application
const server = http.createServer(app);

// registering middleware in express
// express is based on middlewares that we can add to our applications
// cors is a type of middleware
app.use(cors());

// defining our socket io server
// adding cors rules to avoid problems with connections

// keeping state on server
let elements = [];

const io = new Server(server,{
    cors : {
        // to allow all connections
        origin: '*',
        methods: ["GET", "POST"],
        
    },
});

// to crate funnctionality that we can connect to our socket io server
// adding event listener on socket io object
io.on("connection", (socket) => {
    // we see this on our cmd screen
    // we see this on the server side
    console.log('user connected');
    // every user has a seperate socket
    // to emit the event to the user and the actual whiteboaord-state(using elements array)
    // we need to create an event listener at the client side for the whiteboard-state, and set it in their redux store
    io.to(socket.id).emit("whiteboard-state", elements);

    // registering a new event listener
    // if any user emits an event of the name 'element-update' then we will execute the arrow function defined as parameter below
    socket.on('element-update', (elementData)=> {
        // function defined on line 67
        // server state is updated with element
        updateElementInElements(elementData);

        // emit to all connected users (excluding server itself, because we already made updation in server local store), inform them that they should update their store
        // we take socket obj (obj responsible for connection with user)
        // we need to add a event listener at the client side for element-update
        socket.broadcast.emit("element-update", elementData);
    })

    socket.on("whiteboard-clear", ()=> {
        elements = [];
        socket.broadcast.emit("whiteboard-clear");
    })

    // whenever client moves mouse, emitcursorposition is called (every 50ms)
    // the server receives the cursor position and broadcasts it
    socket.on("cursor-position", (cursorData) => {
        socket.broadcast.emit('cursor-position',{
            ...cursorData,
            userId: socket.id,
        })
    })

    // fired automatically when client loses connection with server
    socket.on("disconnect", () => {
        socket.broadcast.emit("user-disconnected", socket.id)
    });
});


// creating a simple endpoint
// res is response object
// req is request object
app.get("/", (req, res) => {
    res.send("Hello server is working");
});

const PORT = process.env.PORT || 3003;

server.listen(PORT, ()=>{
    console.log("server is running on port", PORT);
})

const updateElementInElements = (elementData) => {
    const index = elements.findIndex(element => element.id === elementData.id)

    if(index === -1) return elements.push(elementData);

    elements[index] = elementData;
}