// editPermissions.js - Helper functions for edit permission checking

/**
 * Check if a user can edit a shape based on layer lock and user lock status
 * @param {boolean} isLayerLocked - Whether the layer is locked
 * @param {boolean} isLocked - Whether the shape is locked by another user
 * @returns {Object} { canEdit: boolean, message: string }
 */
export function checkEditPermissions(isLayerLocked, isLocked) {
  if (isLayerLocked) {
    return {
      canEdit: false,
      message: 'This layer is locked. Unlock it in the Layers panel to edit.',
    };
  }
  
  if (isLocked) {
    return {
      canEdit: false,
      message: 'This shape is currently being edited by another user. Please wait until they finish.',
    };
  }
  
  return {
    canEdit: true,
    message: '',
  };
}

/**
 * Check if lock acquisition was successful and return appropriate error message
 * @param {boolean} lockAcquired - Whether the lock was successfully acquired
 * @param {string} resourceType - Type of resource being edited ('shape', 'text', 'color', etc.)
 * @returns {Object} { success: boolean, message: string }
 */
export function checkLockAcquisition(lockAcquired, resourceType = 'shape') {
  if (!lockAcquired) {
    return {
      success: false,
      message: `Unable to edit this ${resourceType} right now. Please try again.`,
    };
  }
  
  return {
    success: true,
    message: '',
  };
}

