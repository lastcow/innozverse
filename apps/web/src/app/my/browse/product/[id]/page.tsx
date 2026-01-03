'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ApiClient } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Package,
  ArrowLeft,
  Star,
  Sparkles,
  CheckCircle,
  Palette,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface ProductColor {
  id: string;
  color_name: string;
  hex_code: string | null;
}

interface Accessory {
  id: string;
  name: string;
  description: string | null;
  weekly_rate: string;
  monthly_rate: string;
  image_url: string | null;
}

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
  has_accessories: boolean;
  specs: Record<string, unknown> | null;
  highlights: string | null;
  includes: string[] | null;
  colors?: ProductColor[];
  accessories?: Accessory[];
}

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColorPreview, setSelectedColorPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
        }

        const response = await apiClient.getProduct(productId);
        setProduct(response.data.product);

        // Set first color as default preview
        if (response.data.product.colors?.length > 0) {
          setSelectedColorPreview(response.data.product.colors[0].color_name);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Failed to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

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

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Link href="/my/browse">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Product not found'}</AlertDescription>
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
          Back to Catalog
        </Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
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

          {/* Color Preview */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Available colors:</span>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColorPreview(color.color_name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColorPreview === color.color_name
                        ? 'border-purple-600 scale-110'
                        : 'border-gray-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex_code || '#gray' }}
                    title={color.color_name}
                  />
                ))}
              </div>
              {selectedColorPreview && (
                <span className="text-sm font-medium">{selectedColorPreview}</span>
              )}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            {product.subtitle && (
              <p className="text-xl text-muted-foreground mt-1">{product.subtitle}</p>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rental Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Weekly</p>
                  <p className="text-2xl font-bold">{formatPrice(product.weekly_rate)}</p>
                  <p className="text-xs text-muted-foreground">/week</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Monthly</p>
                  <p className="text-2xl font-bold">{formatPrice(product.monthly_rate)}</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Refundable Deposit</span>
                <span className="font-medium">{formatPrice(product.deposit_amount)}</span>
              </div>
              <Separator />
              <Link href={`/my/rent?product=${product.id}`}>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" size="lg">
                  Rent This Equipment
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Highlights */}
          {product.highlights && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{product.highlights}</p>
              </CardContent>
            </Card>
          )}

          {/* Includes */}
          {product.includes && product.includes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What&apos;s Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.includes.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b last:border-0">
                      <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                      <dd className="font-medium">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Compatible Accessories */}
      {product.accessories && product.accessories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compatible Accessories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.accessories.map((accessory) => (
                <div
                  key={accessory.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {accessory.image_url ? (
                      <img
                        src={accessory.image_url}
                        alt={accessory.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{accessory.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      +{formatPrice(accessory.weekly_rate)}/week
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              You can add these accessories when renting this equipment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
