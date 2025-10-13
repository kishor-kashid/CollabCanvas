// CanvasContext - To be implemented in PR #3-5
// This context provides canvas state and shape operations

import { createContext, useState, useRef } from 'react';

export const CanvasContext = createContext(null);

/**
 * CanvasProvider component that provides canvas state and operations
 */
export function CanvasProvider({ children }) {
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef(null);
  
  // Shape operations to be implemented in PR #4-5:
  // - addShape(shapeData)
  // - updateShape(id, updates)
  // - deleteShape(id)
  // - selectShape(id)
  // - lockShape(id, userId)
  // - unlockShape(id)
  
  const value = {
    shapes,
    selectedId,
    stageRef,
    setShapes,
    setSelectedId,
  };
  
  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

