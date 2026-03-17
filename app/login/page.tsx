'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_STORAGE_KEY, authenticateUser, getDefaultRouteForSession, getRoleLabels, storeSession } from '@/lib/auth';
import { useUserDirectory } from '@/hooks/use-user-directory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [organization, setOrganization] = useState('Pro');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { users } = useUserDirectory();

  useEffect(() => {
    const storedSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession) as { roles?: Array<'admin' | 'head-office' | 'gate' | 'maintenance' | 'vehicle-assignment'>; role?: 'admin' | 'head-office' | 'gate' | 'maintenance' | 'vehicle-assignment'; accessRoutes?: string[] };
        router.replace(getDefaultRouteForSession({
          roles: session.roles ?? (session.role ? [session.role] : []),
          accessRoutes: (session.accessRoutes ?? []) as never[],
        }));
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const session = authenticateUser(organization, userId, password);

      if (!session) {
        setError('Invalid organization, User ID, or Password.');
        setLoading(false);
        return;
      }

      if (!organization.trim()) {
        setError('Please enter organization name.');
        setLoading(false);
        return;
      }

      storeSession(session);
      router.push(getDefaultRouteForSession(session));
    }, 800); // simulate network delay
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-[100px] opacity-70 animate-pulse transition-all duration-3000" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[80%] h-[80%] bg-gradient-to-tl from-indigo-500/20 via-cyan-500/10 to-transparent rounded-full blur-[100px] opacity-70 animate-pulse transition-all duration-3000 delay-1000" />
      </div>

      <Card className="z-10 w-full max-w-md shadow-2xl border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-gradient-to-tr from-blue-600 to-indigo-500 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Truck className="text-white w-7 h-7" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            Sign in to the NextGen TMS portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="organization" className="text-slate-700 dark:text-slate-300">Organization</Label>
              <Input
                id="organization"
                placeholder="Enter your organization name"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
                className="bg-white/50 dark:bg-slate-950/50 focus-visible:ring-blue-500 h-11 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-slate-700 dark:text-slate-300">User ID</Label>
              <Input
                id="userId"
                placeholder="Enter your User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="bg-white/50 dark:bg-slate-950/50 focus-visible:ring-blue-500 h-11 transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/50 dark:bg-slate-950/50 focus-visible:ring-blue-500 h-11 transition-all"
              />
            </div>
            <Button 
               type="submit" 
               className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] border-0"
               disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-slate-700">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Demo access by organization
            </div>
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => {
                    setOrganization(user.organization);
                    setUserId(user.userId);
                    setPassword(user.password);
                    setError('');
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-blue-100 bg-white px-3 py-2 text-left transition-colors hover:bg-blue-50"
                >
                  <span>
                    <span className="block">{getRoleLabels(user.roles)}</span>
                    <span className="block text-xs text-slate-500">
                      Org: {user.organization} | ID: {user.userId} | Password: {user.password}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-blue-600">Use</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <a href="#" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors cursor-pointer">
              Contact Admin
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
