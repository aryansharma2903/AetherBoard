// use LayoutEffect is similar to useEffect
import React, { useRef, useLayoutEffect, useState } from 'react';
import Menu from './Menu';
import rough from 'roughjs'
import { useSelector, useDispatch } from 'react-redux';
import { actions, cursorPositions, toolTypes } from '../constants'
import {
  createElement,
  updateElement,
  drawElement,
  adjustmentRequired,
  adjustElementCoordinates,
  getElementAtPosition,
  getCursorForPosition,
  getResizedCoordinates,
  updatePencilWhenMoving
} from './utils';
import { v4 as uuid } from 'uuid';
import { updateElements as updateElementInStore } from './Whiteboard-Slice';
import { emitCursorPosition } from '../socketConn/socketConn';

let emitCursor = true;
let lastCursorPosition;

// we did not use useState() hook for selected element 
// because we dont want our component to re-render when our varaible changes 
// let selectedElement;
// const setSelectedElement = (e1) =>{
//   selectedElement = e1;
// }

// above code was changed to below code in lecture 41
// we realized that we want our component to rerender when the selected element is changed 
// this is important because we need this to happen in when we resize or move elements
const Whiteboard = () => {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  // console.log(state.Whiteboard.tool);
  const toolType = useSelector((state) => state.Whiteboard.tool)
  // console.log(toolType);
  const elements = useSelector((state) => state.Whiteboard.elements);
  // to keep the info of what we are doing rn (what action are we performing)
  const [action, setAction] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);

  const dispatch = useDispatch();

  // It is like a tool that tells React: “After you’ve changed the layout (DOM), but before showing it to the user, I want to do something.”
  // If you use useEffect(), it runs after the browser has painted.
  // Using useLayoutEffect() ensures the canvas DOM is ready to draw on before the browser shows anything.
  // to avoid flickering or empty canvas being shown for a split second, which looks bad

  // i would like to execute the useLayoutEffect() everytime elements array changes
  useLayoutEffect(
    () => {
      // console.log("useLayoutEffect is running!");
      const canvas = canvasRef.current;

      // to get the context of the canvas
      const ctx = canvas.getContext("2d");
      // to clear the canvas after every new render
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const roughCanvas = rough.canvas(canvas);

      elements.forEach((element) => {
        drawElement({ roughCanvas, context: ctx, element });
      });
      // fast refresh was not working so downgraded react
      // rc.rectangle(10, 10, 200, 200);
      // rc.rectangle(20, 20, 300, 300);
      // rc.line(80, 120, 300, 100);
      // rc.line(0, 0, 100, 100);


    }, [elements]);


  const handleMouseDown = (event) => {
    // object destructuring, getting clientX and clientY from event object
    const { clientX, clientY } = event;

    if (selectedElement && action === actions.WRITING) {
      return;
    }

    // console.log(clientX, clientY);
    // when the user presses the IconButton rectangle the tooltype is set to RECTANGLE (refer menu.js)
    // now every time we press on the screen the event handler calsl handleMouseDown fn and we get RECTANGLE logged in our console
    console.log(toolType);

    // some changes need to be made in the create element fn to add line feature


    switch (toolType) {
      case toolTypes.RECTANGLE:
      case toolTypes.LINE:
      case toolTypes.PENCIL: {
        // to save the info of the action we are performing on the canvas
        // we need to define setAction and actions
        const element = createElement({
          x1: clientX,
          y1: clientY,
          x2: clientX,
          y2: clientY,
          toolType,
          id: uuid(),
        })
        setAction(actions.DRAWING);
        setSelectedElement(element);
        dispatch(updateElementInStore(element));
        break;
      }
      case toolTypes.TEXT: {
        const element = createElement({
          x1: clientX,
          y1: clientY,
          x2: clientX,
          y2: clientY,
          toolType,
          id: uuid(),
        })
        setAction(actions.WRITING);
        setSelectedElement(element);
        dispatch(updateElementInStore(element));
        break;
      }
      case toolTypes.SELECTION: {
        const element = getElementAtPosition(clientX, clientY, elements);
        if (element && (element.type === toolTypes.RECTANGLE || element.type === toolTypes.TEXT || element.type === toolTypes.LINE)) {
          setAction(
            element.position === cursorPositions.INSIDE
              ? actions.MOVING
              : actions.RESIZING
          );

          // to find where point of click is relative to the x1, y1 
          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;

          setSelectedElement({ ...element, offsetX, offsetY });
        }

        // the logic to move the freehand is... take the array of points and move the lines corresponding to all pairs of consecutive points
        if(element && element.type === toolTypes.PENCIL){
          setAction(actions.MOVING)
          const xOffsets = element.points.map((point) => clientX - point.x);
          const yOffsets = element.points.map((point) => clientY - point.y);

          setSelectedElement({...element, xOffsets, yOffsets});
        }
        break;
      }
    }

  }


  const handleMouseUp = () => {

    // this code is performed to ensure that always x1 < x2  and y1 < y2 (even if we draw bottom to top we will switch variables such that this confition is met)
    // why do we need this condition to be satisfied?
    // it will help us when we give resize functionality to our web application
    const selectedElementIndex = elements.findIndex(el => el.id === selectedElement?.id)
    if (selectedElementIndex !== -1) {
      if (action === actions.DRAWING || action === actions.RESIZING) {
        if (adjustmentRequired(elements[selectedElementIndex].type)) {
          // console.log('adjustments are reqd')
          const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[selectedElementIndex])

          updateElement({
            id: selectedElement.id,
            index: selectedElementIndex,
            x1, x2, y1, y2,
            type: elements[selectedElementIndex].type
          }, elements)
        }
      }
    }

    setAction(null);
    setSelectedElement(null);
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    lastCursorPosition = {x: clientX, y: clientY};

    if(emitCursor){
      emitCursorPosition({x: clientX, y: clientY});
      emitCursor = false;

      console.log('sending-position');

      // after 1/20 second emitCursor will be set to true (so emission will be done 20 times per second)
      setTimeout(() => {
        emitCursor = true;
        emitCursorPosition(lastCursorPosition);
      }, [50])
    }
    // this event is fired a lot of times, server can crash if 4 users go crazy on it
    // therfore we will try somthing such that emission is done only 20 times per second
    // console.log("event-fired");
    // console.log(clientX, clientY);
    event.target.style.cursor = 'default';
    if (action === actions.DRAWING) {
      // console.log('inside')
      // find index of selected element (which is stored int the variable selectedElement, line 13)
      // we cant make changes directly on variable selectedElement, because it is possible that a second user updated it (it wont be changed in our local variable therefore we traverse the elements array and return what we get at the index that is equal to our selectedElement s' index)
      const index = elements.findIndex((e1) => e1.id === selectedElement.id)

      if (index !== -1) {
        // configuration object passed to function
        // i have all the info i need for the current elmenet, now i just need to set that info and update the elements
        updateElement({
          index,
          id: elements[index].id,
          x1: elements[index].x1,
          y1: elements[index].y1,
          x2: clientX,
          y2: clientY,
          type: elements[index].type,
        }, elements)
      }
    }

    if (toolType === toolTypes.SELECTION) {
      const element = getElementAtPosition(clientX, clientY, elements);

      event.target.style.cursor = element
        ? getCursorForPosition(element.position)
        : 'deafult'
      // if(element){
      //   console.log(element);
      // }

      if(selectedElement && action == actions.MOVING && selectedElement.type == toolTypes.PENCIL){

        const newPoints = selectedElement.points
        .map(
          (_,index) => ({
            x: clientX - selectedElement.xOffsets[index],
            y: clientY - selectedElement.yOffsets[index],
          })
        )

        const index = elements.findIndex(el => el.id === selectedElement.id)

        if(index !== -1){
          updatePencilWhenMoving({index, newPoints}, elements);
        }
        return;
      }

      if (action === actions.MOVING && selectedElement) {
        const { id, x1, x2, y1, y2, type, offsetX, offsetY, text } = selectedElement;

        const width = x2 - x1;
        const height = y2 - y1;

        // we have dragged point of click (refer handleMousDown) to clientX and clientY 
        // newx1, newy1 give new position of x1 y1
        const newX1 = clientX - offsetX;
        const newY1 = clientY - offsetY;

        const index = elements.findIndex(el => el.id === selectedElement.id);

        if (index !== -1) {
          updateElement({
            id,
            x1: newX1,
            y1: newY1,
            x2: newX1 + width,
            y2: newY1 + height,
            type,
            index,
            text,
          },
          elements)
        };
      }


      if (action === actions.RESIZING && selectedElement) {
        // coordinates variable has all of the remaining props of selected Element
        const { id, type, position, ...coordinates } = selectedElement
        const { x1, y1, x2, y2 } = getResizedCoordinates(
          clientX,
          clientY,
          position,
          coordinates
        );

        const selectedElementIndex = elements.findIndex(el => el.id === selectedElement.id);

        if(selectedElementIndex !== -1){
          updateElement({
            x1, x2, y1, y2,
            type: selectedElement.type,
            id: selectedElement.id,
            index: selectedElementIndex,
          }, elements);
        }
      }


    }
  }

  const handleTextareaBlur = (event) => {
    const { id, x1, y1, type } = selectedElement;
    const index = elements.findIndex(el => el.id === selectedElement.id)
    if (index !== -1) {
      updateElement(
        { id, x1, y1, type, text: event.target.value, index },
        elements
      );
      setAction(null);
      setSelectedElement(null);
    }
  }

  return (
    // <div>
    //     {/* as soon as i save the changes, it is detected by the webpack it saves our app and recompiles it therefore we see updates on screen*/}
    //     Whiteboard
    // </div>
    <>
      <Menu />
      {action === actions.WRITING
        ? (<textarea
          ref={textAreaRef}
          // if we lose focus of the textarea, we trigger this event handler
          // without a texthandler we are just typing in the text box... not on the canvas
          // without onBlur handler, we dont have the logic what to do when we click somewhere else (or lose focus of our text area)
          // so without this hamdler everytime we click somewhere else a new element is made... the old element is stored in the store without any text
          onBlur={handleTextareaBlur}
          style={{
            position: "absolute",
            // his words : why the -3? to have jumping effect, when we finish typing and lise focus of the text area.. it will be rendered on the canvas but not in the correct position but with -3 it will
            top: selectedElement.y1 - 3,
            left: selectedElement.x1,
            font: "24px sans-serif",
            margin: 0,
            padding: 0,
            border: 0,
            outline: 0,
            resize: "auto",
            overflow: "hidden",
            whiteSpace: "pre",
            background: "transparent",
          }}
        />) : null}
      <canvas
        // handles the event when user clicks his mouse button and holds it
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        id='canvas'
      />
    </>
  );
};

export default Whiteboard