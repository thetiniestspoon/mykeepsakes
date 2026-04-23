import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import '@/preview/collage/collage.css';

/**
 * Drag wrapper — migrated to Collage (Phase 4 #2 core, W3.3a). Drag logic and
 * props pass-through unchanged. Drag visual (elevated z + stronger shadow)
 * now uses Collage shadow tokens for consistency with the paper-chip metaphor.
 */

interface DraggableActivityProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  originalTime?: string;
  previewTime?: string | null;
}

export function DraggableActivity({
  id,
  children,
  disabled,
  originalTime,
  previewTime
}: DraggableActivityProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
    data: { originalTime }
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.92 : undefined,
    boxShadow: isDragging ? 'var(--c-shadow)' : undefined,
    borderRadius: isDragging ? 'var(--c-r-sm)' : undefined,
  };

  // Clone children to pass drag handle props
  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{
        previewTime?: string | null;
        isDragging?: boolean;
        dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
      }>, {
        previewTime: isDragging ? previewTime : undefined,
        isDragging,
        dragHandleProps: disabled ? undefined : { ...attributes, ...listeners },
      })
    : children;

  return (
    <div ref={setNodeRef} style={style}>
      {childrenWithProps}
    </div>
  );
}
