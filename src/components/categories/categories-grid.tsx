import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

const CategoryGrid = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) console.error("Error fetching categories:", error);
      else setCategories(data || []);
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (slug: string) => {
    navigate(`/category/${slug}`);
  };

  return (
    <div className="w-full py-6">
      <h2 className="text-sm font-semibold mb-5 text-gray-800">
        {user?.firstName ? `${user.firstName.toUpperCase()}, WHAT'S ON YOUR MIND?` : `WHAT'S ON YOUR MIND?`}
      </h2>
      {/* Mobile + Tablet: horizontal scroll */}
      <div className="block lg:hidden overflow-x-auto scrollbar-hide px-1" style={{ WebkitOverflowScrolling: "touch" }}>
        <div
          className="grid grid-rows-2 grid-flow-col gap-3 snap-x snap-mandatory"
          style={
            {
              "--visible": 3.25, // show 3 full + 25% peek of 4th
              "--gap": "12px",
              gridAutoColumns:
                "calc((100% - ((var(--visible) - 1) * var(--gap))) / var(--visible))",
              paddingRight: "10px",
            } as any
          }
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className="cursor-pointer flex flex-col items-center justify-center snap-start transition-transform duration-200 hover:scale-105"
            >
              <img
                src={cat.image_url || "https://via.placeholder.com/100"}
                alt={cat.name}
                className="object-contain w-20 h-20 "
                style={{ maxWidth: "80%", maxHeight: "80%" }}
              />
              <p className="text-[12px] mt-0.5 text-gray-700 font-medium text-center">
                {cat.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: static grid (no scroll) */}
      <div className="hidden lg:grid lg:grid-cols-8 xl:grid-cols-10 gap-4 text-center mt-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleCategoryClick(cat.slug)}
            className="cursor-pointer flex flex-col items-center transition-transform duration-200 hover:scale-105"
          >
            <img
              src={cat.image_url || "https://via.placeholder.com/100"}
              alt={cat.name}
              className="object-contain w-24 h-24 drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)]"
            />
            <p className="text-sm mt-1 text-gray-700 font-medium">{cat.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;
