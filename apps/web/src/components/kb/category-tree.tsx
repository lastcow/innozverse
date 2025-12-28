'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KBCategoryWithChildren } from '@innozverse/api-client';

interface CategoryTreeProps {
  categories: KBCategoryWithChildren[];
  selectedId: string;
  onSelect: (categoryId: string) => void;
  level?: number;
}

export function CategoryTree({
  categories,
  selectedId,
  onSelect,
  level = 0,
}: CategoryTreeProps) {
  return (
    <div className={cn('space-y-1', level > 0 && 'ml-4')}>
      {categories.map((category) => (
        <CategoryTreeItem
          key={category.id}
          category={category}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level}
        />
      ))}
    </div>
  );
}

interface CategoryTreeItemProps {
  category: KBCategoryWithChildren;
  selectedId: string;
  onSelect: (categoryId: string) => void;
  level: number;
}

function CategoryTreeItem({
  category,
  selectedId,
  onSelect,
  level,
}: CategoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = category.id === selectedId;

  return (
    <div>
      <div
        className={cn(
          'flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onSelect(category.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mr-1 p-0.5 hover:bg-black/10 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 mr-2 flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
        )}
        <span className="truncate flex-1 text-left">{category.name}</span>
        {category.article_count !== undefined && category.article_count > 0 && (
          <span
            className={cn(
              'text-xs ml-2 px-1.5 py-0.5 rounded-full',
              isSelected ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20'
            )}
          >
            {category.article_count}
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <CategoryTree
          categories={category.children!}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level + 1}
        />
      )}
    </div>
  );
}
