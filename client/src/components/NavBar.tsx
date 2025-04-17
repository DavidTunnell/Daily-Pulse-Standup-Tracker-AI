import { useLocation, Link } from "wouter";
import { User, BarChart2, List, LogOut, FileInput } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import pulseLogo from "../assets/pulse-logo.png";

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

  const mainButton = {
    href: "/",
    label: "Enter Standup",
    icon: <FileInput className="h-5 w-5 mr-2" />,
    active: location === "/"
  };

  const navItems = [
    {
      href: "/standups",
      label: "View All Standups",
      icon: <List className="h-5 w-5 mr-2" />,
      active: location === "/standups"
    },
    {
      href: "/analysis",
      label: "AI Analysis",
      icon: <BarChart2 className="h-5 w-5 mr-2" />,
      active: location === "/analysis"
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="h-5 w-5 mr-2" />,
      active: location === "/profile"
    }
  ];

  return (
    <div className="bg-background border-b mb-6">
      <div className="container mx-auto py-4 px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <span className="text-5xl font-extrabold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-transparent bg-clip-text tracking-tight py-2">DailyPulse</span>
                <img src={pulseLogo} alt="Pulse Logo" className="h-12 ml-3" />
              </div>
            </Link>
          </div>

          <div className="flex items-center">
            <nav className="flex items-center space-x-2 mr-3">
              <Button
                variant={mainButton.active ? "default" : "outline"}
                asChild
                className={cn(
                  "transition-all",
                  isMobile ? "px-3" : "px-4",
                  "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                size={isMobile ? "sm" : "default"}
              >
                <Link href={mainButton.href}>
                  <div className="flex items-center">
                    {mainButton.icon}
                    {!isMobile && <span>{mainButton.label}</span>}
                  </div>
                </Link>
              </Button>
              
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