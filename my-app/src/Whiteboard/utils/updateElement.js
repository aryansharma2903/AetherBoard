import { createElement } from '.';
import { toolTypes } from "../../constants"
import { emitElementUpdate } from '../../socketConn/socketConn';
import {store} from '../../store/store'
import { setElements } from "../Whiteboard-Slice";


export const updatePencilWhenMoving = ({index, newPoints}, elements) => {
    const elementsCopy = [...elements];

    elementsCopy[index] = {
        ...elementsCopy[index],
        points: newPoints,
    }

    const updatedPencilElement = elementsCopy[index];

    store.dispatch(setElements(elementsCopy));
    emitElementUpdate(updatedPencilElement);
}

export const updateElement = ({id, x1, x2, y1, y2, type, index, text}, elements) =>{
    const elementsCopy = [...elements]
    // console.log("called")

    switch (type){
        // in switch case statements if a case has no code or break statement then for that case the code of the next case is executed
        case toolTypes.LINE:
        case toolTypes.RECTANGLE:
          const updatedElement = createElement({
                id,
                x1,
                y1,
                x2,
                y2,
                toolType : type
            });

            elementsCopy[index] = updatedElement;

            // not using useDispatch hook
            store.dispatch(setElements(elementsCopy));

            // exported from socketConn.js
            emitElementUpdate(updatedElement);
            break;
        case toolTypes.PENCIL:
            elementsCopy[index] = {
                // to get all properties from element at index
                ...elementsCopy[index],
                points: [
                    // to get all points already stored in pencil element
                    ...elementsCopy[index].points,
                    // adding new point
                    {
                        x: x2,
                        y: y2,
                    }
                ]
            }

            // helper variable
            const updatedPencilElement = elementsCopy[index]

            store.dispatch(setElements(elementsCopy));

            emitElementUpdate(updatedPencilElement);
            break;
        case toolTypes.TEXT:
            const textWidth = document
                .getElementById('canvas')
                .getContext('2d')
                .measureText(text).width;

            const textHeight = 24;

            elementsCopy[index] = {
                // to create the updated element
                ...createElement({
                    id, x1, y1,
                    x2: x1 + textWidth,
                    y2: y1 + textHeight,
                    toolType: type, 
                    text,
                }),
            };
            const updatedTextElement = elementsCopy[index];
            store.dispatch(setElements(elementsCopy));
            emitElementUpdate(updatedTextElement);
            break;

        default:
            throw new Error('Something went wrong when updating element')

    }
};