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
      const rendersPerSecond = (renderCount / (timeSinceLastLog / 1000)).toFixed(1);
      console.log(`🎨 Performance: ${renderCount} renders in ${(timeSinceLastLog / 1000).toFixed(1)}s (${rendersPerSecond} renders/sec)`);
      
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
    
    console.log(`📊 Canvas Stats: ${shapes.length} total shapes, ${visibleCount} visible, ${lockedCount} locked`);
  }
}

/**
 * Measure function execution time
 * @param {string} label - Label for the measurement
 * @param {Function} fn - Function to measure
 */
export async function measureTime(label, fn) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return await fn();
}

