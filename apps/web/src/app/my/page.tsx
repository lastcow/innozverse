'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiClient } from '@innozverse/api-client';
import {
  Calendar,
  Clock,
  Package,
  PlusCircle,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface Rental {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  equipment?: {
    name: string;
    image_url?: string;
  };
  product_template?: {
    name: string;
    image_url?: string;
  };
  selected_color?: string;
}

export default function MyOverviewPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
        }

        // Fetch user info
        const userResponse = await apiClient.getMe();
        setUserName(userResponse.data.user.name);

        // Fetch user's rentals
        const rentalsResponse = await apiClient.getMyRentals();
        setRentals(rentalsResponse.data.rentals || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load your data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeRentals = rentals.filter((r) => r.status === 'active');
  const pendingRentals = rentals.filter((r) => r.status === 'pending' || r.status === 'confirmed');
  const completedRentals = rentals.filter((r) => r.status === 'completed');

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
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{userName ? `, ${userName}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your rentals
          </p>
        </div>
        <Link href="/my/rent">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Rent Equipment
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRentals.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRentals.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting pickup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRentals.length}</div>
            <p className="text-xs text-muted-foreground">
              Total completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Rentals */}
      {activeRentals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-green-600" />
              Active Rentals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeRentals.slice(0, 3).map((rental) => (
                <div
                  key={rental.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {rental.product_template?.name || rental.equipment?.name || 'Equipment'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                      {rental.status}
                    </span>
                    <Link href={`/my/rentals/${rental.id}`}>
                      <Button variant="ghost" size="sm">
                        View <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {activeRentals.length > 3 && (
                <Link href="/my/rentals?status=active">
                  <Button variant="outline" className="w-full">
                    View All Active Rentals
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Rentals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Recent Rentals
          </CardTitle>
          <Link href="/my/rentals">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {rentals.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No rentals yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by browsing our catalog and renting some equipment!
              </p>
              <Link href="/my/browse">
                <Button>Browse Catalog</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {rentals.slice(0, 5).map((rental) => (
                <div
                  key={rental.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {rental.product_template?.name || rental.equipment?.name || 'Equipment'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                      {rental.status}
                    </span>
                    <Link href={`/my/rentals/${rental.id}`}>
                      <Button variant="ghost" size="sm">
                        View <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:border-purple-300 transition-colors cursor-pointer">
          <Link href="/my/browse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Browse Catalog</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore our available equipment
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-pink-300 transition-colors cursor-pointer">
          <Link href="/my/rent">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center">
                  <PlusCircle className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Rent Equipment</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a new rental
                  </p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
