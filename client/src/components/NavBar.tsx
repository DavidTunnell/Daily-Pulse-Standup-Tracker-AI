import { useLocation, Link } from "wouter";
import { User, BarChart2, List, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

export function NavBar() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been logged out successfully"
        });
      }
    });
  };

  const navItems = [
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="h-5 w-5 mr-2" />,
      active: location === "/profile"
    },
    {
      href: "/analysis",
      label: "AI Analysis",
      icon: <BarChart2 className="h-5 w-5 mr-2" />,
      active: location === "/analysis"
    },
    {
      href: "/standups",
      label: "View All Standups",
      icon: <List className="h-5 w-5 mr-2" />,
      active: location === "/standups"
    }
  ];

  return (
    <div className="bg-background border-b mb-6">
      <div className="container mx-auto py-2 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <Logo size="md" withText={!isMobile} className="mr-2" />
              </div>
            </Link>
          </div>

          <div className="flex items-center">
            <nav className="flex items-center space-x-2 mr-3">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant={item.active ? "default" : "outline"}
                  asChild
                  className={cn(
                    "transition-all",
                    isMobile ? "px-3" : "px-4"
                  )}
                  size={isMobile ? "sm" : "default"}
                >
                  <Link href={item.href}>
                    <div className="flex items-center">
                      {item.icon}
                      {!isMobile && <span>{item.label}</span>}
                    </div>
                  </Link>
                </Button>
              ))}
            </nav>

            <div className="flex items-center">
              {!isMobile && (
                <div className="text-sm text-gray-600 mr-2">
                  Logged in as <span className="font-semibold">{user.username}</span>
                </div>
              )}
              <Button 
                variant="ghost" 
                size={isMobile ? "sm" : "default"}
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                {!isMobile && <span>Logout</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}