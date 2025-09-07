import rough from 'roughjs'
import { toolTypes } from '../../constants'

const generator = rough.generator()

const generateRectangle = ({x1, y1, x2, y2}) => {
  return generator.rectangle(x1, y1, x2-x1, y2-y1);
};
const generateLine = ({x1, y1, x2, y2}) => {
  return generator.line(x1, y1, x2, y2);
}

// this function creates the element object that we are storing in our store
export const createElement = ({x1, y1, x2, y2, toolType, id, text}) => {
    let roughElement;

    switch (toolType) {
        case toolTypes.RECTANGLE : 
        //   generate rectangle function is created as a JS file (now refer store.js, middleware)
          roughElement = generateRectangle({x1, y1, x2, y2});
          return {
            id: id,
            roughElement,
            type: toolType,
            x1,
            y1,
            x2,
            y2
          };

        case toolTypes.LINE:
          roughElement = generateLine({x1, y1, x2, y2});
          return {
            id: id,
            roughElement,
            type: toolType,
            x1,
            y1,
            x2,
            y2
          };
        case toolTypes.PENCIL:
          return{
            id,
            type: toolType,
            points: [{x: x1, y: y1}],
          }
          // x2 y2 also need to be returned, if we dont then we wont be able to find out if our cursor is INSIDE (refer constants folder) (using in moving functionality) our textarea
          case toolTypes.TEXT:
            return {id, type: toolType, x1, y1, x2, y2, text: text || ''}
        default:
            throw new Error("Something went wrong when creating element");
    }
}