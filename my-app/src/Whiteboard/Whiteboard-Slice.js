import {createSlice} from '@reduxjs/toolkit';


const initialState = {
  tool: null,
  elements: []
};

const WhiteboardSlice = createSlice({
    name: 'Whiteboard',
    initialState,
    reducers : {
      setToolType: (state, action) => {
        state.tool = action.payload;
      },
      updateElements: (state, action) => {
        const { id } = action.payload;
        
        // finding if the element already exists in the element array
        const index = state.elements.findIndex(element => element.id === id);

        if(index === -1){
          state.elements.push(action.payload);
        }else{
          // if element is found, update it in the elements array by replacement
          // 'element-update' event listener in socketConn.js
          state.elements[index] = action.payload;
        }
      },

      setElements : (state, action) => {
        state.elements = action.payload;
      }
    },
});

// exporting setToolTyle
// setToolType allows us to change our store tool
// for us it is the info whether we are drawing or we are creating a rectangle
export const {setToolType, updateElements, setElements} =  WhiteboardSlice.actions;

export default WhiteboardSlice.reducer