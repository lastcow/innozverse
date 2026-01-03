'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiClient } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface Rental {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  final_total?: string;
  pricing_period?: string;
  selected_color?: string;
  equipment?: {
    id: string;
    name: string;
    image_url?: string;
  };
  product_template?: {
    id: string;
    name: string;
    image_url?: string;
  };
  created_at: string;
}

export default function MyRentalsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(statusFilter);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
        }

        const response = await apiClient.getMyRentals();
        setRentals(response.data.rentals || []);
      } catch (err) {
        console.error('Failed to fetch rentals:', err);
        setError('Failed to load your rentals. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, []);

  const filterRentals = (status: string) => {
    if (status === 'all') return rentals;
    if (status === 'active') return rentals.filter((r) => r.status === 'active');
    if (status === 'pending')
      return rentals.filter((r) => r.status === 'pending' || r.status === 'confirmed');
    if (status === 'completed') return rentals.filter((r) => r.status === 'completed');
    if (status === 'cancelled') return rentals.filter((r) => r.status === 'cancelled');
    return rentals;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'pending':
      case 'confirmed':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(price));
  };

  const filteredRentals = filterRentals(activeTab);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Rentals</h1>
          <p className="text-muted-foreground">View and manage your equipment rentals</p>
        </div>
        <Link href="/my/rent">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Rental
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({rentals.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({rentals.filter((r) => r.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({rentals.filter((r) => r.status === 'pending' || r.status === 'confirmed').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({rentals.filter((r) => r.status === 'completed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredRentals.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No rentals found</h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'all'
                  ? "You haven't made any rentals yet."
                  : `No ${activeTab} rentals found.`}
              </p>
              <Link href="/my/browse">
                <Button>Browse Catalog</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRentals.map((rental) => (
                <Card key={rental.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Image */}
                      <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {(rental.product_template?.image_url || rental.equipment?.image_url) ? (
                          <img
                            src={rental.product_template?.image_url || rental.equipment?.image_url}
                            alt={rental.product_template?.name || rental.equipment?.name || 'Equipment'}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {rental.product_template?.name || rental.equipment?.name || 'Equipment'}
                            </h3>
                            {rental.selected_color && (
                              <p className="text-sm text-muted-foreground">
                                Color: {rental.selected_color}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                              rental.status
                            )}`}
                          >
                            {getStatusIcon(rental.status)}
                            {rental.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                          </div>
                          {rental.pricing_period && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {rental.pricing_period === 'weekly' ? 'Weekly' : 'Monthly'}
                            </div>
                          )}
                          <div className="font-medium text-foreground">
                            {formatPrice(rental.final_total || rental.total_amount)}
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <Link href={`/my/rentals/${rental.id}`}>
                        <Button variant="outline">
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
