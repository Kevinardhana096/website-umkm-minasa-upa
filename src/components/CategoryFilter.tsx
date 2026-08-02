'use client';

import React from 'react';
import { CategoryOption } from '@/types/product';

interface CategoryFilterProps {
  categories: CategoryOption[];
  selectedCategory: CategoryOption;
  onSelectCategory: (category: CategoryOption) => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}) => {
  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        const count = categoryCounts[category];

        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 ${
              isSelected
                ? 'bg-[#F4EBD9] text-[#5A3E1B] shadow-xs border border-[#E0D0B0] font-bold scale-[1.02]'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <span>{category}</span>
            {count !== undefined && (
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                  isSelected
                    ? 'bg-[#5A3E1B] text-[#F4EBD9]'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
