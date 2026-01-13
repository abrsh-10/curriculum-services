'use client'

import React, { useState } from 'react';
import { Input } from './ui/Input';
import { LoginCredentials } from '../types/auth';
import { useLogin } from '../hooks/useLogin';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { toast } from 'sonner';

interface GoogleTokenResponse {
  access_token: string;
}

// Dynamically import the FirstTimePasswordModal to ensure it uses the latest implementation
const FirstTimePasswordModal = dynamic(
  () => import('./modals/FirstTimePasswordModal').then(mod => mod.FirstTimePasswordModal), 
  { ssr: false }
);

interface LoginProps {
  onSuccess?: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const { loginWithCredentials, loginWithGoogle, isLoading, error, isFirstTimeLogin, resetFirstTimeLogin } = useLogin();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await loginWithCredentials(credentials);
    
    if (result.success && !result.isFirstTimeLogin) {
      toast.success('Successfully logged in');
      if (onSuccess) onSuccess();
    } else if (result.success && result.isFirstTimeLogin) {
      toast.success('Please change your password to continue');
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  // Google sign-in disabled per project requirements
  const handleGoogleSignIn = async () => {
    toast.message('Google sign-in is disabled');
  };

  const handleModalClose = () => {
    resetFirstTimeLogin();
    // Trigger middleware routing when modal is closed
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <div className="flex w-full items-center justify-center bg-background p-4 lg:w-1/2">
          <div className="w-full max-w-[368px] space-y-6">
            <div className="space-y-2 text-center">
              <img
                src="/gheero.png"
                alt="Logo"
                width={50}
                height={50}
                className="mx-auto"
              />
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email to sign in to your account
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="youremail@gmail.com"
                  value={credentials.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCredentials(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold">
                  Password
                </label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="********" 
                  showPasswordToggle
                  value={credentials.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCredentials(prev => ({
                    ...prev,
                    password: e.target.value
                  }))}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="text-right">
                <Link
                  href="/forgotPassword"
                  className="text-sm font-normal text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <form onSubmit={handleLogin}>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full rounded-md bg-[#1D4ED8] px-4 py-4 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? 'Logging in...' : 'Log in'}
                </button>
              </form>

              {/* Google sign-in disabled */}
            </div>
          </div>
        </div>

        <div className="hidden w-1/2 bg-background lg:block">
          <div className="h-full p-3">
            <img
              src="/leftSide.png"
              alt="Login background"
              className="h-full w-full object-cover rounded-xl"
            />
          </div>
        </div>
      </div>

      <FirstTimePasswordModal
        isOpen={isFirstTimeLogin}
        onClose={handleModalClose}
      />
    </>
  );
}
