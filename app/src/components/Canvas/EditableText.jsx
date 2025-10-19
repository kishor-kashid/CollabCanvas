// EditableText Component - Text shape with double-click to edit

import { Text } from 'react-konva';
import { useState, forwardRef, memo } from 'react';
import { checkEditPermissions, checkLockAcquisition } from '../../utils/editPermissions';

const EditableTextComponent = forwardRef(function EditableText({
  id,
  x,
  y,
  width,
  height,
  text,
  fontSize,
  fontFamily,
  fontStyle,
  fill,
  rotation,
  scaleX,
  scaleY,
  isSelected,
  isLocked,
  isLayerLocked, // Layer-level lock (prevents all editing)
  lockedBy,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  onTextChange,
  onLock,
  onUnlock,
  commonProps,
}, textRef) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDoubleClick = async (e) => {
    // Prevent this from triggering selection
    e.cancelBubble = true;
    
    // Check edit permissions
    const permCheck = checkEditPermissions(isLayerLocked, isLocked);
    if (!permCheck.canEdit) {
      alert(permCheck.message);
      return;
    }
    
    if (isEditing) {
      return;
    }

    const textNode = textRef?.current;
    if (!textNode) return;

    const stage = textNode.getStage();
    if (!stage) return;

    // Acquire lock before editing
    if (onLock) {
      const lockAcquired = await onLock();
      const lockCheck = checkLockAcquisition(lockAcquired, 'text');
      if (!lockCheck.success) {
        alert(lockCheck.message);
        return;
      }
    }

    // Set editing state
    setIsEditing(true);
    
    // Set up lock refresh interval to keep lock alive during long editing sessions
    const lockRefreshInterval = setInterval(async () => {
      if (onLock) {
        await onLock(); // Re-acquire lock to refresh timestamp
      }
    }, 3000); // Refresh every 3 seconds (before 5-second timeout)

    // Hide text while editing
    textNode.hide();
    stage.batchDraw();

    // Get the exact position and size of the text node
    const textPosition = textNode.getClientRect();
    
    // Get stage scale to adjust textarea size
    const stageScale = stage.scaleX();
    
    // Calculate proper dimensions with minimum width
    const minWidth = 300; // Minimum width to see multiple words
    const minHeight = 100; // Minimum height for comfortable editing
    const actualWidth = Math.max(textPosition.width, minWidth);
    const actualHeight = Math.max(textPosition.height, minHeight);
    
    // Adjust font size based on stage scale for readability
    const adjustedFontSize = Math.max(14, fontSize * stageScale);
    
    // Create textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text || '';
    
    // Apply styles to match text box exactly
    const currentFontStyle = fontStyle || 'normal';
    Object.assign(textarea.style, {
      position: 'fixed',
      top: textPosition.y + 'px',
      left: textPosition.x + 'px',
      width: actualWidth + 'px',
      height: actualHeight + 'px',
      fontSize: adjustedFontSize + 'px',
      fontFamily: fontFamily,
      fontWeight: currentFontStyle.includes('bold') ? 'bold' : 'normal',
      fontStyle: currentFontStyle.includes('italic') ? 'italic' : 'normal',
      color: fill,
      padding: '10px',
      margin: '0',
      border: '2px solid #2196F3',
      borderRadius: '4px',
      outline: 'none',
      resize: 'both',
      backgroundColor: 'white',
      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
      zIndex: '999999',
      lineHeight: '1.5',
      overflow: 'auto',
      transformOrigin: 'top left',
      boxSizing: 'border-box',
    });

    if (rotation) {
      textarea.style.transform = `rotate(${rotation}deg)`;
    }

    // Add to DOM
    document.body.appendChild(textarea);

    // Focus and select
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.select();
    });

    // Handle save
    async function finishEditing() {
      // Clear the lock refresh interval
      clearInterval(lockRefreshInterval);
      
      const newText = textarea.value.trim();
      
      // Wait for the update to complete before showing the text
      if (newText && newText !== text) {
        await onTextChange(newText);
      } else if (!newText) {
        // If empty, keep original text
        await onTextChange(text || 'Double-click to edit');
      }
      
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
      
      // Show text again
      textNode.show();
      stage.batchDraw();
      
      setIsEditing(false);
      
      // Release lock after editing
      if (onUnlock) {
        await onUnlock();
      }
    }

    // Keyboard events
    const handleKeyDown = async (e) => {
      // Stop propagation to prevent canvas shortcuts
      e.stopPropagation();
      
      if (e.key === 'Escape') {
        // Clear the lock refresh interval
        clearInterval(lockRefreshInterval);
        
        // Cancel without saving
        if (textarea.parentNode) {
          textarea.parentNode.removeChild(textarea);
        }
        textNode.show();
        stage.batchDraw();
        setIsEditing(false);
        
        // Release lock on escape
        if (onUnlock) {
          await onUnlock();
        }
      } else if (e.key === 'Enter' && e.ctrlKey) {
        // Save with Ctrl+Enter
        await finishEditing();
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('blur', finishEditing);
  };

  return (
    <Text
      ref={textRef}
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      text={text || 'Double-click to edit'}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontStyle={fontStyle || 'normal'}
      fill={fill}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      padding={10}
      align="left"
      verticalAlign="top"
      wrap="word"
      // Show red border when locked by another user, blue when selected
      stroke={isLocked ? '#ef4444' : (isSelected ? '#2196F3' : commonProps?.stroke)}
      strokeWidth={isLocked ? 3 : (isSelected ? 2 : commonProps?.strokeWidth || 0)}
      shadowColor={commonProps?.shadowColor}
      shadowBlur={commonProps?.shadowBlur}
      shadowOpacity={commonProps?.shadowOpacity}
      opacity={isLocked ? 0.7 : commonProps?.opacity}
      draggable={!isLocked && !isEditing}
      listening={!isEditing}
      // Event handlers
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformStart={onTransformStart}
      onTransformEnd={onTransformEnd}
    />
  );
});

// Memoize to prevent unnecessary re-renders
const EditableText = memo(EditableTextComponent, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.text === nextProps.text &&
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.fontFamily === nextProps.fontFamily &&
    prevProps.fontStyle === nextProps.fontStyle &&
    prevProps.fill === nextProps.fill &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.scaleX === nextProps.scaleX &&
    prevProps.scaleY === nextProps.scaleY &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isLocked === nextProps.isLocked &&
    prevProps.isLayerLocked === nextProps.isLayerLocked &&
    prevProps.lockedBy === nextProps.lockedBy
  );
});

export default EditableText;

