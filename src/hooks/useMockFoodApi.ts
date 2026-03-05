import { useState, useCallback } from 'react';
import type { FoodItem, DetailedFoodItem, SearchStatus } from '@/types/food';

// Datos de alimentos simulados para fines de demostración cuando el backend PHP no está disponible
const mockFoods: FoodItem[] = [
  {
    fdcId: 171688,
    description: "Manzana, cruda, con piel",
    dataType: "Fundación",
    foodNutrients: {
      calories: { value: 52, unit: "kcal" },
      protein: { value: 0.26, unit: "g" },
      fat: { value: 0.17, unit: "g" },
      carbs: { value: 13.81, unit: "g" },
      fiber: { value: 2.4, unit: "g" },
      sugars: { value: 10.39, unit: "g" },
      sodium: { value: 1, unit: "mg" },
      vitaminC: { value: 4.6, unit: "mg" },
      potassium: { value: 107, unit: "mg" }
    }
  },
  {
    fdcId: 171444,
    description: "Pechuga de pollo, a la parrilla, sin piel",
    dataType: "Fundación",
    foodNutrients: {
      calories: { value: 165, unit: "kcal" },
      protein: { value: 31.02, unit: "g" },
      fat: { value: 3.57, unit: "g" },
      carbs: { value: 0, unit: "g" },
      sodium: { value: 74, unit: "mg" },
      iron: { value: 1.04, unit: "mg" },
      potassium: { value: 256, unit: "mg" }
    }
  },
  {
    fdcId: 168917,
    description: "Arroz, blanco, cocido",
    dataType: "Fundación",
    foodNutrients: {
      calories: { value: 130, unit: "kcal" },
      protein: { value: 2.69, unit: "g" },
      fat: { value: 0.28, unit: "g" },
      carbs: { value: 28.17, unit: "g" },
      fiber: { value: 0.4, unit: "g" },
      sodium: { value: 1, unit: "mg" }
    }
  },
  {
    fdcId: 171287,
    description: "Huevo, entero, cocido, duro",
    dataType: "Fundación",
    foodNutrients: {
      calories: { value: 155, unit: "kcal" },
      protein: { value: 12.58, unit: "g" },
      fat: { value: 10.61, unit: "g" },
      carbs: { value: 1.12, unit: "g" },
      cholesterol: { value: 373, unit: "mg" },
      sodium: { value: 124, unit: "mg" },
      vitaminD: { value: 87, unit: "IU" }
    }
  },
  {
    fdcId: 171950,
    description: "Salmón, Atlántico, de granja, cocido",
    dataType: "Fundación",
    foodNutrients: {
      calories: { value: 206, unit: "kcal" },
      protein: { value: 22.1, unit: "g" },
      fat: { value: 12.35, unit: "g" },
      carbs: { value: 0, unit: "g" },
      sodium: { value: 59, unit: "mg" },
      vitaminD: { value: 526, unit: "IU" },
      omega3: { value: 2.3, unit: "g" }
    }
  },
  {
    fdcId: 171705,
    description: "Aguacate, crudo",
    dataType: "Fundación",
    foodNutrients: {
      calories: { value: 160, unit: "kcal" },
      protein: { value: 2, unit: "g" },
      fat: { value: 14.66, unit: "g" },
      carbs: { value: 8.53, unit: "g" },
      fiber: { value: 6.7, unit: "g" },
      potassium: { value: 485, unit: "mg" },
      vitaminK: { value: 21, unit: "mcg" }
    }
  },
  {
    fdcId: 1689178,
    description: "Plátano, crudo",
    dataType: "Fundación",
    foodNutrients: {
      calories: { value: 89, unit: "kcal" },
      protein: { value: 1.09, unit: "g" },
      fat: { value: 0.33, unit: "g" },
      carbs: { value: 22.84, unit: "g" },
      fiber: { value: 2.6, unit: "g" },
      sugars: { value: 12.23, unit: "g" },
      potassium: { value: 358, unit: "mg" },
      vitaminC: { value: 8.7, unit: "mg" },
      vitaminB6: { value: 0.4, unit: "mg" }
    }
  },
  {
    fdcId: 1689179,
    description: "Brócoli, crudo",
    dataType: "Fundación",
    foodNutrients: {
      calories: { value: 34, unit: "kcal" },
      protein: { value: 2.82, unit: "g" },
      fat: { value: 0.37, unit: "g" },
      carbs: { value: 6.64, unit: "g" },
      fiber: { value: 2.6, unit: "g" },
      vitaminC: { value: 89.2, unit: "mg" },
      vitaminK: { value: 101.6, unit: "mcg" },
      folate: { value: 63, unit: "mcg" }
    }
  },
  {
    fdcId: 1689180,
    description: "Almendras, crudas",
    dataType: "Fundación",
    foodNutrients: {
      calories: { value: 579, unit: "kcal" },
      protein: { value: 21.15, unit: "g" },
      fat: { value: 49.93, unit: "g" },
      carbs: { value: 21.55, unit: "g" },
      fiber: { value: 12.5, unit: "g" },
      vitaminE: { value: 25.63, unit: "mg" },
      magnesium: { value: 270, unit: "mg" },
      calcium: { value: 269, unit: "mg" }
    }
  },
  {
    fdcId: 1689181,
    description: "Yogur griego, natural, descremado",
    dataType: "De Marca",
    brandOwner: "Genérico",
    foodNutrients: {
      calories: { value: 59, unit: "kcal" },
      protein: { value: 10.19, unit: "g" },
      fat: { value: 0.39, unit: "g" },
      carbs: { value: 3.6, unit: "g" },
      calcium: { value: 110, unit: "mg" },
      sodium: { value: 36, unit: "mg" },
      vitaminB12: { value: 0.52, unit: "mcg" }
    }
  }
];

// Crear datos detallados de alimentos a partir de alimentos simulados
const createDetailedFood = (food: FoodItem): DetailedFoodItem => ({
  ...food,
  publicationDate: "2024-01-01",
  foodCategoryDescription: food.dataType === "Fundación" ? "Alimentos Básicos" : "Alimentos de Marca",
  servingSize: 100,
  servingSizeUnit: "g",
  householdServingFullText: "1 porción (100g)",
  nutrientsByCategory: {
    macronutrients: {
      calories: food.foodNutrients.calories,
      protein: food.foodNutrients.protein,
      fat: food.foodNutrients.fat,
      carbs: food.foodNutrients.carbs,
      fiber: food.foodNutrients.fiber,
      sugars: food.foodNutrients.sugars,
      cholesterol: food.foodNutrients.cholesterol,
      saturatedFat: food.foodNutrients.saturatedFat,
      transFat: food.foodNutrients.transFat
    },
    vitamins: {
      vitaminA: food.foodNutrients.vitaminA,
      vitaminC: food.foodNutrients.vitaminC,
      vitaminD: food.foodNutrients.vitaminD,
      vitaminE: food.foodNutrients.vitaminE,
      vitaminK: food.foodNutrients.vitaminK,
      vitaminB12: food.foodNutrients.vitaminB12,
      vitaminB6: food.foodNutrients.vitaminB6,
      thiamin: food.foodNutrients.thiamin,
      riboflavin: food.foodNutrients.riboflavin,
      niacin: food.foodNutrients.niacin,
      folate: food.foodNutrients.folate
    },
    minerals: {
      calcium: food.foodNutrients.calcium,
      iron: food.foodNutrients.iron,
      magnesium: food.foodNutrients.magnesium,
      phosphorus: food.foodNutrients.phosphorus,
      potassium: food.foodNutrients.potassium,
      sodium: food.foodNutrients.sodium,
      zinc: food.foodNutrients.zinc,
      copper: food.foodNutrients.copper,
      manganese: food.foodNutrients.manganese,
      selenium: food.foodNutrients.selenium
    },
    other: {
      water: food.foodNutrients.water,
      caffeine: food.foodNutrients.caffeine,
      carotene: food.foodNutrients.carotene
    }
  }
});

interface UseMockFoodSearchReturn {
  foods: FoodItem[];
  totalHits: number;
  status: SearchStatus;
  error: string | null;
  searchFoods: (query: string, pageSize?: number) => Promise<void>;
  clearResults: () => void;
}

interface UseMockFoodDetailsReturn {
  food: DetailedFoodItem | null;
  status: SearchStatus;
  error: string | null;
  fetchFoodDetails: (fdcId: number) => Promise<void>;
  clearFood: () => void;
}

/**
 * Hook simulado para buscar alimentos (usado cuando el backend PHP no está disponible)
 */
export function useMockFoodSearch(): UseMockFoodSearchReturn {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const searchFoods = useCallback(async (query: string, pageSize: number = 25) => {
    if (!query.trim()) {
      setError('Por favor ingresa un término de búsqueda');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    // Simular retraso de API
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const lowerQuery = query.toLowerCase();
      const filtered = mockFoods.filter(food => 
        food.description.toLowerCase().includes(lowerQuery) ||
        (food.brandOwner && food.brandOwner.toLowerCase().includes(lowerQuery))
      );

      // Aplicar límite de tamaño de página
      const limited = filtered.slice(0, pageSize);
      setFoods(limited);
      setTotalHits(filtered.length);
      setStatus('success');
    } catch (err) {
      setError('La búsqueda falló');
      setStatus('error');
      setFoods([]);
      setTotalHits(0);
    }
  }, []);

  const clearResults = useCallback(() => {
    setFoods([]);
    setTotalHits(0);
    setStatus('idle');
    setError(null);
  }, []);

  return { foods, totalHits, status, error, searchFoods, clearResults };
}

/**
 * Hook simulado para obtener información detallada de alimentos
 */
export function useMockFoodDetails(): UseMockFoodDetailsReturn {
  const [food, setFood] = useState<DetailedFoodItem | null>(null);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchFoodDetails = useCallback(async (fdcId: number) => {
    setStatus('loading');
    setError(null);

    // Simular retraso de API
    await new Promise(resolve => setTimeout(resolve, 300));

    const found = mockFoods.find(f => f.fdcId === fdcId);
    if (found) {
      setFood(createDetailedFood(found));
      setStatus('success');
    } else {
      setError('Alimento no encontrado');
      setStatus('error');
      setFood(null);
    }
  }, []);

  const clearFood = useCallback(() => {
    setFood(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { food, status, error, fetchFoodDetails, clearFood };
}

/**
 * Verificar si estamos en modo demo (sin backend PHP)
 */
export function isDemoMode(): boolean {
  return true; // Cambiar a false cuando el backend PHP esté disponible
}
