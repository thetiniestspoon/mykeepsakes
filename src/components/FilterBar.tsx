import { INSIGHT_TAGS, type InsightTag } from '@/types/conference';

interface FilterBarProps {
  activeFilter: InsightTag | null;
  onFilterChange: (tag: InsightTag | null) => void;
}

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide border-b">
      <button
        type="button"
        onClick={() => onFilterChange(null)}
        className={`
          shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
          ${activeFilter === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-gray-500 border-gray-200'}
        `}
      >
        All
      </button>
      {INSIGHT_TAGS.map((tag) => (
        <button
          key={tag.value}
          type="button"
          onClick={() => onFilterChange(activeFilter === tag.value ? null : tag.value)}
          className={`
            shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
            ${activeFilter === tag.value ? tag.color : 'bg-white text-gray-500 border-gray-200'}
          `}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
