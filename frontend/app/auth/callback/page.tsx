'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

function AuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      // Redirect to dashboard on successful auth
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else if (error) {
      // Show error and redirect back to home
      alert(`Authentication failed: ${error}`);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Authenticating...</h2>
        <p className="text-muted-foreground">Please wait while we connect your account</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Loading...</h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

