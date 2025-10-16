// AI Helpers - Utility functions for AI canvas operations

import { COLOR_MAP, VALIDATION, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/aiConstants';
import { CANVAS_WIDTH as CANVAS_W, CANVAS_HEIGHT as CANVAS_H } from '../utils/constants';

/**
 * Parse color from natural language or hex
 * @param {string} colorString - Color name or hex code
 * @returns {string} Hex color code
 */
export function parseColor(colorString) {
  if (!colorString) return null;
  
  const normalized = colorString.toLowerCase().trim();
  
  // Check if it's a hex code
  if (normalized.startsWith('#')) {
    return normalized;
  }
  
  // Check color map for named colors
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }
  
  // Return as-is if not found (let the canvas handle it)
  return colorString;
}

/**
 * Calculate center position of the canvas
 * @param {number} viewportWidth - Current viewport width
 * @param {number} viewportHeight - Current viewport height
 * @returns {Object} {x, y} center coordinates
 */
export function calculateCenter(viewportWidth = 1920, viewportHeight = 1080) {
  // Use canvas dimensions, not viewport
  return {
    x: (CANVAS_W || 5000) / 2,
    y: (CANVAS_H || 5000) / 2,
  };
}

/**
 * Parse position from natural language
 * @param {string} positionString - Position description
 * @param {Object} canvasBounds - Canvas boundaries
 * @returns {Object|null} {x, y} or null if not parseable
 */
export function parsePosition(positionString, canvasBounds = {}) {
  if (!positionString) return null;
  
  const normalized = positionString.toLowerCase().trim();
  const canvasWidth = canvasBounds.width || CANVAS_W || 5000;
  const canvasHeight = canvasBounds.height || CANVAS_H || 5000;
  
  // Handle keywords
  if (normalized.includes('center') || normalized.includes('middle')) {
    return { x: canvasWidth / 2, y: canvasHeight / 2 };
  }
  
  if (normalized.includes('top') && normalized.includes('left')) {
    return { x: 100, y: 100 };
  }
  
  if (normalized.includes('top') && normalized.includes('right')) {
    return { x: canvasWidth - 200, y: 100 };
  }
  
  if (normalized.includes('bottom') && normalized.includes('left')) {
    return { x: 100, y: canvasHeight - 200 };
  }
  
  if (normalized.includes('bottom') && normalized.includes('right')) {
    return { x: canvasWidth - 200, y: canvasHeight - 200 };
  }
  
  if (normalized.includes('top')) {
    return { x: canvasWidth / 2, y: 100 };
  }
  
  if (normalized.includes('bottom')) {
    return { x: canvasWidth / 2, y: canvasHeight - 200 };
  }
  
  if (normalized.includes('left')) {
    return { x: 100, y: canvasHeight / 2 };
  }
  
  if (normalized.includes('right')) {
    return { x: canvasWidth - 200, y: canvasHeight / 2 };
  }
  
  return null;
}

/**
 * Find shapes by description (color, size, type, position)
 * @param {Array} shapes - All shapes on canvas
 * @param {string} description - Shape description
 * @param {string} selectedId - Currently selected shape ID
 * @returns {Array} Matching shapes
 */
export function findShapesByDescription(shapes, description, selectedId = null) {
  if (!description || !shapes || shapes.length === 0) {
    return [];
  }
  
  const normalized = description.toLowerCase().trim();
  const matches = [];
  
  // Handle "selected" keyword
  if (normalized.includes('selected') && selectedId) {
    const selected = shapes.find(s => s.id === selectedId);
    return selected ? [selected] : [];
  }
  
  // Filter by various criteria
  for (const shape of shapes) {
    let score = 0;
    
    // Check color
    if (shape.fill) {
      const shapeFill = shape.fill.toLowerCase();
      for (const [colorName, colorHex] of Object.entries(COLOR_MAP)) {
        if (normalized.includes(colorName)) {
          if (shapeFill === colorHex.toLowerCase() || shapeFill.includes(colorName)) {
            score += 10;
          }
        }
      }
    }
    
    // Check type
    if (normalized.includes(shape.type)) {
      score += 10;
    }
    
    // Check size descriptors
    if (normalized.includes('large') || normalized.includes('big')) {
      const area = (shape.width || shape.radius * 2 || 0) * (shape.height || shape.radius * 2 || 0);
      if (area > 15000) score += 5;
    }
    
    if (normalized.includes('small')) {
      const area = (shape.width || shape.radius * 2 || 0) * (shape.height || shape.radius * 2 || 0);
      if (area < 5000) score += 5;
    }
    
    // Check position
    const canvasWidth = CANVAS_W || 5000;
    const canvasHeight = CANVAS_H || 5000;
    
    if (normalized.includes('top') && shape.y < canvasHeight / 3) score += 5;
    if (normalized.includes('bottom') && shape.y > canvasHeight * 2 / 3) score += 5;
    if (normalized.includes('left') && shape.x < canvasWidth / 3) score += 5;
    if (normalized.includes('right') && shape.x > canvasWidth * 2 / 3) score += 5;
    if (normalized.includes('center') && 
        Math.abs(shape.x - canvasWidth / 2) < canvasWidth / 4 &&
        Math.abs(shape.y - canvasHeight / 2) < canvasHeight / 4) {
      score += 5;
    }
    
    // Check text content for text shapes
    if (shape.type === 'text' && shape.text && normalized.includes(shape.text.toLowerCase())) {
      score += 10;
    }
    
    if (score > 0) {
      matches.push({ shape, score });
    }
  }
  
  // Sort by score and return shapes
  matches.sort((a, b) => b.score - a.score);
  return matches.map(m => m.shape);
}

/**
 * Get the largest shape from a set
 * @param {Array} shapes - Shapes to compare
 * @returns {Object|null} Largest shape
 */
export function getLargestShape(shapes) {
  if (!shapes || shapes.length === 0) return null;
  
  let largest = shapes[0];
  let maxArea = getShapeArea(largest);
  
  for (const shape of shapes) {
    const area = getShapeArea(shape);
    if (area > maxArea) {
      maxArea = area;
      largest = shape;
    }
  }
  
  return largest;
}

/**
 * Get the smallest shape from a set
 * @param {Array} shapes - Shapes to compare
 * @returns {Object|null} Smallest shape
 */
export function getSmallestShape(shapes) {
  if (!shapes || shapes.length === 0) return null;
  
  let smallest = shapes[0];
  let minArea = getShapeArea(smallest);
  
  for (const shape of shapes) {
    const area = getShapeArea(shape);
    if (area < minArea) {
      minArea = area;
      smallest = shape;
    }
  }
  
  return smallest;
}

/**
 * Calculate area of a shape
 * @param {Object} shape - Shape object
 * @returns {number} Area in pixels
 */
export function getShapeArea(shape) {
  if (shape.type === 'circle') {
    const radius = shape.radius * (shape.scaleX || 1);
    return Math.PI * radius * radius;
  }
  
  if (shape.type === 'rectangle') {
    const width = shape.width * (shape.scaleX || 1);
    const height = shape.height * (shape.scaleY || 1);
    return width * height;
  }
  
  if (shape.type === 'text') {
    const width = (shape.width || 100) * (shape.scaleX || 1);
    const height = (shape.height || 50) * (shape.scaleY || 1);
    return width * height;
  }
  
  return 0;
}

/**
 * Validate position is within canvas bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object} {x, y} clamped to valid range
 */
export function validatePosition(x, y) {
  const canvasWidth = CANVAS_W || 5000;
  const canvasHeight = CANVAS_H || 5000;
  
  return {
    x: Math.max(0, Math.min(canvasWidth, x)),
    y: Math.max(0, Math.min(canvasHeight, y)),
  };
}

/**
 * Validate dimensions
 * @param {number} width - Width value
 * @param {number} height - Height value
 * @returns {Object} {width, height} clamped to valid range
 */
export function validateDimensions(width, height) {
  return {
    width: Math.max(VALIDATION.dimensions.minWidth, Math.min(VALIDATION.dimensions.maxWidth, width)),
    height: Math.max(VALIDATION.dimensions.minHeight, Math.min(VALIDATION.dimensions.maxHeight, height)),
  };
}

/**
 * Calculate grid positions
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number} spacing - Space between elements
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} elementWidth - Width of each element
 * @param {number} elementHeight - Height of each element
 * @returns {Array} Array of {x, y} positions
 */
export function calculateGridPositions(rows, cols, spacing, startX, startY, elementWidth, elementHeight) {
  const positions = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: startX + col * (elementWidth + spacing),
        y: startY + row * (elementHeight + spacing),
      });
    }
  }
  
  return positions;
}

/**
 * Calculate positions for horizontal arrangement
 * @param {Array} shapes - Shapes to arrange
 * @param {number} spacing - Space between shapes
 * @param {number} startX - Starting X position
 * @param {number} y - Y position for all shapes
 * @returns {Array} Array of {shapeId, x, y}
 */
export function calculateHorizontalLayout(shapes, spacing, startX, y) {
  const positions = [];
  let currentX = startX;
  
  for (const shape of shapes) {
    positions.push({
      shapeId: shape.id,
      x: currentX,
      y,
    });
    
    const width = shape.width || (shape.radius ? shape.radius * 2 : 100);
    currentX += width + spacing;
  }
  
  return positions;
}

/**
 * Calculate positions for vertical arrangement
 * @param {Array} shapes - Shapes to arrange
 * @param {number} spacing - Space between shapes
 * @param {number} x - X position for all shapes
 * @param {number} startY - Starting Y position
 * @returns {Array} Array of {shapeId, x, y}
 */
export function calculateVerticalLayout(shapes, spacing, x, startY) {
  const positions = [];
  let currentY = startY;
  
  for (const shape of shapes) {
    positions.push({
      shapeId: shape.id,
      x,
      y: currentY,
    });
    
    const height = shape.height || (shape.radius ? shape.radius * 2 : 100);
    currentY += height + spacing;
  }
  
  return positions;
}

/**
 * Parse numeric value from string (handles "twice", "half", percentages)
 * @param {string|number} value - Value to parse
 * @param {number} currentValue - Current value for relative calculations
 * @returns {number} Parsed numeric value
 */
export function parseNumericValue(value, currentValue = 100) {
  if (typeof value === 'number') return value;
  
  const str = value.toString().toLowerCase().trim();
  
  // Handle multipliers
  if (str.includes('twice') || str.includes('double') || str.includes('2x')) {
    return currentValue * 2;
  }
  
  if (str.includes('half') || str.includes('0.5x')) {
    return currentValue * 0.5;
  }
  
  if (str.includes('triple') || str.includes('3x')) {
    return currentValue * 3;
  }
  
  // Handle percentages
  if (str.includes('%')) {
    const percent = parseFloat(str);
    return (percent / 100) * currentValue;
  }
  
  // Extract number
  const match = str.match(/[-+]?\d+\.?\d*/);
  if (match) {
    return parseFloat(match[0]);
  }
  
  return currentValue;
}

/**
 * Generate shape description for AI context
 * @param {Object} shape - Shape object
 * @returns {string} Human-readable description
 */
export function generateShapeDescription(shape) {
  if (!shape) return 'unknown shape';
  
  let desc = '';
  
  // Add color
  if (shape.fill) {
    const colorName = Object.entries(COLOR_MAP).find(([name, hex]) => 
      hex.toLowerCase() === shape.fill.toLowerCase()
    )?.[0] || shape.fill;
    desc += `${colorName} `;
  }
  
  // Add type
  desc += shape.type;
  
  // Add position
  desc += ` at (${Math.round(shape.x)}, ${Math.round(shape.y)})`;
  
  // Add size info
  if (shape.type === 'circle') {
    desc += `, radius ${Math.round(shape.radius)}`;
  } else if (shape.type === 'rectangle') {
    desc += `, size ${Math.round(shape.width)}x${Math.round(shape.height)}`;
  } else if (shape.type === 'text') {
    desc += `, text: "${shape.text}"`;
  }
  
  return desc;
}

/**
 * Serialize canvas state for AI context
 * @param {Array} shapes - All shapes on canvas
 * @param {string} selectedId - Currently selected shape ID
 * @returns {Object} Serialized state
 */
export function serializeCanvasState(shapes, selectedId = null) {
  return {
    totalShapes: shapes.length,
    shapes: shapes.map(shape => ({
      id: shape.id,
      type: shape.type,
      position: { x: Math.round(shape.x), y: Math.round(shape.y) },
      ...(shape.width && { width: Math.round(shape.width) }),
      ...(shape.height && { height: Math.round(shape.height) }),
      ...(shape.radius && { radius: Math.round(shape.radius) }),
      ...(shape.fill && { color: shape.fill }),
      ...(shape.text && { text: shape.text }),
      ...(shape.rotation && { rotation: Math.round(shape.rotation) }),
      isSelected: shape.id === selectedId,
    })),
    selectedShapeId: selectedId,
  };
}

// Export all functions
export default {
  parseColor,
  calculateCenter,
  parsePosition,
  findShapesByDescription,
  getLargestShape,
  getSmallestShape,
  getShapeArea,
  validatePosition,
  validateDimensions,
  calculateGridPositions,
  calculateHorizontalLayout,
  calculateVerticalLayout,
  parseNumericValue,
  generateShapeDescription,
  serializeCanvasState,
};

