'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiClient } from '@innozverse/api-client';
import {
  Loader2,
  Search,
  Package,
  Star,
  Sparkles,
  Check,
  Plus,
  X,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';

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
  deposit_amount: string;
  image_url: string | null;
  colors?: ProductColor[];
}

interface ProductTemplate {
  id: string;
  category_id: string;
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
  colors?: ProductColor[];
  accessories?: Accessory[];
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

interface SelectedAccessory {
  accessory_id: string;
  selected_color?: string;
  accessory: Accessory;
}

export function CompactRentalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get('product');

  // Data loading state
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<ProductTemplate[]>([]);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<ProductTemplate | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedAccessory[]>([]);
  const [pricingPeriod, setPricingPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdRentalId, setCreatedRentalId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
        }

        const [catResponse, prodResponse] = await Promise.all([
          apiClient.listProductCategories(),
          apiClient.listProducts({ include_colors: true }),
        ]);

        setCategories(catResponse.data.categories || []);
        setProducts(prodResponse.data.products || []);

        // Pre-select product if specified
        if (preselectedProductId) {
          const product = (prodResponse.data.products || []).find(
            (p: ProductTemplate) => p.id === preselectedProductId
          );
          if (product) {
            handleSelectProduct(product);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preselectedProductId]);

  const handleSelectProduct = async (product: ProductTemplate) => {
    setSelectedProduct(product);
    setSelectedColor(product.colors?.[0]?.color_name || null);
    setSelectedAccessories([]);

    // Fetch full product details with accessories
    try {
      const response = await apiClient.getProduct(product.id);
      const fullProduct = response.data.product;

      // Debug logging to verify accessories are returned from API
      if (process.env.NODE_ENV === 'development') {
        console.log('[CompactRentalForm] Product details fetched:', {
          id: fullProduct.id,
          name: fullProduct.name,
          category_id: fullProduct.category_id,
          has_accessories: fullProduct.has_accessories,
          accessories_count: fullProduct.accessories?.length ?? 0,
          accessories: fullProduct.accessories,
        });
      }

      setSelectedProduct(fullProduct);
      setSelectedColor(fullProduct.colors?.[0]?.color_name || null);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      setError('Failed to load product details. Please try again.');
    }
  };

  const handleToggleAccessory = (accessory: Accessory) => {
    const existing = selectedAccessories.find((a) => a.accessory_id === accessory.id);
    if (existing) {
      setSelectedAccessories(selectedAccessories.filter((a) => a.accessory_id !== accessory.id));
    } else {
      setSelectedAccessories([
        ...selectedAccessories,
        {
          accessory_id: accessory.id,
          selected_color: accessory.colors?.[0]?.color_name,
          accessory,
        },
      ]);
    }
  };

  const handleAccessoryColorChange = (accessoryId: string, color: string) => {
    setSelectedAccessories(
      selectedAccessories.map((a) =>
        a.accessory_id === accessoryId ? { ...a, selected_color: color } : a
      )
    );
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.category_id === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.subtitle && product.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof price === 'string' ? parseFloat(price) : price);
  };

  // Calculate pricing
  const calculatePricing = () => {
    if (!selectedProduct || !startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    const periods = pricingPeriod === 'weekly' ? Math.ceil(days / 7) : Math.ceil(days / 30);

    const productRate =
      parseFloat(pricingPeriod === 'weekly' ? selectedProduct.weekly_rate : selectedProduct.monthly_rate) *
      periods;

    const accessoriesRate = selectedAccessories.reduce((sum, acc) => {
      const rate = pricingPeriod === 'weekly' ? acc.accessory.weekly_rate : acc.accessory.monthly_rate;
      return sum + parseFloat(rate) * periods;
    }, 0);

    const productDeposit = parseFloat(selectedProduct.deposit_amount);
    const accessoriesDeposit = selectedAccessories.reduce(
      (sum, acc) => sum + parseFloat(acc.accessory.deposit_amount),
      0
    );

    return {
      periods,
      productRate,
      accessoriesRate,
      subtotal: productRate + accessoriesRate,
      deposit: productDeposit + accessoriesDeposit,
      total: productRate + accessoriesRate,
    };
  };

  const pricing = calculatePricing();
  const today = new Date().toISOString().split('T')[0];

  const canSubmit =
    selectedProduct && startDate && endDate && termsAccepted && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedProduct) return;

    setSubmitting(true);
    setError(null);

    try {
      const refreshToken = apiClient.getRefreshToken();
      if (refreshToken) {
        await apiClient.refresh();
      }

      const response = await apiClient.createEnhancedRental({
        product_template_id: selectedProduct.id,
        selected_color: selectedColor || undefined,
        pricing_period: pricingPeriod,
        start_date: startDate,
        end_date: endDate,
        accessories: selectedAccessories.map((acc) => ({
          accessory_id: acc.accessory_id,
          selected_color: acc.selected_color || undefined,
        })),
        notes: notes || undefined,
      });

      setSuccess(true);
      setCreatedRentalId(response.data.rental.id);
    } catch (err: unknown) {
      console.error('Failed to create rental:', err);
      setError(err instanceof Error ? err.message : 'Failed to create rental');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success && createdRentalId) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Rental Confirmed!</h2>
        <p className="text-muted-foreground mb-6">
          Your rental has been created successfully.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push('/my/rentals')}>
            View My Rentals
          </Button>
          <Button
            onClick={() => router.push(`/my/rentals/${createdRentalId}`)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            View This Rental
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: Product Selection & Options */}
      <div className="lg:col-span-2 space-y-4">
        {/* Product Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Select Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={activeCategory} onValueChange={setActiveCategory}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Grid */}
            <div className="grid gap-2 sm:grid-cols-2 max-h-[280px] overflow-y-auto pr-1">
              {filteredProducts.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={cn(
                      'flex gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:bg-accent/50',
                      isSelected && 'ring-2 ring-purple-600 bg-purple-50/50'
                    )}
                  >
                    <div className="h-14 w-14 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        {isSelected && <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{product.subtitle}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-medium">{formatPrice(product.weekly_rate)}/wk</span>
                        {product.is_popular && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                        {product.is_new && (
                          <Sparkles className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Color Selection */}
        {selectedProduct && selectedProduct.colors && selectedProduct.colors.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Color</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.color_name)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all',
                      selectedColor === color.color_name
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: color.hex_code || '#ccc' }}
                    />
                    {color.color_name}
                    {selectedColor === color.color_name && (
                      <Check className="h-3 w-3 text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accessories */}
        {selectedProduct && selectedProduct.accessories && selectedProduct.accessories.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Accessories <span className="text-muted-foreground font-normal">(optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedProduct.accessories.map((accessory) => {
                  const selected = selectedAccessories.find((a) => a.accessory_id === accessory.id);
                  const isSelected = !!selected;

                  return (
                    <div
                      key={accessory.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg border transition-all',
                        isSelected && 'ring-1 ring-purple-600 bg-purple-50/50'
                      )}
                    >
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        {accessory.image_url ? (
                          <img
                            src={accessory.image_url}
                            alt={accessory.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{accessory.name}</p>
                        <p className="text-xs text-muted-foreground">
                          +{formatPrice(accessory.weekly_rate)}/wk
                        </p>
                      </div>
                      {isSelected && accessory.colors && accessory.colors.length > 0 && (
                        <Select
                          value={selected.selected_color || ''}
                          onValueChange={(v) => handleAccessoryColorChange(accessory.id, v)}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue placeholder="Color" />
                          </SelectTrigger>
                          <SelectContent>
                            {accessory.colors.map((c) => (
                              <SelectItem key={c.id} value={c.color_name}>
                                {c.color_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        size="sm"
                        variant={isSelected ? 'outline' : 'secondary'}
                        onClick={() => handleToggleAccessory(accessory)}
                        className={cn('h-8 px-2', isSelected && 'text-red-600 hover:text-red-700')}
                      >
                        {isSelected ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rental Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Billing</Label>
                <Select value={pricingPeriod} onValueChange={(v: 'weekly' | 'monthly') => setPricingPeriod(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Right: Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {selectedProduct ? (
              <>
                {/* Selected Product */}
                <div className="flex gap-3 p-2 bg-muted/50 rounded-lg">
                  <div className="h-12 w-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    {selectedProduct.image_url ? (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedProduct.name}</p>
                    {selectedColor && (
                      <p className="text-xs text-muted-foreground">{selectedColor}</p>
                    )}
                  </div>
                </div>

                {/* Selected Accessories */}
                {selectedAccessories.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Accessories:</p>
                    {selectedAccessories.map((acc) => (
                      <div key={acc.accessory_id} className="flex justify-between text-xs">
                        <span className="truncate">{acc.accessory.name}</span>
                        <span>+{formatPrice(acc.accessory.weekly_rate)}/wk</span>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Pricing */}
                {pricing ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equipment ({pricing.periods} {pricingPeriod === 'weekly' ? 'wk' : 'mo'})</span>
                      <span>{formatPrice(pricing.productRate)}</span>
                    </div>
                    {pricing.accessoriesRate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accessories</span>
                        <span>{formatPrice(pricing.accessoriesRate)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(pricing.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Refundable deposit</span>
                      <span>{formatPrice(pricing.deposit)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Select dates to see pricing
                  </p>
                )}

                <Separator />

                {/* Terms */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                  />
                  <Label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer">
                    I agree to the rental terms and conditions
                  </Label>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Rental'
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <Package className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Select equipment to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
