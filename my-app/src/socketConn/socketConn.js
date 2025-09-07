// every user connected has a seperate socket object
// this socket object is related to the socket object in io.on(....).... in  server/index.js
// this is socket at the client side

import { io } from 'socket.io-client'
import { store } from '../store/store'
import { setElements, updateElements } from '../Whiteboard/Whiteboard-Slice';
import { updateCursorPosition, removeCursorPosition } from '../CursorOverlay/cursorSlice';
 
let socket;

export const connectWithSocketServer = () => {
    // where we can find our socket io server
    socket = io('http://localhost:3003');

    // establishing connection of client with server
    socket.on("connect", () => {
        console.log("connected to socket.io server");
    });

    // socket io server emits the actual whiteboard-state to client
    socket.on('whiteboard-state', elements => {
        // storing the actual whiteboard-state on the client
        store.dispatch(setElements(elements))
    });

    socket.on('element-update', (cursorData) => {
        store.dispatch(updateElements(cursorData));
    });
    
    socket.on("whiteboard-clear", () => {
        store.dispatch(setElements([]));
    });
    socket.on("cursor-position", (cursorData) =>{
        store.dispatch(updateCursorPosition(cursorData));
    })

    socket.on("user-disconnected", (disconnectedUserId) => {
        store.dispatch(removeCursorPosition(disconnectedUserId));
    })
};

// we execute this fn in the updateElement fn
// this info gets emitted to the server side
export const emitElementUpdate = (elementData) => {
    socket.emit('element-update', elementData);
};

export const emitClearWhiteboard = ()=> {
    socket.emit("whiteboard-clear");
};

export const emitCursorPosition = (cursorData) => {
    socket.emit("cursor-position", cursorData);
};