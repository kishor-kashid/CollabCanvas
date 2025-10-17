// Canvas Helper Utilities - Extracted from Canvas.jsx for better maintainability

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

/**
 * Generate grid lines for visual reference on canvas (memoized)
 * @returns {Array} Array of Line components
 */
let cachedGridLines = null;
export function generateGridLines() {
  // Return cached grid lines if already generated (performance optimization)
  if (cachedGridLines) {
    return cachedGridLines;
  }
  
  const lines = [];
  const gridSize = 100; // Grid cell size in pixels
  const lineColor = '#e0e0e0';
  const majorLineColor = '#bdbdbd';
  
  // Vertical lines
  for (let i = 0; i <= CANVAS_WIDTH; i += gridSize) {
    const isMajor = i % 500 === 0; // Every 500px is a major line
    lines.push({
      key: `v-${i}`,
      points: [i, 0, i, CANVAS_HEIGHT],
      stroke: isMajor ? majorLineColor : lineColor,
      strokeWidth: isMajor ? 1 : 0.5,
    });
  }
  
  // Horizontal lines
  for (let i = 0; i <= CANVAS_HEIGHT; i += gridSize) {
    const isMajor = i % 500 === 0;
    lines.push({
      key: `h-${i}`,
      points: [0, i, CANVAS_WIDTH, i],
      stroke: isMajor ? majorLineColor : lineColor,
      strokeWidth: isMajor ? 1 : 0.5,
    });
  }
  
  // Cache the result for future calls
  cachedGridLines = lines;
  return lines;
}

/**
 * Calculate constrained position for arrow key movement
 * @param {Object} shape - The shape being moved
 * @param {number} deltaX - X movement delta
 * @param {number} deltaY - Y movement delta
 * @returns {Object} New constrained position {x, y}
 */
export function calculateConstrainedPosition(shape, deltaX, deltaY) {
  let newX = shape.x + deltaX;
  let newY = shape.y + deltaY;
  
  // Apply boundary constraints based on shape type
  if (shape.type === 'circle') {
    // For circles, x and y represent the CENTER
    const effectiveRadius = shape.radius * Math.max(shape.scaleX || 1, shape.scaleY || 1);
    newX = Math.max(effectiveRadius, Math.min(newX, CANVAS_WIDTH - effectiveRadius));
    newY = Math.max(effectiveRadius, Math.min(newY, CANVAS_HEIGHT - effectiveRadius));
  } else {
    // For rectangles, x and y represent the TOP-LEFT corner
    const shapeWidth = (shape.width || 0) * (shape.scaleX || 1);
    const shapeHeight = (shape.height || 0) * (shape.scaleY || 1);
    
    // Simple constraint for non-rotated or slightly rotated shapes
    if (!shape.rotation || Math.abs(shape.rotation) < 5) {
      newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - shapeWidth));
      newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - shapeHeight));
    } else {
      // For rotated rectangles, use a more conservative boundary
      const diagonal = Math.sqrt(shapeWidth * shapeWidth + shapeHeight * shapeHeight) / 2;
      newX = Math.max(diagonal, Math.min(newX, CANVAS_WIDTH - diagonal));
      newY = Math.max(diagonal, Math.min(newY, CANVAS_HEIGHT - diagonal));
    }
  }
  
  return { x: newX, y: newY };
}

/**
 * Normalize selection box (handle negative width/height)
 * @param {Object} selectionBox - Selection box with x, y, width, height
 * @returns {Object} Normalized selection box
 */
export function normalizeSelectionBox(selectionBox) {
  const normalizedX = selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x;
  const normalizedY = selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y;
  const normalizedWidth = Math.abs(selectionBox.width);
  const normalizedHeight = Math.abs(selectionBox.height);
  
  return {
    x: normalizedX,
    y: normalizedY,
    width: normalizedWidth,
    height: normalizedHeight,
  };
}

/**
 * Export stage area to PNG
 * @param {Object} stage - Konva stage reference
 * @param {Object} selectionBox - Area to export
 * @param {Function} setSelectionBoxFn - Function to temporarily hide selection box
 * @returns {Promise<string>} Data URL of exported image
 */
export async function exportStageToPNG(stage, selectionBox, setSelectionBoxFn) {
  // Store original view settings
  const originalScale = stage.scaleX();
  const originalPosition = { x: stage.x(), y: stage.y() };
  
  // Temporarily hide selection box
  setSelectionBoxFn(null);
  
  // Wait for React to update (hide the selection rectangle)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Temporarily reset to default view
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  
  const normalized = normalizeSelectionBox(selectionBox);
  
  // Generate PNG for selected area at full quality
  const dataURL = stage.toDataURL({
    pixelRatio: 1, // Full quality
    mimeType: 'image/png',
    quality: 1,
    x: normalized.x,
    y: normalized.y,
    width: normalized.width,
    height: normalized.height
  });
  
  // Restore original view
  stage.scale({ x: originalScale, y: originalScale });
  stage.position(originalPosition);
  
  return dataURL;
}

/**
 * Trigger download of data URL
 * @param {string} dataURL - Data URL to download
 * @param {string} filename - Filename for download
 */
export function downloadDataURL(dataURL, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get user-friendly error message for AI errors
 * @param {string|Error} error - Error object or message
 * @returns {string} User-friendly error message
 */
export function getAIErrorMessage(error) {
  const errorStr = typeof error === 'string' ? error : error?.message || '';
  
  if (errorStr.includes('API key')) {
    return '🔑 AI is not configured. Please add your OpenAI API key to continue.';
  } else if (errorStr.includes('network') || errorStr.includes('fetch')) {
    return '📡 Connection lost. Please check your internet and try again.';
  } else if (errorStr.includes('rate limit')) {
    return '⏱️ Too many requests. Please wait a moment and try again.';
  } else if (errorStr.includes('timeout')) {
    return '⏱️ Request timed out. The AI is taking too long to respond. Please try again.';
  } else if (errorStr) {
    return `❌ ${errorStr}`;
  }
  return 'Sorry, I encountered an error. Please try again.';
}

