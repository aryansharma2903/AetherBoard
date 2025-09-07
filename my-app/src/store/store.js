import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import whiteboardSliceReducer from '../Whiteboard/Whiteboard-Slice'
import Whiteboard from '../Whiteboard/Whiteboard';
import cursorSliceReducer from '../CursorOverlay/cursorSlice'


// configureStore configures our redux store
export const store = configureStore({
  reducer: {
    Whiteboard: whiteboardSliceReducer,
    cursor: cursorSliceReducer,
  },
  // create element function creates and element object that is being put into our store
  // we are storing objects in store that have attributes like roughElement, which is non serializable(that is why there is problem)
  // even without this middleware our app will work fine but console will show errors, therefores we tell redux to ignore
  // 1) if elements are serialized(refer to whiteboardslize)
  // 2) also ignore setElements action which is dispatched to store

  middleware : (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoreActions : ['Whiteboard/setElements'],
        ignoredPaths: ['Whiteboard.elements']
      }
    })
});
