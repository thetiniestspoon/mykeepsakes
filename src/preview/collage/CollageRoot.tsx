import { ReactNode } from 'react';
import './collage.css';

interface Props {
  children: ReactNode;
  className?: string;
}

export function CollageRoot({ children, className = '' }: Props) {
  return <div className={`collage-root ${className}`}>{children}</div>;
}
