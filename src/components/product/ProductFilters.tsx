import { FilterCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase';

interface ProductFiltersProps {
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
}

export function ProductFilters({ activeFilter, onFilterChange }: ProductFiltersProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;
        
        // Add "All" category at the beginning
        const allCategories = [
          ...(data || [])
        ];
        
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
            <div className="w-10 h-3 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    // 修复1: 添加padding确保缩放后的按钮有足够空间
    <div className="flex items-center gap-4 overflow-x-auto pb-4 px-2">
      {categories.map((category) => {
        const isActive = activeFilter === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onFilterChange(category.id as FilterCategory)}
            // 修复2: 确保按钮容器有足够空间
            className="flex flex-col items-center gap-1 transition-all duration-300 min-w-fit px-1 py-1"
          >
            {/* Clean circular container */}
            <div className={`relative w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${
              isActive 
                // 修复3: 减小缩放比例，避免超出容器
                ? 'scale-105 ring-2 ring-orange-400 ring-offset-1 ring-offset-transparent' 
                : 'scale-100 hover:scale-105'
            }`}>
              {/* Image - NO BLUR EFFECTS */}
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Subtle glass overlay - VERY LIGHT */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              
              {/* Simple border */}
              <div className={`absolute inset-0 rounded-full border ${
                isActive 
                  ? 'border-orange-400' 
                  : 'border-white/30'
              }`} />
            </div>
            
            {/* Category name */}
            <span className={`text-xs font-medium transition-colors duration-300 whitespace-nowrap ${
              isActive 
                ? 'text-black' 
                : 'text-black/70 hover:text-black'
            }`}>
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}