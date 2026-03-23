import { INSIGHT_TAGS, type InsightTag } from '@/types/conference';

interface TagChipsProps {
  selected: InsightTag[];
  onToggle: (tag: InsightTag) => void;
}

export function TagChips({ selected, onToggle }: TagChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {INSIGHT_TAGS.map((tag) => {
        const isSelected = selected.includes(tag.value);
        return (
          <button
            key={tag.value}
            type="button"
            onClick={() => onToggle(tag.value)}
            className={`
              shrink-0 rounded-full px-3 py-2 text-sm font-medium border
              transition-colors min-h-[40px]
              ${isSelected ? tag.color : 'bg-background text-gray-500 border-gray-200'}
            `}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
