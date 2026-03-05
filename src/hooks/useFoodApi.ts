import { useState, useCallback } from 'react';
import type { 
  FoodItem, 
  DetailedFoodItem, 
  SearchResponse, 
  FoodDetailsResponse, 
  ApiError,
  SearchStatus 
} from '@/types/food';

// API base URL - adjust based on your deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UseFoodSearchReturn {
  foods: FoodItem[];
  totalHits: number;
  status: SearchStatus;
  error: string | null;
  searchFoods: (query: string, pageSize?: number) => Promise<void>;
  clearResults: () => void;
}

interface UseFoodDetailsReturn {
  food: DetailedFoodItem | null;
  status: SearchStatus;
  error: string | null;
  fetchFoodDetails: (fdcId: number) => Promise<void>;
  clearFood: () => void;
}

/**
 * Custom hook for searching foods via the PHP backend API
 */
export function useFoodSearch(): UseFoodSearchReturn {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const searchFoods = useCallback(async (query: string, pageSize: number = 25) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/food-search.php?q=${encodeURIComponent(query)}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to search foods');
      }

      const data: SearchResponse = await response.json();

      if (data.success) {
        setFoods(data.data.foods);
        setTotalHits(data.data.totalHits);
        setStatus('success');
      } else {
        throw new Error('Search failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
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
 * Custom hook for fetching detailed food information
 */
export function useFoodDetails(): UseFoodDetailsReturn {
  const [food, setFood] = useState<DetailedFoodItem | null>(null);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchFoodDetails = useCallback(async (fdcId: number) => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/food-details.php?id=${fdcId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Failed to fetch food details');
      }

      const data: FoodDetailsResponse = await response.json();

      if (data.success) {
        setFood(data.data);
        setStatus('success');
      } else {
        throw new Error('Failed to fetch food details');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
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
 * Check API health status
 */
export async function checkApiHealth(): Promise<{ status: string; services: Record<string, string> } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/health.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
