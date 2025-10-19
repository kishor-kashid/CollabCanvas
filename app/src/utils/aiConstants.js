// AI Canvas Agent Constants

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

// OpenAI Configuration
export const OPENAI_CONFIG = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 1000,
};

// Rate Limiting
export const RATE_LIMIT = {
  maxCommandsPerMinute: 10,
  quotaResetTime: 60000, // 60 seconds in milliseconds
};

// Response Timing
export const TIMING = {
  simpleCommandTarget: 2000, // 2 seconds for simple commands
  complexCommandTarget: 5000, // 5 seconds for complex commands
  streamingDelay: 20, // Delay between word chunks in ms
  typingIndicatorDelay: 300, // Delay before showing typing indicator
};

// UI Configuration
export const UI_CONFIG = {
  chatButton: {
    size: 72, // pixels (1.2x original 60px)
    bottomOffset: 24, // pixels from bottom
    rightOffset: 24, // pixels from right
    icon: '🤖', // Robot emoji (can be replaced with SVG)
    tooltip: 'Build with AI',
  },
  chatWindow: {
    width: 462, // pixels (1.1x original 420px)
    heightVh: 56.25, // % of viewport height (2.25x original 25vh)
    bottomOffset: 102, // pixels from bottom (button size 72px + spacing 30px)
    rightOffset: 24, // pixels from right
    borderRadius: 12, // pixels
    maxMessages: 100, // Maximum messages to keep in memory
  },
  messages: {
    maxLength: 500, // Maximum characters per message
    timestampFormat: 'short', // 'short' or 'long'
  },
};

// System Prompts
export const SYSTEM_PROMPTS = {
  main: `You are an AI assistant that helps users create and manipulate shapes on a collaborative canvas.

Canvas Details:
- Size: ${CANVAS_WIDTH}x${CANVAS_HEIGHT} pixels
- Available shapes: rectangles, circles, and text
- X coordinates must be within 0-${CANVAS_WIDTH} range
- Y coordinates must be within 0-${CANVAS_HEIGHT} range
- Colors can be specified as names (red, blue, etc.) or hex codes (#FF0000)

Your Capabilities:
1. Create shapes (rectangles, circles, triangles, text) - they appear where the user is looking unless coordinates are specified
2. Create multiple shapes at once (1-500 shapes) - for bulk creation with instant feedback
3. Move single or multiple shapes (up to 50) to any position
4. Resize shapes by scale factor or absolute dimensions
5. Rotate shapes by degrees
6. Change shape colors
7. Delete shapes (selected, by type, by color, or by description)
8. Arrange multiple shapes (horizontal, vertical, grid layouts)
9. Create complex layouts (login forms, navigation bars, etc.)

Guidelines:
- **IMPORTANT: Target shape handling:**
  * If the command includes "[Target shape ID: ...]", this is a shape-specific command
  * Use the provided shape ID directly in tools like moveShape, resizeShape, changeShapeColor, rotateShape, deleteShapes
  * Commands like "make this bigger" or "change color to blue" refer to the target shape
  * Do NOT call getCanvasState first - the shape ID is already provided
- **IMPORTANT: Delete with combined criteria:**
  * For "delete all red circles" → use deleteShapes with BOTH byType="circle" AND byColor="red"
  * For "delete all blue rectangles" → use deleteShapes with BOTH byType="rectangle" AND byColor="blue"
  * For "delete all circles" → use deleteShapes with ONLY byType="circle"
  * For "delete all red shapes" → use deleteShapes with ONLY byColor="red"
  * ALWAYS combine byType and byColor when BOTH are specified in the command
- **IMPORTANT: "here" keyword handling:**
  * When users say "create X here" or "make X here" in an AI TASK, "here" means the exact position where the AI task pin was placed
  * When users say "create X here" in regular CHAT (no task pin), "here" means their current viewport center
  * Always OMIT x and y parameters when "here" is mentioned - the system will automatically use the correct position
  * Examples: "create a circle here" → createShape with NO x/y | "create login form here" → createComplexLayout with NO startX/startY
- When creating shapes, OMIT x/y coordinates unless the user explicitly specifies numeric positions (e.g., "at 100, 200" or "at position 500, 300")
- Shapes without coordinates will appear at the appropriate location (task pin position > viewport center > default)
- Always be specific about what you're doing
- If a command is ambiguous (e.g., multiple blue rectangles), ask for clarification
- For complex commands (login forms, navbars), execute them directly without asking for confirmation
- Use the tools provided to execute canvas operations
- When deleting shapes, locked shapes (being edited by other users) will be automatically skipped
- Be helpful and conversational

Remember: All your actions will be visible to all users in real-time. Shapes being edited by other users are protected from deletion.`,

  complexCommandPrompt: `This is a complex command that requires multiple steps. Please:
1. Analyze the request
2. Create a clear step-by-step plan
3. Present the plan to the user for confirmation
4. Wait for user approval before executing`,
};

// Example Commands (for UI suggestions)
export const EXAMPLE_COMMANDS = [
  {
    category: 'Creation',
    examples: [
      'Create a red circle',
      'Make a 150x200 blue rectangle',
      'Create a green triangle',
      'Create 5 red circles',
      'Create 50 blue rectangles',
      'Create a 5x5 grid of circles',
      'Make a 3x3 grid of squares',
      'Add text that says "Welcome"',
    ],
  },
  {
    category: 'Manipulation',
    examples: [
      'Move the blue rectangle to the center',
      'Move all circles to the top-left corner',
      'Make the circle twice as big',
      'Rotate the selected shape 45 degrees',
      'Change all triangles to red',
    ],
  },
  {
    category: 'Deletion',
    examples: [
      'Delete the selected shape',
      'Delete all rectangles',
      'Delete all triangles',
      'Delete all blue shapes',
      'Remove the small circles',
    ],
  },
  {
    category: 'Layout',
    examples: [
      'Arrange these shapes in a horizontal row',
      'Create a 3x3 grid of squares',
      'Space the selected elements evenly',
    ],
  },
  {
    category: 'Complex',
    examples: [
      'Create a login form with username and password fields',
      'Build a navigation bar with Home, About, Services, Contact',
      'Make a card layout with title and description',
    ],
  },
];

// Error Messages
export const ERROR_MESSAGES = {
  apiKeyMissing: 'OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.',
  apiError: 'AI is temporarily unavailable. Please try again in a moment.',
  networkError: 'Connection lost. Please check your internet connection and try again.',
  rateLimitHit: 'You\'ve reached the command limit. Please wait {seconds} seconds before trying again.',
  invalidCommand: 'I couldn\'t understand that command. Try something like: "Create a red circle"',
  noShapesFound: 'I couldn\'t find any shapes matching that description.',
  multipleShapesFound: 'I found multiple shapes matching that description. Please be more specific or select the shape you want to modify.',
  executionError: 'I encountered an error while executing that command. Please try again.',
  streamingError: 'There was an error processing your request. The response may be incomplete.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  shapeCreated: 'Shape created successfully!',
  shapeMoved: 'Shape moved successfully!',
  shapeResized: 'Shape resized successfully!',
  shapeRotated: 'Shape rotated successfully!',
  shapeColorChanged: 'Shape color changed successfully!',
  shapesArranged: 'Shapes arranged successfully!',
  historyCleared: 'Chat history cleared successfully!',
};

// Function Call Status Messages
export const FUNCTION_STATUS = {
  executing: '⏳ Executing...',
  success: '✅ Done',
  error: '❌ Failed',
};

// Color Mappings (for natural language color parsing)
export const COLOR_MAP = {
  red: '#FF0000',
  blue: '#0000FF',
  green: '#00FF00',
  yellow: '#FFFF00',
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  brown: '#A52A2A',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#808080',
  grey: '#808080',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  lime: '#00FF00',
  navy: '#000080',
  teal: '#008080',
  olive: '#808000',
  maroon: '#800000',
};

// Complex Command Detection
export const COMPLEX_COMMAND_KEYWORDS = [
  'form', 'login', 'signup', 'register',
  'navigation', 'navbar', 'nav bar', 'menu',
  'layout', 'dashboard', 'card',
  'multiple', 'several', 'many',
  'grid of', 'row of', 'column of',
  'create a complete', 'build a',
  'design a', 'make a full',
];

// Complex Layout Templates
export const LAYOUT_TEMPLATES = {
  loginForm: {
    description: 'Login form with username, password fields, and submit button',
    elements: [
      { type: 'text', content: 'Login', role: 'title' },
      { type: 'text', content: 'Username:', role: 'label' },
      { type: 'rectangle', role: 'input', width: 200, height: 40 },
      { type: 'text', content: 'Password:', role: 'label' },
      { type: 'rectangle', role: 'input', width: 200, height: 40 },
      { type: 'rectangle', role: 'button', width: 200, height: 40 },
      { type: 'text', content: 'Submit', role: 'button-text' },
    ],
    spacing: { vertical: 20, horizontal: 10 },
  },
  navigationBar: {
    description: 'Navigation bar with menu items',
    elements: 'dynamic', // Created based on menu items provided
    spacing: { horizontal: 40 },
  },
  cardLayout: {
    description: 'Card with title, image placeholder, and description',
    elements: [
      { type: 'rectangle', role: 'container', width: 300, height: 400 },
      { type: 'text', content: 'Card Title', role: 'title' },
      { type: 'rectangle', role: 'image', width: 280, height: 200 },
      { type: 'text', content: 'Card description goes here', role: 'description' },
    ],
    spacing: { vertical: 15, padding: 10 },
  },
};

// Validation Rules
export const VALIDATION = {
  position: {
    min: 0,
    max: Math.max(CANVAS_WIDTH, CANVAS_HEIGHT), // Use the larger dimension
  },
  dimensions: {
    minWidth: 10,
    maxWidth: 2000,
    minHeight: 10,
    maxHeight: 2000,
    minRadius: 5,
    maxRadius: 1000,
  },
  rotation: {
    min: -360,
    max: 360,
  },
  scale: {
    min: 0.1,
    max: 10,
  },
  text: {
    maxLength: 500,
    minFontSize: 8,
    maxFontSize: 200,
  },
};

