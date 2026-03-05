import { useState, useEffect } from 'react';
import { 
  Search, 
  Utensils, 
  Flame, 
  Droplets, 
  Wheat, 
  Beef, 
  AlertCircle,
  ChevronRight,
  X,
  Info,
  Heart,
  Leaf,
  Zap,
  RefreshCw,
  Database,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFoodSearch, useFoodDetails, checkApiHealth } from '@/hooks/useFoodApi';
import { useMockFoodSearch, useMockFoodDetails } from '@/hooks/useMockFoodApi';
import type { FoodItem, DetailedFoodItem, Nutrient } from '@/types/food';
import './App.css';

const USE_MOCK_API = false; // Use real PHP backend API

// Componente de Tarjeta de Nutriente
function NutrientCard({ 
  icon: Icon, 
  label, 
  nutrient, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  nutrient?: Nutrient; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={`p-2 rounded-md ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">
          {nutrient ? `${nutrient.value}${nutrient.unit}` : 'N/D'}
        </p>
      </div>
    </div>
  );
}

// Componente de Elemento de Lista de Alimentos
function FoodListItem({ 
  food, 
  onClick 
}: { 
  food: FoodItem; 
  onClick: () => void;
}) {
  const calories = food.foodNutrients.calories?.value;
  const brand = food.brandOwner;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {food.description}
            </h3>
            {brand && (
              <p className="text-sm text-muted-foreground mt-1">{brand}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {food.dataType}
              </Badge>
              {food.servingSize && (
                <span className="text-xs text-muted-foreground">
                  {food.servingSize}{food.servingSizeUnit}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {calories !== undefined && (
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{Math.round(calories)}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de Modal de Detalles de Alimento
function FoodDetailsModal({ 
  food, 
  onClose 
}: { 
  food: DetailedFoodItem; 
  onClose: () => void;
}) {
  const nutrients = food.foodNutrients;
  const macros = food.nutrientsByCategory.macronutrients;
  const vitamins = food.nutrientsByCategory.vitamins;
  const minerals = food.nutrientsByCategory.minerals;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div className="flex-1 pr-4">
            <CardTitle className="text-xl leading-tight">{food.description}</CardTitle>
            {food.brandOwner && (
              <p className="text-sm text-muted-foreground mt-1">{food.brandOwner}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary">{food.dataType}</Badge>
              {food.foodCategoryDescription && (
                <Badge variant="outline">{food.foodCategoryDescription}</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <CardContent className="space-y-6">
            {/* Información de Porción */}
            {(food.servingSize || food.householdServingFullText) && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Tamaño de Porción</p>
                  <p className="text-sm text-muted-foreground">
                    {food.householdServingFullText || `${food.servingSize}${food.servingSizeUnit}`}
                  </p>
                </div>
              </div>
            )}

            {/* Cuadrícula Principal de Nutrición */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NutrientCard 
                icon={Flame} 
                label="Calorías" 
                nutrient={nutrients.calories}
                color="bg-orange-500"
              />
              <NutrientCard 
                icon={Beef} 
                label="Proteínas" 
                nutrient={nutrients.protein}
                color="bg-red-500"
              />
              <NutrientCard 
                icon={Droplets} 
                label="Grasas" 
                nutrient={nutrients.fat}
                color="bg-yellow-500"
              />
              <NutrientCard 
                icon={Wheat} 
                label="Carbohidratos" 
                nutrient={nutrients.carbs}
                color="bg-green-500"
              />
            </div>

            {/* Pestañas de Nutrición Detallada */}
            <Tabs defaultValue="macros" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="macros">Macronutrientes</TabsTrigger>
                <TabsTrigger value="vitamins">Vitaminas</TabsTrigger>
                <TabsTrigger value="minerals">Minerales</TabsTrigger>
                <TabsTrigger value="other">Otros</TabsTrigger>
              </TabsList>

              <TabsContent value="macros" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(macros).filter(([, n]) => n).length > 0 ? (
                    Object.entries(macros)
                      .filter(([, n]) => n)
                      .map(([key, nutrient]) => (
                        <div key={key} className="flex justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm capitalize">{nutrient!.name || key}</span>
                          <span className="font-medium">{nutrient!.value}{nutrient!.unit}</span>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground col-span-2 text-center py-4">
                      No hay datos de macronutrientes disponibles
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="vitamins" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(vitamins).filter(([, n]) => n).length > 0 ? (
                    Object.entries(vitamins)
                      .filter(([, n]) => n)
                      .map(([key, nutrient]) => (
                        <div key={key} className="flex justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm">{nutrient!.name || key}</span>
                          <span className="font-medium">{nutrient!.value}{nutrient!.unit}</span>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground col-span-2 text-center py-4">
                      No hay datos de vitaminas disponibles
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="minerals" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(minerals).filter(([, n]) => n).length > 0 ? (
                    Object.entries(minerals)
                      .filter(([, n]) => n)
                      .map(([key, nutrient]) => (
                        <div key={key} className="flex justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm">{nutrient!.name || key}</span>
                          <span className="font-medium">{nutrient!.value}{nutrient!.unit}</span>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground col-span-2 text-center py-4">
                      No hay datos de minerales disponibles
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="other" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {nutrients.fiber && (
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Fibra Dietética</span>
                      <span className="font-medium">{nutrients.fiber.value}{nutrients.fiber.unit}</span>
                    </div>
                  )}
                  {nutrients.sugars && (
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Azúcares</span>
                      <span className="font-medium">{nutrients.sugars.value}{nutrients.sugars.unit}</span>
                    </div>
                  )}
                  {nutrients.water && (
                    <div className="flex justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Agua</span>
                      <span className="font-medium">{nutrients.water.value}{nutrients.water.unit}</span>
                    </div>
                  )}
                  {Object.entries(food.nutrientsByCategory.other).filter(([, n]) => n).length > 0 ? (
                    Object.entries(food.nutrientsByCategory.other)
                      .filter(([, n]) => n)
                      .map(([key, nutrient]) => (
                        <div key={key} className="flex justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm">{nutrient!.name || key}</span>
                          <span className="font-medium">{nutrient!.value}{nutrient!.unit}</span>
                        </div>
                      ))
                  ) : (
                    !nutrients.fiber && !nutrients.sugars && !nutrients.water && (
                      <p className="text-muted-foreground col-span-2 text-center py-4">
                        No hay datos adicionales disponibles
                      </p>
                    )
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Ingredientes */}
            {food.ingredients && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-500" />
                    Ingredientes
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {food.ingredients}
                  </p>
                </div>
              </>
            )}

            {/* Información de Publicación */}
            {food.publicationDate && (
              <p className="text-xs text-muted-foreground text-center">
                Datos publicados: {food.publicationDate}
              </p>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}

// Componente de Esqueleto de Carga
function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <Skeleton className="h-12 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente Principal de la Aplicación
function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [apiStatus, setApiStatus] = useState<{ status: string; services: Record<string, string> } | null>(null);
  
  // Usar API simulada para demo, API real cuando el backend PHP esté disponible
  const realSearch = useFoodSearch();
  const realDetails = useFoodDetails();
  const mockSearch = useMockFoodSearch();
  const mockDetails = useMockFoodDetails();
  
  const { foods, totalHits, status, error, searchFoods, clearResults } = USE_MOCK_API ? mockSearch : realSearch;
  const { food: selectedFood, status: detailsStatus, fetchFoodDetails, clearFood } = USE_MOCK_API ? mockDetails : realDetails;

  // Verificar estado de la API al montar (solo para API real)
  useEffect(() => {
    if (!USE_MOCK_API) {
      checkApiHealth().then(setApiStatus);
    }
  }, []);

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchFoods(searchQuery);
    }
  };

  // Manejar selección de alimento
  const handleFoodClick = (fdcId: number) => {
    setSelectedFoodId(fdcId);
    fetchFoodDetails(fdcId);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setSelectedFoodId(null);
    clearFood();
  };

  // Búsquedas populares
  const popularSearches = ['manzana', 'pechuga de pollo', 'arroz', 'huevo', 'salmón', 'aguacate'];

  return (
    <div className="min-h-screen bg-background">
      {/* Encabezado */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Utensils className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">MedidorDeCalorías</h1>
          </div>
          <div className="flex items-center gap-2">
            {USE_MOCK_API && (
              <Badge 
                variant="outline" 
                className="hidden sm:flex items-center gap-1 border-orange-400 text-orange-600"
              >
                <AlertCircle className="w-3 h-3" />
                Modo Demo
              </Badge>
            )}
            {apiStatus && !USE_MOCK_API && (
              <Badge 
                variant={apiStatus.status === 'healthy' ? 'default' : 'destructive'}
                className="hidden sm:flex items-center gap-1"
              >
                {apiStatus.status === 'healthy' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                API {apiStatus.status === 'healthy' ? 'Activa' : 'Error'}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Sección Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Descubre los Datos Nutricionales
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Busca entre más de 300,000 alimentos de la base de datos FoodData Central del USDA. 
            Obtén información detallada de calorías y nutrición al instante.
          </p>
        </div>

        {/* Sección de Búsqueda */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Busca un alimento (ej., 'manzana', 'pechuga de pollo')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                disabled={status === 'loading'}
                className="px-6"
              >
                {status === 'loading' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </form>

            {/* Búsquedas Populares */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Populares:</span>
              {popularSearches.map((term) => (
                <Badge
                  key={term}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => {
                    setSearchQuery(term);
                    searchFoods(term);
                  }}
                >
                  {term}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerta de Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Sección de Resultados */}
        {status === 'loading' && <SearchSkeleton />}

        {status === 'success' && foods.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Se encontraron <span className="font-medium text-foreground">{totalHits.toLocaleString()}</span> resultados
              </p>
              <Button variant="ghost" size="sm" onClick={clearResults}>
                Limpiar resultados
              </Button>
            </div>
            
            <div className="space-y-3">
              {foods.map((food) => (
                <FoodListItem
                  key={food.fdcId}
                  food={food}
                  onClick={() => handleFoodClick(food.fdcId)}
                />
              ))}
            </div>
          </div>
        )}

        {status === 'success' && foods.length === 0 && (
          <Card className="p-8 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
            <p className="text-muted-foreground">
              Intenta buscar con diferentes palabras clave o verifica tu ortografía.
            </p>
          </Card>
        )}

        {/* Estado Inicial */}
        {status === 'idle' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="font-medium mb-2">Conteo de Calorías</h3>
              <p className="text-sm text-muted-foreground">
                Obtén información precisa de calorías para cualquier alimento
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-medium mb-2">Datos Nutricionales</h3>
              <p className="text-sm text-muted-foreground">
                Desglose detallado de macronutrientes, vitaminas y minerales
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-medium mb-2">Rápido y Confiable</h3>
              <p className="text-sm text-muted-foreground">
                Impulsado por la base de datos oficial FoodData Central del USDA
              </p>
            </Card>
          </div>
        )}
      </main>

      {/* Pie de Página */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Datos proporcionados por USDA FoodData Central
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            MedidorDeCalorías © 2024 • Creado con React, Tailwind CSS y PHP
          </p>
        </div>
      </footer>

      {/* Modal de Detalles del Alimento */}
      {selectedFoodId && detailsStatus === 'success' && selectedFood && (
        <FoodDetailsModal food={selectedFood} onClose={handleCloseModal} />
      )}

      {/* Modal de Carga */}
      {selectedFoodId && detailsStatus === 'loading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando detalles nutricionales...</p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default App;
