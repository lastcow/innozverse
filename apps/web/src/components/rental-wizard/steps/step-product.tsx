'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiClient } from '@innozverse/api-client';
import {
  Loader2,
  Search,
  Package,
  Star,
  Sparkles,
  Check,
} from 'lucide-react';
import { useWizard, ProductTemplate } from '../wizard-context';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';

const apiClient = new ApiClient(config.apiBaseUrl);

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export function StepProduct() {
  const { state, dispatch } = useWizard();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
        }

        // Fetch categories and products
        const [catResponse, prodResponse] = await Promise.all([
          apiClient.listProductCategories(),
          apiClient.listProducts({ include_colors: true }),
        ]);

        setCategories(catResponse.data.categories || []);
        setProducts(prodResponse.data.products || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === 'all' || product.category_id === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.subtitle && product.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectProduct = (product: ProductTemplate) => {
    dispatch({ type: 'SET_PRODUCT', product });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(price));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Equipment</h2>
        <p className="text-muted-foreground">Choose the equipment you want to rent</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap h-auto gap-2">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const isSelected = state.product?.id === product.id;

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-lg',
                      isSelected && 'ring-2 ring-purple-600 bg-purple-50/50'
                    )}
                    onClick={() => handleSelectProduct(product)}
                  >
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative h-40 bg-muted">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-1">
                          {product.is_popular && (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                              <Star className="mr-1 h-3 w-3" />
                            </Badge>
                          )}
                          {product.is_new && (
                            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                              <Sparkles className="mr-1 h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.subtitle && (
                          <p className="text-sm text-muted-foreground">{product.subtitle}</p>
                        )}
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-muted-foreground">From</span>
                          <span className="font-medium">{formatPrice(product.weekly_rate)}/week</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
