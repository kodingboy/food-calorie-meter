/**
 * Food Calorie Meter - Type Definitions
 */

export interface Nutrient {
  value: number;
  unit: string;
  name?: string;
}

export interface FoodNutrients {
  calories?: Nutrient;
  protein?: Nutrient;
  fat?: Nutrient;
  carbs?: Nutrient;
  fiber?: Nutrient;
  sugars?: Nutrient;
  sodium?: Nutrient;
  iron?: Nutrient;
  calcium?: Nutrient;
  potassium?: Nutrient;
  vitaminC?: Nutrient;
  vitaminA?: Nutrient;
  vitaminE?: Nutrient;
  vitaminB12?: Nutrient;
  cholesterol?: Nutrient;
  saturatedFat?: Nutrient;
  transFat?: Nutrient;
  [key: string]: Nutrient | undefined;
}

export interface FoodItem {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients: FoodNutrients;
}

export interface NutrientsByCategory {
  macronutrients: Record<string, Nutrient | undefined>;
  vitamins: Record<string, Nutrient | undefined>;
  minerals: Record<string, Nutrient | undefined>;
  other: Record<string, Nutrient | undefined>;
}

export interface DetailedFoodItem extends FoodItem {
  publicationDate?: string;
  brandName?: string;
  subbrandName?: string;
  foodCategory?: string;
  foodCategoryDescription?: string;
  labelNutrients?: Record<string, unknown>;
  nutrientsByCategory: NutrientsByCategory;
}

export interface SearchResponse {
  success: boolean;
  data: {
    foods: FoodItem[];
    totalHits: number;
    currentPage?: number;
    totalPages?: number;
  };
  cached: boolean;
  query: string;
}

export interface FoodDetailsResponse {
  success: boolean;
  data: DetailedFoodItem;
  cached: boolean;
}

export interface ApiError {
  error: string;
}

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';
