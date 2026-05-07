"use client";

import React, { useState, useEffect } from "react";
import { Shield, ArrowRight, Check, Sparkles, Heart, Grid3X3, Newspaper, Dumbbell, Cpu, Target, Smile, Briefcase, GraduationCap, Theater, Gamepad2, Trophy, Music, Plane, Utensils, Shirt, ShoppingBag, Scissors, Beaker, Trees, Palette, Camera, Dog, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchReelCategories } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  news: Newspaper,
  fitness: Dumbbell,
  tech: Cpu,
  motivation: Target,
  funny: Smile,
  business: Briefcase,
  education: GraduationCap,
  entertainment: Theater,
  gaming: Gamepad2,
  sports: Trophy,
  music: Music,
  travel: Plane,
  food: Utensils,
  lifestyle: Shirt,
  fashion: ShoppingBag,
  beauty: Scissors,
  diy: Beaker,
  science: Trees,
  nature: Trees,
  art: Palette,
  photography: Camera,
  pets: Dog,
  finance: DollarSign,
  trending: Target,
  relationships: Heart,
  wellness: Sparkles,
  culture: Theater,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'trending', name: 'Trending', icon: CATEGORY_ICONS.trending, color: '#FF6B35' },
  { id: 'relationships', name: 'Relationships', icon: CATEGORY_ICONS.relationships, color: '#E91E63' },
  { id: 'wellness', name: 'Wellness', icon: CATEGORY_ICONS.wellness, color: '#22C55E' },
  { id: 'lifestyle', name: 'Lifestyle', icon: CATEGORY_ICONS.lifestyle, color: '#F59E0B' },
  { id: 'culture', name: 'Culture', icon: CATEGORY_ICONS.culture, color: '#8B5CF6' },
  { id: 'news', name: 'News', icon: CATEGORY_ICONS.news, color: '#3B82F6' },
  { id: 'fitness', name: 'Fitness', icon: CATEGORY_ICONS.fitness, color: '#10B981' },
  { id: 'tech', name: 'Tech', icon: CATEGORY_ICONS.tech, color: '#6366F1' },
  { id: 'motivation', name: 'Motivation', icon: CATEGORY_ICONS.motivation, color: '#F59E0B' },
  { id: 'funny', name: 'Funny', icon: CATEGORY_ICONS.funny, color: '#EC4899' },
  { id: 'business', name: 'Business', icon: CATEGORY_ICONS.business, color: '#64748B' },
  { id: 'education', name: 'Education', icon: CATEGORY_ICONS.education, color: '#8B5CF6' },
  { id: 'entertainment', name: 'Entertainment', icon: CATEGORY_ICONS.entertainment, color: '#EF4444' },
  { id: 'gaming', name: 'Gaming', icon: CATEGORY_ICONS.gaming, color: '#14B8A6' },
  { id: 'sports', name: 'Sports', icon: CATEGORY_ICONS.sports, color: '#F97316' },
  { id: 'music', name: 'Music', icon: CATEGORY_ICONS.music, color: '#A855F7' },
  { id: 'travel', name: 'Travel', icon: CATEGORY_ICONS.travel, color: '#06B6D4' },
  { id: 'food', name: 'Food', icon: CATEGORY_ICONS.food, color: '#EA580C' },
  { id: 'fashion', name: 'Fashion', icon: CATEGORY_ICONS.fashion, color: '#EC4899' },
  { id: 'beauty', name: 'Beauty', icon: CATEGORY_ICONS.beauty, color: '#F472B6' },
  { id: 'diy', name: 'DIY', icon: CATEGORY_ICONS.diy, color: '#84CC16' },
  { id: 'science', name: 'Science', icon: CATEGORY_ICONS.science, color: '#0EA5E9' },
  { id: 'nature', name: 'Nature', icon: CATEGORY_ICONS.nature, color: '#10B981' },
  { id: 'art', name: 'Art', icon: CATEGORY_ICONS.art, color: '#F59E0B' },
  { id: 'photography', name: 'Photography', icon: CATEGORY_ICONS.photography, color: '#6B7280' },
  { id: 'pets', name: 'Pets', icon: CATEGORY_ICONS.pets, color: '#F97316' },
  { id: 'finance', name: 'Finance', icon: CATEGORY_ICONS.finance, color: '#059669' },
];

export function CategorySelection() {
  const [show, setShow] = useState(false);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const ageConfirmed = localStorage.getItem("age-confirmed");
    const categoriesSelected = localStorage.getItem("categories-selected");
    
    if (ageConfirmed && !categoriesSelected) {
      setShow(true);
      loadCategories();
    }
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [show]);

  const loadCategories = async () => {
    try {
      const res = await fetchReelCategories();
      if (!res.error && res.categories.length > 0) {
        // Map API categories to our format
        const apiCategories: Category[] = res.categories.map(cat => {
          const defaultCat = DEFAULT_CATEGORIES.find(dc => dc.id === cat);
          return defaultCat || {
            id: cat,
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            icon: CATEGORY_ICONS[cat] || Grid3X3,
            color: '#E91E63'
          };
        });
        setCategories(apiCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedCategories.length < 3) return;
    
    setSubmitting(true);
    
    // Save selected categories to localStorage
    localStorage.setItem("selected-categories", JSON.stringify(selectedCategories));
    localStorage.setItem("categories-selected", "true");
    
    // Navigate to reels page with first selected category
    const firstCategory = selectedCategories[0];
    router.push(`/reels?category=${firstCategory}`);
    
    setShow(false);
  };

  const handleCategoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;
    
    // Prevent background scroll when reaching the bottom of category list
    if (scrollTop + clientHeight >= scrollHeight - 1) {
      e.stopPropagation();
    }
  };

  const handleSkip = () => {
    // Allow skipping but mark as completed
    localStorage.setItem("categories-selected", "true");
    setShow(false);
    router.push('/reels');
  };

  if (!show) return null;

  const isValid = selectedCategories.length >= 3;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-secondary border border-muted rounded-[32px] p-10 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles size={40} className="text-primary" />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4">Choose Your Interests</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
              Select at least 3 categories to personalize your experience. 
              We'll show you the best reels from your chosen topics.
            </p>
            <p className="text-muted-foreground text-sm font-medium mb-8">
              Select minimum 3 categories to continue
            </p>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 h-64 overflow-y-auto scrollbar-hide">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div 
                className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 h-64 overflow-y-auto pr-2 scrollbar-category"
                onScroll={handleCategoryScroll}
              >
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                          : 'border-white/10 bg-white/5 hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div 
                        className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}40` }}
                      >
                        <IconComponent 
                          size={24} 
                          className="transition-colors"
                          style={{ color: category.color }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white capitalize text-center leading-tight">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
                  isValid && !submitting
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  'Setting up your feed...'
                ) : (
                  <>
                    Continue with {selectedCategories.length} categories
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <button
                onClick={handleSkip}
                disabled={submitting}
                className="w-full bg-transparent hover:bg-muted border border-muted text-muted-foreground font-medium py-4 rounded-2xl transition-all"
              >
                Skip for now
              </button>
            </div>

            <p className="mt-6 text-[10px] text-muted-foreground">
              You can always change your preferences later in the settings
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
