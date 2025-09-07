import React from 'react';
// .. means get out of current folder and then look for path resources/icons/rectangle.svg
// . means import it from same folder
import rectangleIcon from '../resources/icons/rectangle.svg'
import lineIcon from '../resources/icons/line.svg'
import rubberIcon from "../resources/icons/rubber.svg"
import pencilIcon from '../resources/icons/pencil.svg'
import textIcon from '../resources/icons/text.svg'
import selectionIcon from '../resources/icons/selection.svg'
import { toolTypes } from '../constants'
import { useDispatch, useSelector } from 'react-redux';
import { setElements, setToolType } from './Whiteboard-Slice';
import { emitClearWhiteboard } from '../socketConn/socketConn';
// iconbutton is defined in this file because we use it only in this file
// The braces around src and type in the parameter list are destructuring the props object.
// if we press this icon info about which tool is chosen in our redux store 
const IconButton = ({src, type, isRubber}) => {
    const dispatch = useDispatch();
    // whiteboard is the name of our slice which we created in the whiteboard-Slice.js
    const selectedToolType = useSelector(state => state.Whiteboard.tool)
    // when IconButton is clicked the event handler handleTool Change is called
    // to change the tool type in the store
    const handleToolChange = () => {
        // dispatching action (event wrapped with payload, here payload is type) to store, which calls the concerned reducer
        dispatch(setToolType(type));
    }
    const handleClearCanvas = () => {
        // to clear local state
        // alone, it wont clear screen if all the other users
        dispatch(setElements([]));
        emitClearWhiteboard();

    }
    return( 
       <button 
            onClick ={isRubber ? handleClearCanvas : handleToolChange} 
            className={
                selectedToolType === type 
                ? "menu_button_active"
                : "menu_button"
            }
        >
            <img width = '80%' height = '80%' src = {src}/>
        </button>
    );
}

const Menu = () => {
    return (
        <div className = "menu_container">
            <IconButton src = {rectangleIcon} type ={toolTypes.RECTANGLE} />
            {/* we need to define toolTypes.LINE */}
            <IconButton src = {lineIcon} type = {toolTypes.LINE}/>
            <IconButton src = {rubberIcon} isRubber/>
            <IconButton src = {pencilIcon} type = {toolTypes.PENCIL}/>
            <IconButton src = {textIcon} type = {toolTypes.TEXT}/>
            <IconButton src = {selectionIcon} type = {toolTypes.SELECTION}/>
        </div>
    )
}

export default Menu