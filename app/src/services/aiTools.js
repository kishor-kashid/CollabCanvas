// AI Tools - Tool definitions and execution for OpenAI function calling

import { SHAPE_TYPES } from '../utils/constants';
import { LAYOUT_TEMPLATES } from '../utils/aiConstants';
import {
  parseColor,
  calculateCenter,
  parsePosition,
  findShapesByDescription,
  getLargestShape,
  getSmallestShape,
  validatePosition,
  validateDimensions,
  calculateGridPositions,
  calculateHorizontalLayout,
  calculateVerticalLayout,
  parseNumericValue,
  generateShapeDescription,
  serializeCanvasState,
} from './aiHelpers';

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
        description: 'Create a new shape on the canvas (rectangle, circle, or text). Use this when the user asks to create, add, or make a new shape.',
        parameters: {
          type: 'object',
          properties: {
            shapeType: {
              type: 'string',
              enum: ['rectangle', 'circle', 'text'],
              description: 'The type of shape to create',
            },
            x: {
              type: 'number',
              description: 'X coordinate position on the canvas (0-5000). Use special values like "center" for positioning.',
            },
            y: {
              type: 'number',
              description: 'Y coordinate position on the canvas (0-5000)',
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
          required: ['shapeType', 'x', 'y'],
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

    // Tool 6: Arrange Shapes
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

    // Tool 9: Select Shapes By Description
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
    const position = validatePosition(x, y);
    
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
    
    // Update all shapes
    for (const pos of positions) {
      await context.updateShape(pos.shapeId, { x: pos.x, y: pos.y });
    }
    
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
 * Execute createComplexLayout tool
 */
async function executeCreateComplexLayout(params, context) {
  try {
    const { layoutType, config = {}, startX = 200, startY = 200 } = params;
    
    const createdShapes = [];
    
    if (layoutType === 'loginForm') {
      // Create login form
      const elements = [
        { type: 'text', text: 'Login', x: startX, y: startY, fontSize: 32 },
        { type: 'text', text: 'Username:', x: startX, y: startY + 60, fontSize: 18 },
        { type: 'rectangle', x: startX, y: startY + 90, width: 250, height: 40, fill: '#FFFFFF' },
        { type: 'text', text: 'Password:', x: startX, y: startY + 150, fontSize: 18 },
        { type: 'rectangle', x: startX, y: startY + 180, width: 250, height: 40, fill: '#FFFFFF' },
        { type: 'rectangle', x: startX, y: startY + 250, width: 250, height: 45, fill: '#0066FF' },
        { type: 'text', text: 'Submit', x: startX + 95, y: startY + 263, fontSize: 18, fill: '#FFFFFF' },
      ];
      
      for (const el of elements) {
        await context.addShape(el.type, { x: el.x, y: el.y });
        createdShapes.push(el);
      }
      
      return {
        success: true,
        message: 'Created login form with username, password fields, and submit button',
        shapesCreated: elements.length,
        layoutType,
      };
    }
    
    if (layoutType === 'navigationBar') {
      const menuItems = config.menuItems || ['Home', 'About', 'Services', 'Contact'];
      
      // Background bar
      await context.addShape('rectangle', { x: startX, y: startY });
      
      // Menu items
      let currentX = startX + 20;
      for (const item of menuItems) {
        await context.addShape('text', { x: currentX, y: startY + 20 });
        currentX += 120;
        createdShapes.push({ type: 'text', text: item });
      }
      
      return {
        success: true,
        message: `Created navigation bar with ${menuItems.length} menu items: ${menuItems.join(', ')}`,
        shapesCreated: menuItems.length + 1,
        layoutType,
      };
    }
    
    if (layoutType === 'cardLayout') {
      const elements = [
        { type: 'rectangle', x: startX, y: startY, width: 300, height: 400, fill: '#F5F5F5' },
        { type: 'text', text: 'Card Title', x: startX + 15, y: startY + 20, fontSize: 24 },
        { type: 'rectangle', x: startX + 10, y: startY + 60, width: 280, height: 200, fill: '#CCCCCC' },
        { type: 'text', text: 'Image Placeholder', x: startX + 80, y: startY + 150, fontSize: 14 },
        { type: 'text', text: 'Card description goes here', x: startX + 15, y: startY + 280, fontSize: 16 },
      ];
      
      for (const el of elements) {
        await context.addShape(el.type, { x: el.x, y: el.y });
        createdShapes.push(el);
      }
      
      return {
        success: true,
        message: 'Created card layout with title, image placeholder, and description',
        shapesCreated: elements.length,
        layoutType,
      };
    }
    
    return {
      success: false,
      error: `Unknown layout type: ${layoutType}`,
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
  console.log(`🔧 Executing tool: ${toolName}`, params);
  
  try {
    let result;
    
    switch (toolName) {
      case 'createShape':
        result = await executeCreateShape(params, context);
        break;
      
      case 'moveShape':
        result = await executeMoveShape(params, context);
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
      
      case 'arrangeShapes':
        result = await executeArrangeShapes(params, context);
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
    
    console.log(`✅ Tool ${toolName} completed:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Tool ${toolName} failed:`, error);
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

