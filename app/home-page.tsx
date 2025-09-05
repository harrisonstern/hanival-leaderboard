'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Trophy, Zap } from 'lucide-react';

export default function HomePage() {
   const [name, setName] = useState('');
   const [catchPhrase, setCatchPhrase] = useState('');
   const [photoUrl, setPhotoUrl] = useState('');
   const [loading, setLoading] = useState(false);
   const router = useRouter();
   const supabase = createClient();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
         const { error } = await supabase
             .from('guests')
             .insert([
                {
                   name,
                   catch_phrase: catchPhrase,
                   photo_url: photoUrl,
                },
             ]);

         if (error) throw error;

         // Redirect to welcome page
         router.push('/welcome');
      } catch (error) {
         console.error('Error creating guest:', error);
         alert('Error creating guest profile. Please try again!');
      } finally {
         setLoading(false);
      }
   };

   return (
       <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
          <div className="max-w-md mx-auto">
             {/* Animated Header */}
             <div className="text-center mb-8 pt-8">
                <h1 className="text-5xl font-bold text-white mb-2 animate-bounce">
                   🎪 HANIVAL 🎪
                </h1>
                <p className="text-xl text-white/90">Step Right Up & Join the Fun!</p>
                <div className="flex justify-center gap-2 mt-4">
                   <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                   <Trophy className="w-6 h-6 text-yellow-300 animate-pulse delay-100" />
                   <Zap className="w-6 h-6 text-yellow-300 animate-pulse delay-200" />
                </div>
             </div>

             {/* Registration Card */}
             <Card className="bg-white/95 backdrop-blur shadow-2xl border-4 border-yellow-400">
                <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 -m-[2px] rounded-t-lg">
                   <CardTitle className="text-center text-2xl text-white">
                      🎯 Join the Games! 🎯
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">
                            🎭 Your Stage Name
                         </label>
                         <Input
                             type="text"
                             value={name}
                             onChange={(e) => setName(e.target.value)}
                             placeholder="The Amazing..."
                             required
                             className="border-2 border-purple-300 focus:border-purple-500 text-gray-900"
                         />
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">
                            💬 Your Carnival Catch Phrase
                         </label>
                         <Textarea
                             value={catchPhrase}
                             onChange={(e) => setCatchPhrase(e.target.value)}
                             placeholder="Winner winner, cotton candy dinner!"
                             required
                             rows={3}
                             className="border-2 border-purple-300 focus:border-purple-500 text-gray-900"
                         />
                      </div>

                      <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg py-6 rounded-full transform transition hover:scale-105 shadow-lg"
                      >
                         {loading ? (
                             <span className="animate-spin">🎪</span>
                         ) : (
                             <>
                                🎟️ Enter the Carnival! 🎟️
                             </>
                         )}
                      </Button>
                   </form>
                </CardContent>
             </Card>

             {/* Fun decorative elements */}
             <div className="mt-8 text-center text-white">
                <p className="text-lg font-semibold animate-pulse">
                   🎈 Win Prizes! 🎪 Play Games! 🎉 Have Fun! 🎈
                </p>
             </div>
          </div>
       </div>
   );
}