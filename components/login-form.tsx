'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to admin or specified page
      router.push(redirect);
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400">
       <div className="w-full max-w-sm">
         {/* Header */}
         <div className="text-center mb-8">
           <h1 className="text-4xl font-bold text-white mb-2">
             🎪 HANIVAL ADMIN 🎪
           </h1>
           <p className="text-xl text-white/90">Staff Login</p>
           <div className="flex justify-center gap-2 mt-4">
             <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
             <Lock className="w-6 h-6 text-yellow-300 animate-pulse delay-100" />
             <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse delay-200" />
           </div>
         </div>

         {/* Login Card */}
         <Card className="bg-white/95 backdrop-blur shadow-2xl border-4 border-yellow-400">
           <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 -m-[2px] rounded-t-lg">
             <CardTitle className="text-center text-2xl text-white">
               🎟️ Carnival Staff Only 🎟️
             </CardTitle>
             <CardDescription className="text-center text-white/90">
               Enter your credentials to access the admin panel
             </CardDescription>
           </CardHeader>
           <CardContent className="p-6">
             <form onSubmit={handleLogin} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">
                   Email
                 </label>
                 <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hanival.com"
                    required
                    className="border-2 border-purple-300 focus:border-purple-500 text-gray-900"
                 />
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">
                   Password
                 </label>
                 <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="border-2 border-purple-300 focus:border-purple-500 text-gray-900"
                 />
               </div>

               {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
               )}

               <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6 rounded-full transform transition hover:scale-105 shadow-lg"
               >
                 {loading ? (
                    <span className="animate-spin">🎪</span>
                 ) : (
                    <>
                      🎫 Enter Admin Panel 🎫
                    </>
                 )}
               </Button>
             </form>

             <div className="mt-6 text-center space-y-2">
               <Link href="/" className="text-purple-600 hover:text-purple-800 font-semibold underline block">
                 ← Back to Carnival
               </Link>
               <Link href="/auth/forgot-password" className="text-sm text-gray-600 hover:text-gray-800 underline">
                 Forgot your password?
               </Link>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
  );
}
