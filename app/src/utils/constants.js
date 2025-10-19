// Constants - Configuration values for the application

// Canvas dimensions (5000x5000px bounded space)
export const CANVAS_WIDTH = 40000;
export const CANVAS_HEIGHT = 20000;

// Viewport dimensions (visible area)
export const VIEWPORT_WIDTH = window.innerWidth;
export const VIEWPORT_HEIGHT = window.innerHeight;

// Zoom constraints
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;

// Shape types
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  TEXT: 'text',
};

// Shape defaults (3x larger for better visibility)
export const DEFAULT_SHAPE_WIDTH = 300;
export const DEFAULT_SHAPE_HEIGHT = 300;
export const DEFAULT_CIRCLE_RADIUS = 150;
export const DEFAULT_SHAPE_FILL = '#cccccc'; // Gray fill for rectangles/circles
export const DEFAULT_TRIANGLE_WIDTH = 300;
export const DEFAULT_TRIANGLE_HEIGHT = 300;

// Text box specific defaults (4x larger than shapes)
export const DEFAULT_TEXT_WIDTH = 1200;
export const DEFAULT_TEXT_HEIGHT = 600;
export const DEFAULT_TEXT_CONTENT = 'Double-click to edit';
export const DEFAULT_TEXT_SIZE = 200;
export const DEFAULT_TEXT_COLOR = '#000000';
export const DEFAULT_TEXT_FONT_FAMILY = 'Arial';

// Performance settings
export const TARGET_FPS = 60;
export const CURSOR_UPDATE_FPS = 30; // Throttled for network efficiency
export const CURSOR_UPDATE_INTERVAL = 1000 / CURSOR_UPDATE_FPS; // ~33ms

// Lock timeout (auto-release after 3-5 seconds of inactivity)
export const LOCK_TIMEOUT_MS = 5000;

// User display name max length
export const MAX_DISPLAY_NAME_LENGTH = 20;

// Cursor colors palette (8-10 distinct colors with good contrast)
export const CURSOR_COLORS = [
  '#FF5733', // Red-Orange
  '#33C1FF', // Sky Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#A855F7', // Violet
];

// Firebase collections/paths
export const CANVAS_COLLECTION = 'canvas';
export const SHARED_CANVAS_ID = 'shared-canvas'; // Special shared canvas for everyone
export const CANVASES_COLLECTION = 'canvases'; // Canvas metadata collection
export const USER_CANVASES_COLLECTION = 'userCanvases'; // User's canvas index
export const SHARE_CODES_COLLECTION = 'shareCodes'; // Share code mapping

// Helper to get session path for a canvas
export const getSessionPath = (canvasId) => `sessions/${canvasId}`;

// Deprecated - for migration only
export const LEGACY_CANVAS_ID = 'global-canvas-v1';
export const LEGACY_SESSION_PATH = 'sessions/global-canvas-v1';

// Performance thresholds
export const MAX_SHAPES = 500; // Max shapes for MVP performance target
export const LATENCY_TARGET_SHAPES = 100; // Target <100ms for shape updates
export const LATENCY_TARGET_CURSORS = 50; // Target <50ms for cursor updates

