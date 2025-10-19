// AI Tools - Tool definitions and execution for OpenAI function calling

import { SHAPE_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/constants';
import { LAYOUT_TEMPLATES } from '../utils/aiConstants';
import {
  parseColor,
  calculateViewportCenter,
  findShapesByDescription,
  validatePosition,
  validateDimensions,
  calculateGridPositions,
  calculateHorizontalLayout,
  calculateVerticalLayout,
  generateShapeDescription,
  serializeCanvasState,
} from './aiHelpers';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Split array into chunks of specified size
 * @param {Array} array - Array to split
 * @param {number} chunkSize - Size of each chunk
 * @returns {Array} Array of chunks
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Delay helper for async operations
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TOOL SCHEMA DEFINITIONS
// ============================================================================

/**
 * Get all tool schemas for OpenAI function calling
 * @returns {Array} Array of tool schemas
 */
export function getToolSchemas() {
  return [
    // Tool 1: Create Shape
    {
      type: 'function',
      function: {
        name: 'createShape',
        description: 'Create a new shape on the canvas (rectangle, circle, triangle, or text). Use this when the user asks to create, add, or make a new shape.',
        parameters: {
          type: 'object',
          properties: {
            shapeType: {
              type: 'string',
              enum: ['rectangle', 'circle', 'triangle', 'text'],
              description: 'The type of shape to create',
            },
            x: {
              type: 'number',
              description: 'X coordinate position on the canvas. Optional - if omitted, the shape will be created at the center of the user\'s current viewport (where they\'re looking).',
            },
            y: {
              type: 'number',
              description: 'Y coordinate position on the canvas. Optional - if omitted, the shape will be created at the center of the user\'s current viewport (where they\'re looking).',
            },
            width: {
              type: 'number',
              description: 'Width of the shape in pixels (for rectangle). Optional, defaults to 100.',
            },
            height: {
              type: 'number',
              description: 'Height of the shape in pixels (for rectangle). Optional, defaults to 100.',
            },
            radius: {
              type: 'number',
              description: 'Radius of the circle in pixels (for circle only). Optional, defaults to 50.',
            },
            fill: {
              type: 'string',
              description: 'Fill color as hex code (e.g., "#FF0000" for red) or color name (e.g., "red", "blue"). Optional, defaults to gray.',
            },
            text: {
              type: 'string',
              description: 'Text content (for text type only). Required when shapeType is "text".',
            },
            fontSize: {
              type: 'number',
              description: 'Font size in pixels (for text only). Optional, defaults to 24.',
            },
          },
          required: ['shapeType'],
        },
      },
    },

    // Tool 1B: Create Multiple Shapes (Bulk Creation)
    {
      type: 'function',
      function: {
        name: 'createMultipleShapes',
        description: 'Create multiple shapes at once (1-500 shapes). Use when user asks to create N rectangles/circles/triangles. For ≤10 shapes, places them in the viewport. For >10 shapes, distributes them randomly across the canvas with optimistic UI updates.',
        parameters: {
          type: 'object',
          properties: {
            shapeType: {
              type: 'string',
              enum: ['rectangle', 'circle', 'triangle'],
              description: 'The type of shape to create (multiple of same type)',
            },
            count: {
              type: 'number',
              description: 'Number of shapes to create (1-500). Required.',
            },
            fill: {
              type: 'string',
              description: 'Fill color for all shapes as hex code or color name. Optional.',
            },
            width: {
              type: 'number',
              description: 'Width for rectangles/triangles in pixels. Optional, defaults to 300.',
            },
            height: {
              type: 'number',
              description: 'Height for rectangles/triangles in pixels. Optional, defaults to 300.',
            },
            radius: {
              type: 'number',
              description: 'Radius for circles in pixels. Optional, defaults to 150.',
            },
          },
      required: ['shapeType', 'count'],
    },
  },
},

// Tool 1C: Create Grid
{
  type: 'function',
  function: {
    name: 'createGrid',
    description: 'Create shapes arranged in a grid pattern. Use when user asks to "create a grid", "create NxM shapes", "arrange in grid", or "create a 5x5 grid". Shapes are positioned in rows and columns with consistent spacing.',
    parameters: {
      type: 'object',
      properties: {
        shapeType: {
          type: 'string',
          enum: ['rectangle', 'circle', 'triangle'],
          description: 'The type of shape to create in the grid',
        },
        rows: {
          type: 'number',
          description: 'Number of rows in the grid. For "5x3 grid", rows=5. For "grid of 16", calculate sqrt and round (4x4). Required.',
        },
        columns: {
          type: 'number',
          description: 'Number of columns in the grid. For "5x3 grid", columns=3. Required.',
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes in pixels. Default: 50.',
        },
        fill: {
          type: 'string',
          description: 'Fill color for all shapes as hex code or color name. Optional.',
        },
        width: {
          type: 'number',
          description: 'Width for rectangles/triangles in pixels. Default: 300.',
        },
        height: {
          type: 'number',
          description: 'Height for rectangles/triangles in pixels. Default: 300.',
        },
        radius: {
          type: 'number',
          description: 'Radius for circles in pixels. Default: 150.',
        },
      },
      required: ['shapeType', 'rows', 'columns'],
    },
  },
},

// Tool 2: Move Shape
{
  type: 'function',
  function: {
    name: 'moveShape',
        description: 'Move a shape to a new position. You must first use getCanvasState to find the shape, or use selectShapesByDescription to identify it.',
        parameters: {
          type: 'object',
          properties: {
            shapeId: {
              type: 'string',
              description: 'The ID of the shape to move. Get this from getCanvasState or selectShapesByDescription.',
            },
            x: {
              type: 'number',
              description: 'New X coordinate (0-5000). Can use keywords like "center".',
            },
            y: {
              type: 'number',
              description: 'New Y coordinate (0-5000)',
            },
            relative: {
              type: 'boolean',
              description: 'If true, move by offset (dx, dy) instead of absolute position. Default false.',
            },
          },
          required: ['shapeId', 'x', 'y'],
        },
      },
    },

    // Tool 2B: Move Multiple Shapes (Bulk Movement)
    {
      type: 'function',
      function: {
        name: 'moveMultipleShapes',
        description: 'Move multiple shapes to a specific location (up to 50 shapes). Use when user asks to move N shapes to a position like "top-left", "center", or specific coordinates. You must first identify the shapes using getCanvasState or selectShapesByDescription.',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of shape IDs to move. Get these from getCanvasState or selectShapesByDescription. Max 50 IDs.',
            },
            x: {
              type: 'number',
              description: 'Target X coordinate on canvas.',
            },
            y: {
              type: 'number',
              description: 'Target Y coordinate on canvas.',
            },
            position: {
              type: 'string',
              enum: ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'],
              description: 'Named position on canvas. If specified, x and y are ignored.',
            },
            arrangement: {
              type: 'string',
              enum: ['stack', 'horizontal', 'vertical', 'grid'],
              description: 'How to arrange the shapes at the target location. Default: "stack" (all at same position)',
            },
            spacing: {
              type: 'number',
              description: 'Spacing between shapes in pixels (for horizontal/vertical/grid arrangements). Default: 50.',
            },
          },
          required: ['shapeIds'],
        },
      },
    },

    // Tool 3: Resize Shape
    {
      type: 'function',
      function: {
        name: 'resizeShape',
        description: 'Resize a shape by scale factor or absolute dimensions. First identify the shape using getCanvasState or selectShapesByDescription.',
        parameters: {
          type: 'object',
          properties: {
            shapeId: {
              type: 'string',
              description: 'The ID of the shape to resize',
            },
            scaleFactor: {
              type: 'number',
              description: 'Scale factor (e.g., 2 for twice as big, 0.5 for half size). Use this OR width/height, not both.',
            },
            width: {
              type: 'number',
              description: 'New width in pixels (for rectangle). Use this OR scaleFactor.',
            },
            height: {
              type: 'number',
              description: 'New height in pixels (for rectangle). Use this OR scaleFactor.',
            },
            radius: {
              type: 'number',
              description: 'New radius in pixels (for circle). Use this OR scaleFactor.',
            },
          },
          required: ['shapeId'],
        },
      },
    },

    // Tool 4: Rotate Shape
    {
      type: 'function',
      function: {
        name: 'rotateShape',
        description: 'Rotate a shape by a specified number of degrees. First identify the shape.',
        parameters: {
          type: 'object',
          properties: {
            shapeId: {
              type: 'string',
              description: 'The ID of the shape to rotate',
            },
            degrees: {
              type: 'number',
              description: 'Rotation angle in degrees (0-360). Positive = clockwise, negative = counter-clockwise.',
            },
            absolute: {
              type: 'boolean',
              description: 'If true, set absolute rotation. If false, rotate relative to current rotation. Default true.',
            },
          },
          required: ['shapeId', 'degrees'],
        },
      },
    },

    // Tool 5: Change Shape Color
    {
      type: 'function',
      function: {
        name: 'changeShapeColor',
        description: 'Change the fill color of a shape. First identify the shape.',
        parameters: {
          type: 'object',
          properties: {
            shapeId: {
              type: 'string',
              description: 'The ID of the shape to recolor',
            },
            color: {
              type: 'string',
              description: 'New color as hex code (#FF0000) or name (red, blue, etc.)',
            },
          },
          required: ['shapeId', 'color'],
        },
      },
    },

    // Tool 6: Delete Shapes
    {
      type: 'function',
      function: {
        name: 'deleteShapes',
        description: 'Delete one or multiple shapes from the canvas. Can delete by ID, by description (e.g., "all blue rectangles"), by type (all rectangles), or by color (all blue shapes).',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of specific shape IDs to delete. Use this if you have specific IDs from getCanvasState or selectShapesByDescription.',
            },
            deleteAll: {
              type: 'boolean',
              description: 'If true, delete ALL shapes on the canvas. Use with extreme caution.',
            },
            byType: {
              type: 'string',
              enum: ['rectangle', 'circle', 'text'],
              description: 'Delete all shapes of this type (e.g., all rectangles).',
            },
            byColor: {
              type: 'string',
              description: 'Delete all shapes with this color (hex code or color name like "blue", "red").',
            },
            description: {
              type: 'string',
              description: 'Natural language description of shapes to delete (e.g., "blue rectangles", "small circles"). Will find and delete all matching shapes.',
            },
          },
        },
      },
    },

    // Tool 7: Arrange Shapes
    {
      type: 'function',
      function: {
        name: 'arrangeShapes',
        description: 'Arrange multiple shapes in a layout (horizontal, vertical, or grid). First identify shapes using getCanvasState.',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of shape IDs to arrange',
            },
            layout: {
              type: 'string',
              enum: ['horizontal', 'vertical', 'grid'],
              description: 'Layout type: horizontal row, vertical column, or grid',
            },
            spacing: {
              type: 'number',
              description: 'Space between shapes in pixels. Default 50.',
            },
            startX: {
              type: 'number',
              description: 'Starting X position. Default 100.',
            },
            startY: {
              type: 'number',
              description: 'Starting Y position. Default 100.',
            },
            gridColumns: {
              type: 'number',
              description: 'Number of columns (for grid layout only). Required for grid.',
            },
          },
          required: ['shapeIds', 'layout'],
        },
      },
    },

    // Tool 7: Get Canvas State
    {
      type: 'function',
      function: {
        name: 'getCanvasState',
        description: 'Get the current state of the canvas including all shapes. Use this before manipulating existing shapes to get their IDs and properties.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },

    // Tool 8: Get Selected Shapes
    {
      type: 'function',
      function: {
        name: 'getSelectedShapes',
        description: 'Get currently selected shape(s). Use when user refers to "selected" or "this" shape.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },

    // Tool 9: Get Capabilities (Help)
    {
      type: 'function',
      function: {
        name: 'getCapabilities',
        description: 'Show what the AI assistant can do. Use when user asks "What can you do?", "Help", "Show capabilities", "What are your commands?", or similar questions.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },

    // Tool 10: Select Shapes By Description
    {
      type: 'function',
      function: {
        name: 'selectShapesByDescription',
        description: 'Find shapes matching a description (e.g., "the blue rectangle", "the largest circle"). Returns matching shape IDs.',
        parameters: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Description of the shape(s) to find (color, size, type, position)',
            },
          },
          required: ['description'],
        },
      },
    },

    // Tool 10: Create Complex Layout
    {
      type: 'function',
      function: {
        name: 'createComplexLayout',
        description: 'Create multi-shape layouts like login forms, navigation bars, or cards. This is a high-level tool that creates multiple shapes at once.',
        parameters: {
          type: 'object',
          properties: {
            layoutType: {
              type: 'string',
              enum: ['loginForm', 'navigationBar', 'cardLayout', 'custom'],
              description: 'Type of layout to create',
            },
            config: {
              type: 'object',
              description: 'Configuration for the layout. For navigationBar, include {menuItems: ["Home", "About", "Contact"]}. For custom layouts, specify elements.',
            },
            startX: {
              type: 'number',
              description: 'Starting X position. Default 200.',
            },
            startY: {
              type: 'number',
              description: 'Starting Y position. Default 200.',
            },
          },
          required: ['layoutType'],
        },
      },
    },
  ];
}

// ============================================================================
// TOOL EXECUTION FUNCTIONS
// ============================================================================

/**
 * Execute createShape tool
 */
async function executeCreateShape(params, context) {
  try {
    const { shapeType, x, y, width, height, radius, fill, text, fontSize } = params;
    
    // Validate and process position
    // If no position specified, use viewport center instead of canvas center
    let position;
    if (x === undefined || y === undefined) {
      const viewportCenter = calculateViewportCenter(context.viewport);
      position = validatePosition(
        x !== undefined ? x : viewportCenter.x,
        y !== undefined ? y : viewportCenter.y
      );
    } else {
      position = validatePosition(x, y);
    }
    
    // Create shape via context (creates with default properties)
    const newShapeId = await context.addShape(shapeType, position);
    
    if (!newShapeId) {
      throw new Error('Failed to create shape');
    }
    
    // Prepare updates for the shape
    const updates = {};
    
    // Add type-specific properties
    if (shapeType === 'rectangle') {
      if (width && height) {
        const dims = validateDimensions(width, height);
        updates.width = dims.width;
        updates.height = dims.height;
      }
    } else if (shapeType === 'circle') {
      if (radius) {
        updates.radius = Math.max(5, Math.min(1000, radius));
      }
    } else if (shapeType === 'triangle') {
      if (width && height) {
        const dims = validateDimensions(width, height);
        updates.width = dims.width;
        updates.height = dims.height;
      }
    } else if (shapeType === 'text') {
      if (text) {
        updates.text = text;
      }
      if (fontSize) {
        updates.fontSize = Math.max(8, Math.min(200, fontSize));
      }
    }
    
    // Add color if specified
    if (fill) {
      updates.fill = parseColor(fill);
    }
    
    // Apply updates to the newly created shape
    if (Object.keys(updates).length > 0) {
      await context.updateShape(newShapeId, updates);
    }
    
    return {
      success: true,
      message: `Created ${fill ? parseColor(fill) + ' ' : ''}${shapeType} at position (${Math.round(position.x)}, ${Math.round(position.y)})`,
      shapeType,
      position,
      shapeId: newShapeId,
    };
  } catch (error) {
    console.error('Error in executeCreateShape:', error);
    return {
      success: false,
      error: error.message || 'Failed to create shape',
    };
  }
}

/**
 * Execute createMultipleShapes tool - Bulk create with optimistic UI + chunked batching
 */
async function executeCreateMultipleShapes(params, context) {
  try {
    const { shapeType, count, fill, width, height, radius } = params;
    
    // Validate count
    if (!count || count < 1) {
      return {
        success: false,
        error: 'Count must be at least 1',
      };
    }
    
    if (count > 500) {
      return {
        success: false,
        error: 'Maximum 500 shapes can be created at once. Please use a smaller number.',
      };
    }
    
    // Determine placement strategy
    const useViewport = count <= 10;
    const placementArea = useViewport ? 'viewport' : 'canvas';
    
    // Get bounds for placement
    let bounds;
    if (useViewport && context.viewport) {
      const { position, scale, width: vpWidth, height: vpHeight } = context.viewport;
      const vpLeft = -position.x / scale;
      const vpTop = -position.y / scale;
      const vpRight = vpLeft + vpWidth / scale;
      const vpBottom = vpTop + vpHeight / scale;
      
      bounds = {
        minX: Math.max(0, vpLeft + 100),
        maxX: Math.min(CANVAS_WIDTH, vpRight - 100),
        minY: Math.max(0, vpTop + 100),
        maxY: Math.min(CANVAS_HEIGHT, vpBottom - 100),
      };
    } else {
      bounds = {
        minX: 100,
        maxX: CANVAS_WIDTH - 100,
        minY: 100,
        maxY: CANVAS_HEIGHT - 100,
      };
    }
    
    // Prepare all shapes data
    const allShapesData = [];
    const colorHex = fill ? parseColor(fill) : null;
    
    for (let i = 0; i < count; i++) {
      // Random position within bounds
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
      const position = validatePosition(x, y);
      
      // Base shape properties
      const shapeData = {
        id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${i}`,
        type: shapeType,
        x: position.x,
        y: position.y,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1.0,
        blendMode: 'source-over',
      };
      
      // Add shape-specific properties
      if (shapeType === 'rectangle') {
        shapeData.width = width || 300;
        shapeData.height = height || 300;
        shapeData.fill = colorHex || context.currentColor || '#cccccc';
      } else if (shapeType === 'circle') {
        shapeData.radius = radius || 150;
        shapeData.fill = colorHex || context.currentColor || '#cccccc';
      } else if (shapeType === 'triangle') {
        shapeData.width = width || 300;
        shapeData.height = height || 300;
        shapeData.fill = colorHex || context.currentColor || '#cccccc';
      }
      
      allShapesData.push(shapeData);
    }
    
    // Step 1: Optimistic UI - Add to local state immediately
    if (context.addShapesOptimistic) {
      context.addShapesOptimistic(allShapesData);
    }
    
    // Step 2: Background sync with chunking for large batches
    const CHUNK_SIZE = 100;
    const useChunking = count > 100;
    
    let createdIds = [];
    
    if (useChunking) {
      // Split into chunks and process with progress
      const chunks = chunkArray(allShapesData, CHUNK_SIZE);
      
      // Process chunks in background
      setTimeout(async () => {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const batchNum = i + 1;
          
          try {
            const batchIds = await context.addShapesBatch(chunk);
            createdIds.push(...batchIds);
            
            // Small delay between batches
            if (i < chunks.length - 1) {
              await delay(100);
            }
          } catch (error) {
            console.error(`❌ Batch ${batchNum} failed:`, error);
          }
        }
      }, 0);
    } else {
      // For ≤100 shapes, single batch in background
      setTimeout(async () => {
        try {
          createdIds = await context.addShapesBatch(allShapesData);
        } catch (error) {
          console.error('Failed to sync shapes:', error);
        }
      }, 0);
    }
    
    let message = `Created ${count} ${shapeType}${count !== 1 ? 's' : ''}`;
    if (useViewport) {
      message += ' in your viewport';
    } else {
      message += ' across the canvas';
    }
    
    if (useChunking) {
      message += ' (syncing in background)';
    }
    
    return {
      success: true,
      message,
      createdCount: count,
      requestedCount: count,
      placementArea,
      immediate: true,
      batched: useChunking,
    };
  } catch (error) {
    console.error('Error in executeCreateMultipleShapes:', error);
    return {
      success: false,
      error: error.message || 'Failed to create multiple shapes',
    };
  }
}

/**
 * Execute createGrid tool - Create shapes in grid pattern
 */
async function executeCreateGrid(params, context) {
  try {
    const { shapeType, rows, columns, spacing = 50, fill, width, height, radius } = params;
    
    // Validate rows and columns
    if (!rows || rows < 1 || !columns || columns < 1) {
      return {
        success: false,
        error: 'Grid requires rows and columns to be at least 1. Example: for "5x5 grid", use rows=5, columns=5',
      };
    }
    
    if (rows > 50 || columns > 50) {
      return {
        success: false,
        error: 'Maximum grid size is 50x50. Please use smaller dimensions.',
      };
    }
    
    const totalShapes = rows * columns;
    
    if (totalShapes > 500) {
      return {
        success: false,
        error: `Grid of ${rows}x${columns} = ${totalShapes} shapes exceeds maximum of 500. Try smaller dimensions.`,
      };
    }
    
    // Determine shape dimensions
    const shapeWidth = width || 300;
    const shapeHeight = height || 300;
    const shapeRadius = radius || 150;
    
    // Calculate grid starting position (centered in viewport if available, otherwise default)
    let startX = 500;
    let startY = 500;
    
    if (context.viewport) {
      const { position, scale, width: vpWidth, height: vpHeight } = context.viewport;
      const vpCenterX = (-position.x + vpWidth / 2) / scale;
      const vpCenterY = (-position.y + vpHeight / 2) / scale;
      
      // Calculate grid dimensions
      const gridWidth = columns * (shapeWidth + spacing) - spacing;
      const gridHeight = rows * (shapeHeight + spacing) - spacing;
      
      // Center the grid in viewport
      startX = vpCenterX - gridWidth / 2;
      startY = vpCenterY - gridHeight / 2;
      
      // Ensure grid stays within canvas bounds
      startX = Math.max(100, Math.min(startX, CANVAS_WIDTH - gridWidth - 100));
      startY = Math.max(100, Math.min(startY, CANVAS_HEIGHT - gridHeight - 100));
    }
    
    // Generate all grid positions and shapes
    const allShapesData = [];
    const colorHex = fill ? parseColor(fill) : null;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = startX + col * (shapeWidth + spacing);
        const y = startY + row * (shapeHeight + spacing);
        const position = validatePosition(x, y);
        
        const shapeData = {
          id: `shape_${Date.now()}_${Math.random().toString(36).substring(2, 11)}_${row}_${col}`,
          type: shapeType,
          x: position.x,
          y: position.y,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        };
        
        // Add shape-specific properties
        if (shapeType === 'rectangle') {
          shapeData.width = shapeWidth;
          shapeData.height = shapeHeight;
          shapeData.fill = colorHex || context.currentColor || '#cccccc';
        } else if (shapeType === 'circle') {
          shapeData.radius = shapeRadius;
          shapeData.fill = colorHex || context.currentColor || '#cccccc';
        } else if (shapeType === 'triangle') {
          shapeData.width = shapeWidth;
          shapeData.height = shapeHeight;
          shapeData.fill = colorHex || context.currentColor || '#cccccc';
        }
        
        allShapesData.push(shapeData);
      }
    }
    
    // Step 1: Optimistic UI - Add to local state immediately
    if (context.addShapesOptimistic) {
      context.addShapesOptimistic(allShapesData);
    }
    
    // Step 2: Background sync with chunking for large grids
    const CHUNK_SIZE = 100;
    const useChunking = totalShapes > 100;
    
    if (useChunking) {
      const chunks = chunkArray(allShapesData, CHUNK_SIZE);
      
      setTimeout(async () => {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const batchNum = i + 1;
          
          try {
            await context.addShapesBatch(chunk);
            
            if (i < chunks.length - 1) {
              await delay(100);
            }
          } catch (error) {
            console.error(`❌ Batch ${batchNum} failed:`, error);
          }
        }
      }, 0);
    } else {
      setTimeout(async () => {
        try {
          await context.addShapesBatch(allShapesData);
        } catch (error) {
          console.error('Failed to create grid:', error);
        }
      }, 0);
    }
    
    return {
      success: true,
      message: `Created ${rows}x${columns} grid of ${totalShapes} ${shapeType}${totalShapes !== 1 ? 's' : ''}`,
      createdCount: totalShapes,
      rows,
      columns,
      immediate: true,
      batched: useChunking,
    };
  } catch (error) {
    console.error('Error in executeCreateGrid:', error);
    return {
      success: false,
      error: error.message || 'Failed to create grid',
    };
  }
}

/**
 * Execute moveMultipleShapes tool - Bulk move shapes
 */
async function executeMoveMultipleShapes(params, context) {
  try {
    const { shapeIds, x, y, position, arrangement = 'stack', spacing = 50 } = params;
    
    // Validate shape IDs
    if (!shapeIds || !Array.isArray(shapeIds) || shapeIds.length === 0) {
      return {
        success: false,
        error: 'No shape IDs provided. Use getCanvasState or selectShapesByDescription first.',
      };
    }
    
    if (shapeIds.length > 50) {
      return {
        success: false,
        error: 'Maximum 50 shapes can be moved at once. Please select fewer shapes.',
      };
    }
    
    // Find valid shapes (filter out locked shapes)
    const shapes = shapeIds
      .map(id => context.shapes.find(s => s.id === id))
      .filter(s => s && (!s.isLocked || s.lockedBy === context.currentUserId));
    
    if (shapes.length === 0) {
      return {
        success: false,
        error: 'None of the specified shapes were found or all are locked by other users.',
      };
    }
    
    // Determine target position
    let targetX, targetY;
    
    if (position) {
      // Use named position
      const positions = {
        'top-left': { x: 100, y: 100 },
        'top-center': { x: CANVAS_WIDTH / 2, y: 100 },
        'top-right': { x: CANVAS_WIDTH - 100, y: 100 },
        'center-left': { x: 100, y: CANVAS_HEIGHT / 2 },
        'center': { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
        'center-right': { x: CANVAS_WIDTH - 100, y: CANVAS_HEIGHT / 2 },
        'bottom-left': { x: 100, y: CANVAS_HEIGHT - 100 },
        'bottom-center': { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100 },
        'bottom-right': { x: CANVAS_WIDTH - 100, y: CANVAS_HEIGHT - 100 },
      };
      
      const pos = positions[position];
      if (!pos) {
        return {
          success: false,
          error: `Invalid position: ${position}`,
        };
      }
      targetX = pos.x;
      targetY = pos.y;
    } else if (x !== undefined && y !== undefined) {
      const validated = validatePosition(x, y);
      targetX = validated.x;
      targetY = validated.y;
    } else {
      return {
        success: false,
        error: 'Either position or both x and y coordinates must be specified',
      };
    }
    
    // Calculate positions based on arrangement
    const positions = [];
    
    if (arrangement === 'stack') {
      shapes.forEach(() => positions.push({ x: targetX, y: targetY }));
    } else if (arrangement === 'horizontal') {
      shapes.forEach((shape, i) => {
        positions.push({
          x: targetX + i * spacing,
          y: targetY,
        });
      });
    } else if (arrangement === 'vertical') {
      shapes.forEach((shape, i) => {
        positions.push({
          x: targetX,
          y: targetY + i * spacing,
        });
      });
    } else if (arrangement === 'grid') {
      const cols = Math.ceil(Math.sqrt(shapes.length));
      shapes.forEach((shape, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        positions.push({
          x: targetX + col * spacing,
          y: targetY + row * spacing,
        });
      });
    }
    
    // Prepare batch updates
    const updates = shapes.map((shape, i) => ({
      id: shape.id,
      updates: positions[i]
    }));
    
    // Step 1: Optimistic UI - Update local state immediately
    if (context.updateShapesOptimistic) {
      context.updateShapesOptimistic(updates);
    }
    
    // Step 2: Background sync - Single batch update
    setTimeout(async () => {
      try {
        await context.updateShapesBatch(updates);
      } catch (error) {
        console.error('Failed to move shapes:', error);
      }
    }, 0);
    
    const movedShapes = shapes.map(s => s.id);
    const lockedCount = shapeIds.length - shapes.length;
    
    let message = `Moved ${movedShapes.length} shape${movedShapes.length !== 1 ? 's' : ''}`;
    if (position) {
      message += ` to ${position.replace('-', ' ')}`;
    } else {
      message += ` to (${Math.round(targetX)}, ${Math.round(targetY)})`;
    }
    
    if (arrangement !== 'stack') {
      message += ` in ${arrangement} arrangement`;
    }
    
    if (lockedCount > 0) {
      message += `. Skipped ${lockedCount} locked shape${lockedCount !== 1 ? 's' : ''}.`;
    }
    
    return {
      success: true,
      message,
      movedCount: movedShapes.length,
      skippedCount: lockedCount,
      movedShapeIds: movedShapes,
      targetPosition: { x: targetX, y: targetY },
      arrangement,
    };
  } catch (error) {
    console.error('Error in executeMoveMultipleShapes:', error);
    return {
      success: false,
      error: error.message || 'Failed to move multiple shapes',
    };
  }
}

/**
 * Execute moveShape tool
 */
async function executeMoveShape(params, context) {
  try {
    const { shapeId, x, y, relative } = params;
    
    // Find the shape
    const shape = context.shapes.find(s => s.id === shapeId);
    if (!shape) {
      return {
        success: false,
        error: `Shape with ID ${shapeId} not found`,
      };
    }
    
    // Calculate new position
    let newPos;
    if (relative) {
      newPos = validatePosition(shape.x + x, shape.y + y);
    } else {
      newPos = validatePosition(x, y);
    }
    
    // Update shape position
    await context.updateShape(shapeId, { x: newPos.x, y: newPos.y });
    
    return {
      success: true,
      message: `Moved ${shape.type} to (${Math.round(newPos.x)}, ${Math.round(newPos.y)})`,
      shapeId,
      newPosition: newPos,
    };
  } catch (error) {
    console.error('Error in executeMoveShape:', error);
    return {
      success: false,
      error: error.message || 'Failed to move shape',
    };
  }
}

/**
 * Execute resizeShape tool
 */
async function executeResizeShape(params, context) {
  try {
    const { shapeId, scaleFactor, width, height, radius } = params;
    
    // Find the shape
    const shape = context.shapes.find(s => s.id === shapeId);
    if (!shape) {
      return {
        success: false,
        error: `Shape with ID ${shapeId} not found`,
      };
    }
    
    const updates = {};
    
    if (scaleFactor) {
      // Scale the shape
      updates.scaleX = (shape.scaleX || 1) * scaleFactor;
      updates.scaleY = (shape.scaleY || 1) * scaleFactor;
    } else {
      // Absolute dimensions
      if (shape.type === 'rectangle') {
        if (width) updates.width = Math.max(10, Math.min(2000, width));
        if (height) updates.height = Math.max(10, Math.min(2000, height));
      } else if (shape.type === 'circle') {
        if (radius) updates.radius = Math.max(5, Math.min(1000, radius));
      }
    }
    
    await context.updateShape(shapeId, updates);
    
    return {
      success: true,
      message: `Resized ${shape.type}${scaleFactor ? ` by ${scaleFactor}x` : ''}`,
      shapeId,
      updates,
    };
  } catch (error) {
    console.error('Error in executeResizeShape:', error);
    return {
      success: false,
      error: error.message || 'Failed to resize shape',
    };
  }
}

/**
 * Execute rotateShape tool
 */
async function executeRotateShape(params, context) {
  try {
    const { shapeId, degrees, absolute = true } = params;
    
    // Find the shape
    const shape = context.shapes.find(s => s.id === shapeId);
    if (!shape) {
      return {
        success: false,
        error: `Shape with ID ${shapeId} not found`,
      };
    }
    
    let newRotation;
    if (absolute) {
      newRotation = degrees;
    } else {
      newRotation = (shape.rotation || 0) + degrees;
    }
    
    // Normalize to 0-360
    newRotation = ((newRotation % 360) + 360) % 360;
    
    await context.updateShape(shapeId, { rotation: newRotation });
    
    return {
      success: true,
      message: `Rotated ${shape.type} to ${Math.round(newRotation)} degrees`,
      shapeId,
      rotation: newRotation,
    };
  } catch (error) {
    console.error('Error in executeRotateShape:', error);
    return {
      success: false,
      error: error.message || 'Failed to rotate shape',
    };
  }
}

/**
 * Execute changeShapeColor tool
 */
async function executeChangeShapeColor(params, context) {
  try {
    const { shapeId, color } = params;
    
    // Find the shape
    const shape = context.shapes.find(s => s.id === shapeId);
    if (!shape) {
      return {
        success: false,
        error: `Shape with ID ${shapeId} not found`,
      };
    }
    
    const parsedColor = parseColor(color);
    
    await context.updateShape(shapeId, { fill: parsedColor });
    
    return {
      success: true,
      message: `Changed ${shape.type} color to ${color}`,
      shapeId,
      color: parsedColor,
    };
  } catch (error) {
    console.error('Error in executeChangeShapeColor:', error);
    return {
      success: false,
      error: error.message || 'Failed to change color',
    };
  }
}

/**
 * Execute deleteShapes tool
 */
async function executeDeleteShapes(params, context) {
  try {
    const { shapeIds, deleteAll, byType, byColor, description } = params;
    
    let shapesToDelete = [];
    
    // Method 1: Delete specific shape IDs
    if (shapeIds && shapeIds.length > 0) {
      shapesToDelete = context.shapes.filter(s => shapeIds.includes(s.id));
    }
    // Method 2: Delete all shapes
    else if (deleteAll) {
      shapesToDelete = [...context.shapes];
    }
    // Method 3: Delete by type
    else if (byType) {
      shapesToDelete = context.shapes.filter(s => s.type === byType);
    }
    // Method 4: Delete by color
    else if (byColor) {
      const targetColor = parseColor(byColor);
      shapesToDelete = context.shapes.filter(s => s.fill === targetColor);
    }
    // Method 5: Delete by description
    else if (description) {
      shapesToDelete = findShapesByDescription(description, context.shapes);
    }
    // Method 6: Delete selected shape
    else if (context.selectedId) {
      const selectedShape = context.shapes.find(s => s.id === context.selectedId);
      if (selectedShape) {
        shapesToDelete = [selectedShape];
      }
    }
    
    if (shapesToDelete.length === 0) {
      return {
        success: false,
        error: 'No shapes found matching the criteria',
      };
    }
    
    // Filter out shapes locked by other users
    const lockedShapes = shapesToDelete.filter(
      s => s.isLocked && s.lockedBy && s.lockedBy !== context.currentUserId
    );
    const unlockedShapes = shapesToDelete.filter(
      s => !s.isLocked || !s.lockedBy || s.lockedBy === context.currentUserId
    );
    
    if (unlockedShapes.length === 0) {
      return {
        success: false,
        error: `Cannot delete: All ${shapesToDelete.length} matching shape${shapesToDelete.length !== 1 ? 's are' : ' is'} currently being edited by other users. Note: Shapes you are editing can be deleted.`,
      };
    }
    
    // Get IDs of shapes to delete
    const shapeIdsToDelete = unlockedShapes.map(s => s.id);
    
    // Step 1: Optimistic UI - Remove from local state immediately
    if (context.deleteShapesOptimistic) {
      context.deleteShapesOptimistic(shapeIdsToDelete);
    }
    
    // Step 2: Background sync - Single batch delete
    setTimeout(async () => {
      try {
        await context.deleteShapesBatch(shapeIdsToDelete);
      } catch (error) {
        console.error('Failed to delete shapes:', error);
      }
    }, 0);
    
    // For immediate response, assume all will be deleted
    const actuallyDeleted = unlockedShapes;
    const actuallySkipped = lockedShapes;
    
    // Check if nothing was actually deleted
    if (actuallyDeleted.length === 0) {
      return {
        success: false,
        error: `Could not delete any shapes: All ${shapesToDelete.length} matching shape${shapesToDelete.length !== 1 ? 's are' : ' is'} currently locked by other users`,
      };
    }
    
    // Build descriptive message
    let message;
    const deletedCount = actuallyDeleted.length;
    const skippedCount = actuallySkipped.length;
    
    if (deleteAll) {
      message = `Deleted ${deletedCount} shape${deletedCount !== 1 ? 's' : ''}`;
    } else if (byType) {
      message = `Deleted ${deletedCount} ${byType}${deletedCount !== 1 ? 's' : ''}`;
    } else if (byColor) {
      message = `Deleted ${deletedCount} ${byColor} shape${deletedCount !== 1 ? 's' : ''}`;
    } else if (description) {
      message = `Deleted ${deletedCount} shape${deletedCount !== 1 ? 's' : ''} matching "${description}"`;
    } else if (shapeIds) {
      message = `Deleted ${deletedCount} shape${deletedCount !== 1 ? 's' : ''}`;
    } else {
      message = `Deleted selected shape`;
    }
    
    // Add note about skipped locked shapes
    if (skippedCount > 0) {
      message += `. Skipped ${skippedCount} shape${skippedCount !== 1 ? 's' : ''} being edited by other users.`;
    }
    
    return {
      success: true,
      message,
      deletedCount: actuallyDeleted.length,
      skippedCount: actuallySkipped.length,
      deletedShapeIds: actuallyDeleted.map(s => s.id),
      skippedShapeIds: actuallySkipped.map(s => s.id),
    };
  } catch (error) {
    console.error('Error in executeDeleteShapes:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete shapes',
    };
  }
}

/**
 * Execute arrangeShapes tool
 */
async function executeArrangeShapes(params, context) {
  try {
    const { shapeIds, layout, spacing = 50, startX = 100, startY = 100, gridColumns } = params;
    
    // Validate shapes exist
    const shapes = shapeIds.map(id => context.shapes.find(s => s.id === id)).filter(Boolean);
    
    if (shapes.length === 0) {
      return {
        success: false,
        error: 'No valid shapes found with provided IDs',
      };
    }
    
    let positions;
    
    if (layout === 'horizontal') {
      positions = calculateHorizontalLayout(shapes, spacing, startX, startY);
    } else if (layout === 'vertical') {
      positions = calculateVerticalLayout(shapes, spacing, startX, startY);
    } else if (layout === 'grid') {
      if (!gridColumns) {
        return {
          success: false,
          error: 'gridColumns parameter required for grid layout',
        };
      }
      const rows = Math.ceil(shapes.length / gridColumns);
      const elementWidth = shapes[0]?.width || 100;
      const elementHeight = shapes[0]?.height || 100;
      positions = calculateGridPositions(rows, gridColumns, spacing, startX, startY, elementWidth, elementHeight);
      positions = positions.slice(0, shapes.length).map((pos, i) => ({
        shapeId: shapes[i].id,
        ...pos,
      }));
    }
    
    // Prepare batch updates
    const updates = positions.map(pos => ({
      id: pos.shapeId,
      updates: { x: pos.x, y: pos.y }
    }));
    
    // Step 1: Optimistic UI - Update local state immediately
    if (context.updateShapesOptimistic) {
      context.updateShapesOptimistic(updates);
    }
    
    // Step 2: Background sync - Single batch update
    setTimeout(async () => {
      try {
        await context.updateShapesBatch(updates);
      } catch (error) {
        console.error('Failed to arrange shapes:', error);
      }
    }, 0);
    
    return {
      success: true,
      message: `Arranged ${shapes.length} shapes in ${layout} layout`,
      shapesArranged: shapes.length,
      layout,
    };
  } catch (error) {
    console.error('Error in executeArrangeShapes:', error);
    return {
      success: false,
      error: error.message || 'Failed to arrange shapes',
    };
  }
}

/**
 * Execute getCapabilities tool - Show AI assistant capabilities
 */
function executeGetCapabilities(params, context) {
  try {
    const helpText = `# 🎨 **AI Canvas Assistant - What I Can Do**

I'm your AI assistant for the collaborative canvas! I can help you **create**, **modify**, and **organize shapes** using natural language. Here's everything I can do:

---

## 📦 **Shape Creation**

**Create individual shapes:**
- "Create a **red circle**"
- "Make a **blue rectangle** at position 500, 500"
- "Add a **green triangle**"
- "Create text that says **'Hello World'**"

**Create multiple shapes at once:**
- "Create **50 blue circles**" (instantly creates 50 shapes!)
- "Make **100 red rectangles**"
- "Create **200 green triangles**"

**Create organized grids:**
- "Create a **5×5 grid** of circles" (perfect alignment!)
- "Make a **10×10 grid** of squares"
- "Create a **3×4 grid** of red triangles"

**Supported shapes:** 🟦 Rectangles • 🔵 Circles • 🔺 Triangles • 📝 Text

---

## 🎯 **Move & Position Shapes**

**Move individual shapes:**
- "Move the **blue rectangle** to the **center**"
- "Move the selected shape to position 1000, 500"

**Move multiple shapes:**
- "Move **all circles** to the **top-left corner**"
- "Move **20 rectangles** to the center"

**Named positions available:**
📍 top-left • top-center • top-right
📍 center-left • **center** • center-right  
📍 bottom-left • bottom-center • bottom-right

---

## 🔄 **Transform Shapes**

**Resize shapes:**
- "Make the circle **twice as big**"
- "Resize the rectangle to **400×400**"
- "Make all triangles **smaller**"

**Rotate shapes:**
- "Rotate the rectangle **45 degrees**"
- "Turn the triangle **90 degrees** clockwise"

**Change colors:**
- "Change the triangle to **red**"
- "Make all circles **blue**"
- "Change all rectangles to **green**"

---

## 🗑️ **Delete Shapes**

**Delete by selection:**
- "Delete the **selected shape**"

**Delete by type:**
- "Delete **all rectangles**"
- "Remove **all triangles**"

**Delete by color:**
- "Delete **all blue shapes**"
- "Remove **all red circles**"

**Delete by combination:**
- "Delete **all blue rectangles**"
- "Remove **all small red circles**"

---

## 📐 **Arrange & Organize**

**Arrange in layouts:**
- "Arrange these shapes in a **horizontal row**"
- "Arrange in a **vertical column**"
- "Create a **3×3 grid** with these shapes"
- "**Space these elements evenly**"

---

## 🔍 **Query & Information**

**Find shapes:**
- "Show me **all blue circles**"
- "Find **all rectangles**"

**Get canvas info:**
- "What's on the canvas?"
- "How many shapes are there?"

**Select shapes:**
- "Select **all rectangles**"
- "Select the **large blue circle**"

---

## 🎨 **Complex Layouts** (Advanced)

- "Create a **login form**" (username + password fields)
- "Build a **navigation bar** with 4 menu items"
- "Make a **card layout** with title and description"

---

## ⚡ **Quick Start Examples**

Try these commands right now:

1️⃣ **"Create a 5×5 grid of blue circles"**  
2️⃣ **"Create 50 red rectangles"**  
3️⃣ **"Move all triangles to the center"**  
4️⃣ **"Delete all blue shapes"**  
5️⃣ **"Arrange these in a horizontal row"**  
6️⃣ **"Change the rectangle to green"**  
7️⃣ **"Create a red triangle"**

---

## 🚀 **Special Features**

✨ **Instant results** - Shapes appear immediately (0ms!)  
🎯 **Bulk operations** - Create/move/delete up to 500 shapes at once  
👥 **Collaborative** - Respects shapes being edited by others  
📍 **Smart positioning** - Places shapes in your current viewport  
⚡ **Optimized performance** - 100× faster than traditional methods

---

## 💡 **Pro Tips**

💬 **Just use natural language!** No need to memorize commands  
🎨 **Be specific** - "blue circle" works better than just "circle"  
🔢 **Go big** - Create grids of 100+ shapes instantly!  
🔄 **Experiment** - Try different combinations and see what works

---

**Ready to start?** Just tell me what you want to create! 🚀`;


    return {
      success: true,
      message: helpText,
      capabilities: {
        creation: ['single', 'bulk', 'grid'],
        movement: ['single', 'multiple', 'named-positions'],
        transformation: ['resize', 'rotate', 'color-change'],
        deletion: ['selected', 'by-type', 'by-color', 'combined'],
        arrangement: ['grid', 'horizontal', 'vertical', 'spacing'],
        query: ['find', 'select', 'canvas-state'],
        shapes: ['rectangle', 'circle', 'triangle', 'text'],
      },
    };
  } catch (error) {
    console.error('Error in executeGetCapabilities:', error);
    return {
      success: false,
      error: error.message || 'Failed to get capabilities',
    };
  }
}

/**
 * Execute getCanvasState tool
 */
function executeGetCanvasState(params, context) {
  try {
    const state = serializeCanvasState(context.shapes, context.selectedId);
    
    return {
      success: true,
      ...state,
      message: `Canvas has ${state.totalShapes} shapes`,
    };
  } catch (error) {
    console.error('Error in executeGetCanvasState:', error);
    return {
      success: false,
      error: error.message || 'Failed to get canvas state',
    };
  }
}

/**
 * Execute getSelectedShapes tool
 */
function executeGetSelectedShapes(params, context) {
  try {
    if (!context.selectedId) {
      return {
        success: true,
        shapes: [],
        message: 'No shapes currently selected',
      };
    }
    
    const selected = context.shapes.find(s => s.id === context.selectedId);
    if (!selected) {
      return {
        success: true,
        shapes: [],
        message: 'Selected shape not found',
      };
    }
    
    return {
      success: true,
      shapes: [{
        id: selected.id,
        type: selected.type,
        description: generateShapeDescription(selected),
      }],
      message: `Selected: ${generateShapeDescription(selected)}`,
    };
  } catch (error) {
    console.error('Error in executeGetSelectedShapes:', error);
    return {
      success: false,
      error: error.message || 'Failed to get selected shapes',
    };
  }
}

/**
 * Execute selectShapesByDescription tool
 */
function executeSelectShapesByDescription(params, context) {
  try {
    const { description } = params;
    
    const matches = findShapesByDescription(context.shapes, description, context.selectedId);
    
    if (matches.length === 0) {
      return {
        success: true,
        shapes: [],
        count: 0,
        message: `No shapes found matching "${description}"`,
      };
    }
    
    if (matches.length === 1) {
      return {
        success: true,
        shapes: matches.map(s => ({
          id: s.id,
          type: s.type,
          description: generateShapeDescription(s),
        })),
        count: 1,
        message: `Found 1 shape: ${generateShapeDescription(matches[0])}`,
      };
    }
    
    // Multiple matches - ask for clarification
    return {
      success: true,
      shapes: matches.map(s => ({
        id: s.id,
        type: s.type,
        description: generateShapeDescription(s),
      })),
      count: matches.length,
      message: `Found ${matches.length} shapes matching "${description}". Please be more specific or select one: ${matches.map(s => generateShapeDescription(s)).join(', ')}`,
      needsClarification: true,
    };
  } catch (error) {
    console.error('Error in executeSelectShapesByDescription:', error);
    return {
      success: false,
      error: error.message || 'Failed to find shapes',
    };
  }
}

/**
 * Execute createComplexLayout tool - Create pre-designed layouts with instant rendering
 */
async function executeCreateComplexLayout(params, context) {
  try {
    const { layoutType, config = {} } = params;
    
    // Calculate starting position (centered in viewport if available)
    let startX = 1000;
    let startY = 1000;
    
    if (context.viewport) {
      const { position, scale, width: vpWidth, height: vpHeight } = context.viewport;
      startX = (-position.x + vpWidth / 2) / scale - 125; // Center with offset
      startY = (-position.y + vpHeight / 2) / scale - 150;
    }
    
    let allShapesData = [];
    let layoutDescription = '';
    
    if (layoutType === 'loginForm') {
      // Build complete shape objects for optimized login form (3x original / 2x previous)
      const timestamp = Date.now();
      
      // Form dimensions (3x original = 2x larger than previous)
      const formWidth = 750;
      const inputHeight = 120;
      const buttonHeight = 136;
      const padding = 60;
      
      allShapesData = [
        // White background for entire form
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_bg`,
          type: 'rectangle',
          x: startX - padding,
          y: startY - padding,
          width: formWidth + (padding * 2),
          height: 1006, // Calculated to fit all elements with padding (2x)
          fill: '#FFFFFF',
          stroke: '#E0E0E0',
          strokeWidth: 2,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Title: "Login" (centered)
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_0`,
          type: 'text',
          x: startX + 280, // Centered: 750/2 - ~95 (half of "Login" width at 96px)
          y: startY,
          text: 'Login',
          fontSize: 96,
          fontFamily: 'Arial',
          fontStyle: 'bold',
          fill: '#000000',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Username label
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_1`,
          type: 'text',
          x: startX,
          y: startY + 180,
          text: 'Username:',
          fontSize: 54,
          fontFamily: 'Arial',
          fill: '#000000',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Username input field background (white rectangle)
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_2a`,
          type: 'rectangle',
          x: startX,
          y: startY + 270,
          width: formWidth,
          height: inputHeight,
          fill: '#FFFFFF',
          stroke: '#CCCCCC',
          strokeWidth: 4,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Username input field (editable text)
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_2b`,
          type: 'text',
          x: startX + 20,
          y: startY + 300,
          text: '',
          fontSize: 48,
          fontFamily: 'Arial',
          fill: '#333333',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
          placeholder: 'Enter username',
        },
        // Password label
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_3`,
          type: 'text',
          x: startX,
          y: startY + 450,
          text: 'Password:',
          fontSize: 54,
          fontFamily: 'Arial',
          fill: '#000000',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Password input field background (white rectangle)
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_4a`,
          type: 'rectangle',
          x: startX,
          y: startY + 540,
          width: formWidth,
          height: inputHeight,
          fill: '#FFFFFF',
          stroke: '#CCCCCC',
          strokeWidth: 4,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Password input field (editable text)
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_4b`,
          type: 'text',
          x: startX + 20,
          y: startY + 570,
          text: '',
          fontSize: 48,
          fontFamily: 'Arial',
          fill: '#333333',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
          placeholder: 'Enter password',
        },
        // Submit button (blue rectangle)
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_5`,
          type: 'rectangle',
          x: startX,
          y: startY + 750,
          width: formWidth,
          height: buttonHeight,
          fill: '#0066FF',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Submit button text (bold, white, centered)
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_6`,
          type: 'text',
          x: startX + 300, // Centered: 750/2 - ~75 (half of "Submit" width at 54px bold)
          y: startY + 794, // Vertically centered in button
          text: 'Submit',
          fontSize: 54,
          fontFamily: 'Arial',
          fontStyle: 'bold',
          fill: '#FFFFFF',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
      ];
      
      layoutDescription = 'optimized login form with username and password fields';
    }
    else if (layoutType === 'navigationBar') {
      const menuItems = config.menuItems || ['Home', 'About', 'Services', 'Contact'];
      const timestamp = Date.now();
      
      // Navbar dimensions (4× bigger with professional design)
      const navWidth = 2400;
      const navHeight = 240;
      const buttonWidth = 360;
      const buttonHeight = 160;
      const buttonSpacing = 40;
      const logoWidth = 200;
      
      allShapesData = [];
      
      // 1. Main navbar background (modern dark gray)
      allShapesData.push({
        id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_bg`,
        type: 'rectangle',
        x: startX,
        y: startY,
        width: navWidth,
        height: navHeight,
        fill: '#1F2937', // Tailwind gray-800
        stroke: '#374151', // Subtle border
        strokeWidth: 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1.0,
        blendMode: 'source-over',
      });
      
      // 2. Logo/Brand area on the left
      allShapesData.push({
        id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_logo_bg`,
        type: 'rectangle',
        x: startX + 40,
        y: startY + 40,
        width: logoWidth,
        height: 160,
        fill: '#3B82F6', // Blue accent
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1.0,
        blendMode: 'source-over',
      });
      
      allShapesData.push({
        id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_logo_text`,
        type: 'text',
        x: startX + 60,
        y: startY + 90,
        text: 'LOGO',
        fontSize: 72,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fill: '#FFFFFF',
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1.0,
        blendMode: 'source-over',
      });
      
      // 3. Menu button items (starting after logo)
      let currentX = startX + logoWidth + 120; // Start after logo with spacing
      
      menuItems.forEach((item, index) => {
        // Button background (looks like a button!)
        allShapesData.push({
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_btn_${index}`,
          type: 'rectangle',
          x: currentX,
          y: startY + 40,
          width: buttonWidth,
          height: buttonHeight,
          fill: index === 0 ? '#3B82F6' : '#374151', // First item (Home) highlighted
          stroke: '#4B5563',
          strokeWidth: 2,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        });
        
        // Button text (centered in button)
        allShapesData.push({
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_text_${index}`,
          type: 'text',
          x: currentX + buttonWidth / 2 - (item.length * 22), // Approximate centering
          y: startY + 90,
          text: item,
          fontSize: 72,
          fontFamily: 'Arial',
          fontStyle: index === 0 ? 'bold' : 'normal', // Bold for active item
          fill: '#FFFFFF',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        });
        
        currentX += buttonWidth + buttonSpacing;
      });
      
      // 4. Add a subtle bottom border/shadow effect
      allShapesData.push({
        id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_shadow`,
        type: 'rectangle',
        x: startX,
        y: startY + navHeight - 8,
        width: navWidth,
        height: 8,
        fill: '#111827', // Darker shadow
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.5,
        blendMode: 'source-over',
      });
      
      layoutDescription = `professional navigation bar with logo and ${menuItems.length} button-style menu items`;
    }
    else if (layoutType === 'cardLayout') {
      const timestamp = Date.now();
      
      allShapesData = [
        // Card container
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_0`,
          type: 'rectangle',
          x: startX,
          y: startY,
          width: 300,
          height: 400,
          fill: '#F5F5F5',
          stroke: '#E0E0E0',
          strokeWidth: 1,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Title
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_1`,
          type: 'text',
          x: startX + 15,
          y: startY + 20,
          text: 'Card Title',
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#000000',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Image placeholder rectangle
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_2`,
          type: 'rectangle',
          x: startX + 10,
          y: startY + 60,
          width: 280,
          height: 200,
          fill: '#CCCCCC',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Image placeholder text
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_3`,
          type: 'text',
          x: startX + 80,
          y: startY + 150,
          text: 'Image Placeholder',
          fontSize: 14,
          fontFamily: 'Arial',
          fill: '#666666',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
        // Description text
        {
          id: `shape_${timestamp}_${Math.random().toString(36).substring(2, 11)}_4`,
          type: 'text',
          x: startX + 15,
          y: startY + 280,
          text: 'Card description goes here',
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#000000',
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1.0,
          blendMode: 'source-over',
        },
      ];
      
      layoutDescription = 'card layout with title, image placeholder, and description';
    }
    else {
      return {
        success: false,
        error: `Unknown layout type: ${layoutType}. Available: loginForm, navigationBar, cardLayout`,
      };
    }
    
    // Step 1: Optimistic UI - Shapes appear instantly!
    if (context.addShapesOptimistic) {
      context.addShapesOptimistic(allShapesData);
    }
    
    // Step 2: Background sync to Firestore
    setTimeout(async () => {
      try {
        await context.addShapesBatch(allShapesData);
      } catch (error) {
        console.error('Failed to sync complex layout:', error);
      }
    }, 0);
    
    return {
      success: true,
      message: `Created ${layoutDescription} with ${allShapesData.length} elements`,
      shapesCreated: allShapesData.length,
      layoutType,
      immediate: true,
    };
  } catch (error) {
    console.error('Error in executeCreateComplexLayout:', error);
    return {
      success: false,
      error: error.message || 'Failed to create complex layout',
    };
  }
}

// ============================================================================
// TOOL ROUTER
// ============================================================================

/**
 * Execute a tool call by name
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} params - Tool parameters
 * @param {Object} context - Canvas context with shapes and methods
 * @returns {Promise<Object>} Execution result
 */
export async function executeTool(toolName, params, context) {
  try {
    let result;
    
    switch (toolName) {
      case 'createShape':
        result = await executeCreateShape(params, context);
        break;
      
      case 'createMultipleShapes':
        result = await executeCreateMultipleShapes(params, context);
        break;
      
      case 'createGrid':
        result = await executeCreateGrid(params, context);
        break;
      
      case 'moveShape':
        result = await executeMoveShape(params, context);
        break;
      
      case 'moveMultipleShapes':
        result = await executeMoveMultipleShapes(params, context);
        break;
      
      case 'resizeShape':
        result = await executeResizeShape(params, context);
        break;
      
      case 'rotateShape':
        result = await executeRotateShape(params, context);
        break;
      
      case 'changeShapeColor':
        result = await executeChangeShapeColor(params, context);
        break;
      
      case 'deleteShapes':
        result = await executeDeleteShapes(params, context);
        break;
      
      case 'arrangeShapes':
        result = await executeArrangeShapes(params, context);
        break;
      
      case 'getCapabilities':
        result = executeGetCapabilities(params, context);
        break;
      
      case 'getCanvasState':
        result = executeGetCanvasState(params, context);
        break;
      
      case 'getSelectedShapes':
        result = executeGetSelectedShapes(params, context);
        break;
      
      case 'selectShapesByDescription':
        result = executeSelectShapesByDescription(params, context);
        break;
      
      case 'createComplexLayout':
        result = await executeCreateComplexLayout(params, context);
        break;
      
      default:
        result = {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
    
    return result;
  } catch (error) {
    console.error(`Tool ${toolName} failed:`, error);
    return {
      success: false,
      error: error.message || 'Tool execution failed',
    };
  }
}

// Export all functions
export default {
  getToolSchemas,
  executeTool,
};

