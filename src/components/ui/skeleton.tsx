import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'warm' | 'card';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const variantClasses = {
    default: 'bg-muted',
    warm: 'bg-gradient-to-r from-beach-sand via-secondary to-beach-sand',
    card: 'bg-gradient-to-r from-card via-muted to-card',
  };

  return (
    <div 
      className={cn(
        "rounded-md",
        prefersReducedMotion 
          ? "animate-pulse bg-muted" 
          : cn(
              variantClasses[variant],
              "bg-[length:200%_100%] animate-shimmer"
            ),
        className
      )} 
      {...props} 
    />
  );
}

export { Skeleton };
