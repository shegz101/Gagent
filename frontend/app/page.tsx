'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex items-center justify-center p-4">
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

      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className={`relative z-10 max-w-4xl w-full transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              AI-Powered Personal Assistant
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-balance">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Welcome to Tabsy
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Your intelligent assistant that integrates calendar, email, and tasks—all powered by AI to keep you organized and productive.
          </p>
        </div>

        {/* Auth Card with glassmorphic effect */}
        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
          <div className="cosmic-glow relative rounded-xl overflow-hidden border border-border backdrop-blur-sm bg-card shadow-lg max-w-md mx-auto">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-md bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold tracking-tight text-2xl text-foreground">Get Started</h3>
                <p className="text-sm text-muted-foreground">
                  Sign in with your Google account to connect your calendar and email
                </p>
              </div>
              
              <Button 
                onClick={handleGoogleSignIn}
                className="w-full h-12 text-base bg-foreground text-background hover:bg-foreground/90"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Powered by Mastra AI & OpenAI GPT-4o-mini</p>
        </div>
      </div>
    </div>
  );
}
