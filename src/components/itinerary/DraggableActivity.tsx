import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableActivityProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DraggableActivity({ id, children, disabled }: DraggableActivityProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-90 shadow-lg"
      )}
    >
      {/* Drag handle */}
      {!disabled && (
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      {children}
    </div>
  );
}
