import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  FolderTree,
  Settings,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { useEffect } from 'react';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
const { isAdmin, isAuthenticated, logout, loading } = useAuth();

useEffect(() => {
  // Wait until loading is done before checking
  if (!loading && (!isAuthenticated || !isAdmin)) {
    navigate('/auth');
  }
}, [isAuthenticated, isAdmin, loading, navigate]);

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  );
}


  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/coupons', label: 'Coupons', icon: Tag },
    { path: '/admin/categories', label: 'Categories', icon: FolderTree },
    { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-secondary/20">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-card border-r border-border sticky top-0">
          <div className="p-6">
            <Link to="/" className="flex items-center space-x-2">
              <h1 className="text-xl font-display font-bold text-primary">
                Zaika <span className="text-accent">Toast</span>
              </h1>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
          </div>

          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-3 right-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
