// Performance Monitor - Track canvas rendering performance

let renderCount = 0;
let lastLogTime = Date.now();

/**
 * Track component render
 * @param {string} componentName - Name of the component being rendered
 */
export function trackRender(componentName) {
  if (process.env.NODE_ENV === 'development') {
    renderCount++;
    
    const now = Date.now();
    const timeSinceLastLog = now - lastLogTime;
    
    // Log every 2 seconds
    if (timeSinceLastLog >= 2000) {
      renderCount = 0;
      lastLogTime = now;
    }
  }
}

/**
 * Log shape count statistics
 * @param {Array} shapes - Array of shapes
 */
export function logShapeStats(shapes) {
  if (process.env.NODE_ENV === 'development') {
    const visibleCount = shapes.filter(s => s.visible !== false).length;
    const lockedCount = shapes.filter(s => s.isLocked).length;
  }
}

/**
 * Measure function execution time
 * @param {string} label - Label for the measurement
 * @param {Function} fn - Function to measure
 */
export async function measureTime(label, fn) {
  return await fn();
}

