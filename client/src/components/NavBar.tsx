import { useLocation, Link } from "wouter";
import { User, BarChart2, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export function NavBar() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  if (!user) return null;

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
      <div className="container mx-auto py-3 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <Logo size="md" withText className="mr-6" />
              </div>
            </Link>
          </div>

          <nav className="flex items-center space-x-2">
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
        </div>
      </div>
    </div>
  );
}