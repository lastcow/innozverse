'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiClient } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Search,
  Laptop,
  Gamepad2,
  Monitor,
  Headphones,
  Package,
  ArrowRight,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  product_count?: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  gamepad: Gamepad2,
  monitor: Monitor,
  headphones: Headphones,
  package: Package,
};

const colorMap: Record<string, string> = {
  cyan: 'bg-cyan-100 text-cyan-600 border-cyan-200',
  green: 'bg-green-100 text-green-600 border-green-200',
  orange: 'bg-orange-100 text-orange-600 border-orange-200',
  purple: 'bg-purple-100 text-purple-600 border-purple-200',
  pink: 'bg-pink-100 text-pink-600 border-pink-200',
  blue: 'bg-blue-100 text-blue-600 border-blue-200',
};

export default function BrowseCatalogPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
        }

        const response = await apiClient.listProductCategories();
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Package;
    return iconMap[iconName.toLowerCase()] || Package;
  };

  const getColorClasses = (color: string | null) => {
    if (!color) return 'bg-gray-100 text-gray-600 border-gray-200';
    return colorMap[color.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200';
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Catalog</h1>
        <p className="text-muted-foreground">
          Explore our equipment categories and find what you need
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No categories found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'No categories available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const Icon = getIcon(category.icon);
            const colorClasses = getColorClasses(category.color);

            return (
              <Link key={category.id} href={`/my/browse/${category.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all hover:border-purple-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center border ${colorClasses}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      {category.product_count !== undefined && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {category.product_count} {category.product_count === 1 ? 'product' : 'products'} available
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
