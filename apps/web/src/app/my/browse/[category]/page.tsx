'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ApiClient } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Search,
  Package,
  ArrowLeft,
  Star,
  Sparkles,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface ProductTemplate {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  weekly_rate: string;
  monthly_rate: string;
  deposit_amount: string;
  image_url: string | null;
  is_popular: boolean;
  is_new: boolean;
  specs: Record<string, unknown> | null;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function CategoryProductsPage() {
  const params = useParams();
  const categorySlug = params.category as string;

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
        }

        // First get the category by slug
        const categoriesResponse = await apiClient.listProductCategories();
        const foundCategory = categoriesResponse.data.categories.find(
          (c: ProductCategory) => c.slug === categorySlug
        );

        if (!foundCategory) {
          setError('Category not found');
          setLoading(false);
          return;
        }

        setCategory(foundCategory);

        // Then get products for this category
        const productsResponse = await apiClient.listProducts({
          category_id: foundCategory.id,
        });
        setProducts(productsResponse.data.products || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categorySlug]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.subtitle && product.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  if (error || !category) {
    return (
      <div className="space-y-6">
        <Link href="/my/browse">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Category not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/my/browse">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-1">{category.description}</p>
        )}
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

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'No products available in this category'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="h-full hover:shadow-lg transition-all group overflow-hidden">
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative h-48 bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {product.is_popular && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600">
                        <Star className="mr-1 h-3 w-3" /> Popular
                      </Badge>
                    )}
                    {product.is_new && (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <Sparkles className="mr-1 h-3 w-3" /> New
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  {product.subtitle && (
                    <p className="text-sm text-muted-foreground">{product.subtitle}</p>
                  )}

                  {/* Pricing */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weekly</span>
                      <span className="font-medium">{formatPrice(product.weekly_rate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly</span>
                      <span className="font-medium">{formatPrice(product.monthly_rate)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link href={`/my/browse/product/${product.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/my/rent?product=${product.id}`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Rent
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
