// EditableText Component - Text shape with double-click to edit

import { Text } from 'react-konva';
import { useState, forwardRef } from 'react';

const EditableText = forwardRef(function EditableText({
  id,
  x,
  y,
  width,
  height,
  text,
  fontSize,
  fontFamily,
  fill,
  rotation,
  scaleX,
  scaleY,
  isSelected,
  isLocked,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  onTextChange,
  commonProps,
}, textRef) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDoubleClick = (e) => {
    // Prevent this from triggering selection
    e.cancelBubble = true;
    
    if (isLocked || isEditing) {
      return;
    }

    const textNode = textRef?.current;
    if (!textNode) return;

    const stage = textNode.getStage();
    if (!stage) return;

    // Set editing state
    setIsEditing(true);

    // Hide text while editing
    textNode.hide();
    stage.batchDraw();

    // Get the exact position and size of the text node
    const textPosition = textNode.getClientRect();
    
    // Create textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text || '';
    
    // Apply styles to match text box exactly
    Object.assign(textarea.style, {
      position: 'fixed',
      top: textPosition.y + 'px',
      left: textPosition.x + 'px',
      width: textPosition.width + 'px',
      height: textPosition.height + 'px',
      fontSize: fontSize + 'px',
      fontFamily: fontFamily,
      color: fill,
      padding: '10px',
      margin: '0',
      border: '2px solid #2196F3',
      borderRadius: '4px',
      outline: 'none',
      resize: 'none',
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
    function finishEditing() {
      const newText = textarea.value.trim();
      
      if (newText && newText !== text) {
        onTextChange(newText);
      } else if (!newText) {
        // If empty, keep original text
        onTextChange(text || 'Double-click to edit');
      }
      
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
      
      // Show text again
      textNode.show();
      stage.batchDraw();
      
      setIsEditing(false);
    }

    // Keyboard events
    const handleKeyDown = (e) => {
      // Stop propagation to prevent canvas shortcuts
      e.stopPropagation();
      
      if (e.key === 'Escape') {
        // Cancel without saving
        if (textarea.parentNode) {
          textarea.parentNode.removeChild(textarea);
        }
        textNode.show();
        stage.batchDraw();
        setIsEditing(false);
      } else if (e.key === 'Enter' && e.ctrlKey) {
        // Save with Ctrl+Enter
        finishEditing();
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
      fill={fill}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      padding={10}
      align="left"
      verticalAlign="top"
      wrap="word"
      // Use individual props from commonProps for better control
      stroke={commonProps?.stroke}
      strokeWidth={commonProps?.strokeWidth}
      shadowColor={commonProps?.shadowColor}
      shadowBlur={commonProps?.shadowBlur}
      shadowOpacity={commonProps?.shadowOpacity}
      opacity={commonProps?.opacity}
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

export default EditableText;

