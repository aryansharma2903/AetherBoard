import { toolTypes, cursorPositions } from "../../constants";

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y-b.y, 2));

const onLine = ({ x1, y1, x2, y2, x, y, maxDistance = 1 }) => {
    const a = {x : x1, y : y1};
    const b = {x : x2, y : y2};
    const c = { x, y };

    // its not possible to click on a point that lies on line perfectly therefore we introduce offset
    // ideally this expression should be zero (obvious)
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));

    return Math.abs(offset) < maxDistance ? cursorPositions.INSIDE : null
}

// returns where our cursor is (refer to cursorPostion.js in constants for possibilities)
const nearPoint = (x, y, x1, y1, cursorPosition) => {
    return (Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5)
        ? cursorPosition
        : null

}
const positionWithinElement = (x, y, element) => {
    const { type, x1, x2, y1, y2 } = element;

    switch (type) {
        case toolTypes.RECTANGLE:
            // topLeft corner is always x1, y1 because we made coordinatea adjustment
            const topLeft = nearPoint(x, y, x1, y1, cursorPositions.TOP_LEFT);
            const topRight = nearPoint(x, y, x2, y1, cursorPositions.TOP_RIGHT);
            const bottomLeft = nearPoint(x, y, x1, y2, cursorPositions.BOTTOM_LEFT);
            const bottomRight = nearPoint(x, y, x2, y2, cursorPositions.BOTTOM_RIGHT);
            const inside = (x >= x1 && x <= x2 && y >= y1 && y <= y2)
                ? cursorPositions.INSIDE
                : null;
            // the first position that is not null gets returned
            return topLeft || topRight || bottomLeft || bottomRight || inside;

        case toolTypes.TEXT:
            return x >= x1 && x <= x2 && y >= y1 && y <= y2
                ? cursorPositions.INSIDE
                : null;

        case toolTypes.LINE:
            const on = onLine({x1, y1, x2, y2, x, y});
            const start = nearPoint(x, y, x1, y1, cursorPositions.START);
            const end = nearPoint(x, y, x2, y2, cursorPositions.END);

            return start || end || on;

        case toolTypes.PENCIL:
            // .some() returns true if cond satisfied for any point
            const betweenAnyPoint = element.points.some((point, index) => {
                const nextPoint = element.points[index+1]
                if(!nextPoint)return false;
                return onLine({
                        x1: point.x, 
                        y1: point.y, 
                        x2: nextPoint.x, 
                        y2: nextPoint.y, 
                        x, 
                        y,
                        maxDistance: 5
                });
            })

            return betweenAnyPoint ? cursorPositions.INSIDE : null;
    }
}

export const getElementAtPosition = (x, y, elements) => {
    return elements.map((el) => ({
        ...el,
        // function responsible to find out at what special position (of the element in the current iteration) is the cursor pointing
        position: positionWithinElement(x, y, el)
    }))
        // if the special position comes out to be non null and not undefined means we have found the element at position
        .find(el => el.position !== null && el.position !== undefined);
};