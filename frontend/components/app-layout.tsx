'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Home,
  Calendar,
  Mail,
  CheckSquare,
  TrendingUp,
  BarChart,
  Settings
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AIChatPanel, AIChatButton } from "@/components/ai-chat-panel";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/emails', label: 'Emails', icon: Mail },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
];

const insightItems = [
  { href: '/analytics', label: 'Analytics', icon: BarChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children, title, actions }: AppLayoutProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 cosmic-grid opacity-30"></div>
      
      {/* Multiple gradient glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-pulse">
        <div className="w-full h-full opacity-10 bg-primary blur-[120px]"></div>
      </div>
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full">
        <div className="w-full h-full opacity-5 bg-primary blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="absolute top-2/3 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full">
        <div className="w-full h-full opacity-8 bg-primary blur-[60px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full h-screen">
          <div className="cosmic-glow relative overflow-hidden border-x border-border backdrop-blur-sm bg-card shadow-lg h-full">
            {/* Dashboard Header */}
            <div className="bg-card backdrop-blur-md w-full border-b border-border">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">Tabsy</span>
                  </Link>
                </div>
                
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  {actions}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary">FO</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
            
            {/* Dashboard Content */}
            <div className="flex h-[calc(100vh-73px)] overflow-hidden">
              {/* Sidebar */}
              <div className="w-64 border-r border-border p-4 space-y-6 hidden lg:block bg-card">
                <div className="space-y-2">
                  <div className="space-y-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                            active
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Insights</div>
                  <div className="space-y-1">
                    {insightItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                            active
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 bg-background overflow-auto">
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* AI Chat Panel */}
        <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        
        {/* Floating AI Button */}
        {!isChatOpen && <AIChatButton onClick={() => setIsChatOpen(true)} />}
      </div>
    </div>
  );
}

