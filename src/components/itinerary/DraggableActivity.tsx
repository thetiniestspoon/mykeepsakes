import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
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

  // Clone children to pass preview time during drag
  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ previewTime?: string | null; isDragging?: boolean }>, {
        previewTime: isDragging ? previewTime : undefined,
        isDragging,
      })
    : children;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-90 shadow-lg rounded-lg"
      )}
    >
      {/* Drag handle - always visible with subtle styling */}
      {!disabled && (
        <button
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 p-1",
            "text-muted-foreground/50 hover:text-muted-foreground",
            "cursor-grab active:cursor-grabbing touch-none",
            "transition-colors",
            isDragging && "cursor-grabbing text-primary"
          )}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      {childrenWithProps}
    </div>
  );
}
