import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import React from 'react';

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50 opacity-90 shadow-lg rounded-lg"
      )}
    >
      {childrenWithProps}
    </div>
  );
}
