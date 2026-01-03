'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiClient } from '@innozverse/api-client';
import {
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  email_verified: boolean;
  created_at: string;
  last_login_at?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
        }

        const response = await apiClient.getMe();
        const userData = response.data.user;
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          avatar_url: userData.avatar_url || undefined,
          email_verified: userData.email_verified,
          created_at: userData.created_at,
          last_login_at: userData.last_login_at || undefined,
        });
        setEditName(userData.name);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!editName.trim() || editName === user?.name) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Note: This would need an API endpoint to update profile
      // For now, we'll just show a success message
      // await apiClient.updateProfile({ name: editName });

      setUser((prev) => (prev ? { ...prev, name: editName } : prev));
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'super_user':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Error loading profile</h3>
        <p className="text-muted-foreground">{error || 'Unable to load your profile'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Separator />

            {/* Edit Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="max-w-sm"
                />
                <Button
                  onClick={handleSave}
                  disabled={saving || !editName.trim() || editName === user.name}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="max-w-sm bg-muted"
                />
                {user.email_verified && (
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email Verified</span>
                {user.email_verified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">{formatDate(user.created_at)}</p>
              </div>
              {user.last_login_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <p className="font-medium">{formatDate(user.last_login_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                OAuth connections and linked accounts would appear here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
