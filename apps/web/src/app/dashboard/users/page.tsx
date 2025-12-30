'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ApiClient, UserRole } from '@innozverse/api-client';
import {
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  UserPlus,
  Shield,
  Eye,
  FileText,
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
} from 'lucide-react';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

const ROLES: UserRole[] = [
  'admin',
  'super_user',
  'guest',
  'subscription_1',
  'subscription_2',
  'subscription_3',
  'subscription_4',
  'subscription_5',
  'freebie',
];

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'invited' | 'suspended'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit] = useState(10);

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    active: 0,
    invited: 0,
    suspended: 0,
  });

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('guest');

  // Invite user state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('guest');

  // Delete user state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Actions menu state
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setOpenActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === 'admin' || role === 'super_user') return Shield;
    if (role.includes('subscription')) return FileText;
    return Eye;
  };

  const getStatusBadge = (isActive: boolean, createdAt: string) => {
    const createdAtDate = new Date(createdAt);
    const daysSinceCreation = (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24);

    if (!isActive) {
      return { label: 'Suspended', className: 'bg-red-100 text-red-700 border-red-200' };
    }
    if (daysSinceCreation < 7) {
      return { label: 'Invited', className: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    return { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' };
  };

  const isUserInvited = (createdAt: string) => {
    const createdAtDate = new Date(createdAt);
    const daysSinceCreation = (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation < 7;
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users for stats
      const allResponse = await apiClient.listUsers({ limit: 1000 });
      const allData = allResponse.data.users as User[];

      // Calculate stats
      const active = allData.filter((u: User) => u.is_active && !isUserInvited(u.created_at)).length;
      const invited = allData.filter((u: User) => u.is_active && isUserInvited(u.created_at)).length;
      const suspended = allData.filter((u: User) => !u.is_active).length;

      setStats({
        totalUsers: allData.length,
        active,
        invited,
        suspended,
      });

      // Fetch paginated users for display
      const response = await apiClient.listUsers({
        page: currentPage,
        limit: limit,
      });
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
      setTotalUsers(response.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit]);

  useEffect(() => {
    const refreshToken = apiClient.getRefreshToken();
    if (refreshToken) {
      apiClient.refresh().then(() => {
        fetchUsers();
      }).catch(() => {
        setError('Authentication failed. Please log in again.');
        setLoading(false);
      });
    } else {
      setError('No authentication token found. Please log in.');
      setLoading(false);
    }
  }, [fetchUsers]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      await apiClient.updateUser(editingUser.id, {
        name: editName,
        role: editRole,
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await apiClient.deleteUser(userToDelete.id);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      setUserToDelete(null);
    }
  };

  const handleInvite = async () => {
    try {
      await apiClient.inviteUser({
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
      });
      setShowInvite(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('guest');
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user');
    }
  };

  const handleTabChange = (tab: 'all' | 'active' | 'invited' | 'suspended') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const toggleActionsMenu = (userId: string) => {
    setOpenActionsMenu(openActionsMenu === userId ? null : userId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter users by tab (client-side)
  const filteredUsers = users.filter((user) => {
    if (activeTab === 'active') return user.is_active && !isUserInvited(user.created_at);
    if (activeTab === 'invited') return user.is_active && isUserInvited(user.created_at);
    if (activeTab === 'suspended') return !user.is_active;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage access and permissions for team members.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Today: {getTodayDate()}</span>
            <Button onClick={() => setShowInvite(true)} className="rounded-lg bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+8%</span>
                    {' '}from last month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold mt-1">{stats.active}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+5%</span>
                    {' '}from last month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                  <p className="text-2xl font-bold mt-1">{stats.invited}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">+3</span>
                    {' '}this week
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                  <p className="text-2xl font-bold mt-1">{stats.suspended}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-2">
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                    <span className="text-red-500">-1</span>
                    {' '}from last month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <UserX className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="p-0">
            {/* Tabs and Actions */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTabChange('all')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Users
                </button>
                <button
                  onClick={() => handleTabChange('active')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'active'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Active
                  {stats.active > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                      {stats.active}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('invited')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'invited'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Invited
                  {stats.invited > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {stats.invited}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('suspended')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'suspended'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Suspended
                  {stats.suspended > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                      {stats.suspended}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No users found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">User</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Role</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-medium text-sm text-muted-foreground">Joined</th>
                        <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const RoleIcon = getRoleIcon(user.role);
                        const statusBadge = getStatusBadge(user.is_active, user.created_at);

                        return (
                          <tr
                            key={user.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                  {getInitials(user.name)}
                                </div>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <RoleIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm capitalize">{user.role.replace('_', ' ')}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="p-4 text-right">
                              <div className="relative inline-block" ref={openActionsMenu === user.id ? actionsMenuRef : null}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleActionsMenu(user.id)}
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                                {openActionsMenu === user.id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg z-10 py-1">
                                    <button
                                      onClick={() => {
                                        handleEdit(user);
                                        setOpenActionsMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        setUserToDelete(user);
                                        setOpenActionsMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="rounded-lg"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="rounded-lg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit User</CardTitle>
                <CardDescription>Update user information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invite User Modal */}
        {showInvite && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Invite User</CardTitle>
                <CardDescription>Send an invitation to a new user</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowInvite(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite}>Send Invitation</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete User Alert Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user
                <span className="font-semibold"> {userToDelete?.name}</span> ({userToDelete?.email})
                and remove their data from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
