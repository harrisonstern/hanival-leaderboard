'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Gift, Sparkles, LogOut } from 'lucide-react';
import Link from 'next/link';

interface Guest {
   id: string;
   name: string;
   photo_url: string | null;
   catch_phrase: string;
   points: number;
}

export default function AdminPage() {
   const [guests, setGuests] = useState<Guest[]>([]);
   const [loading, setLoading] = useState(true);
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [awardingPoints, setAwardingPoints] = useState<string | null>(null);
   const [pointsToAward, setPointsToAward] = useState<{ [key: string]: string }>({});
   const router = useRouter();
   const supabase = createClient();

   useEffect(() => {
      checkAuth();
      fetchGuests();
   }, []);

   const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push('/auth/login?redirect=/admin');
      } else {
         setIsAuthenticated(true);
      }
   };

   const fetchGuests = async () => {
      try {
         const { data, error } = await supabase
            .from('guests')
            .select('*')
            .order('name');

         if (error) throw error;
         setGuests(data || []);
      } catch (error) {
         console.error('Error fetching guests:', error);
      } finally {
         setLoading(false);
      }
   };

   const awardPoints = async (guestId: string) => {
      const points = parseInt(pointsToAward[guestId] || '0');
      if (points === 0) return;

      setAwardingPoints(guestId);
      try {
         const { error } = await supabase
            .from('points_history')
            .insert([
               {
                  guest_id: guestId,
                  points_awarded: points,
                  reason: 'Carnival game',
                  awarded_by: 'Admin',
               },
            ]);

         if (error) throw error;

         // Clear the input and refresh
         setPointsToAward({ ...pointsToAward, [guestId]: '' });
         await fetchGuests();

         // Show success animation
         setTimeout(() => setAwardingPoints(null), 1000);
      } catch (error) {
         console.error('Error awarding points:', error);
         alert('Error awarding points!');
         setAwardingPoints(null);
      }
   };

   const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/');
   };

   if (!isAuthenticated || loading) {
      return (
         <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400 flex items-center justify-center">
            <div className="text-white text-2xl animate-pulse">Loading... 🎪</div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400 p-4">
         <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 pt-8">
               <h1 className="text-5xl font-bold text-white mb-2">
                  👑 CARNIVAL ADMIN 👑
               </h1>
               <p className="text-xl text-white/90">Award Points to Players!</p>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mb-6">
               <Link href="/">
                  <Button className="bg-white text-purple-600 hover:bg-gray-100">
                     🎪 Home
                  </Button>
               </Link>
               <Link href="/leaderboard">
                  <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
                     🏆 Leaderboard
                  </Button>
               </Link>
               <Button
                  onClick={handleLogout}
                  className="bg-red-500 text-white hover:bg-red-600"
               >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
               </Button>
            </div>

            {/* Guests Grid */}
            <div className="grid gap-4 md:grid-cols-2">
               {guests.map((guest) => (
                  <Card
                     key={guest.id}
                     className="bg-white/95 backdrop-blur shadow-xl"
                  >
                     <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 -m-[1px] rounded-t-lg">
                        <CardTitle className="text-white flex items-center justify-between">
                           <span>{guest.name}</span>
                           <span className="text-2xl">{guest.points} pts</span>
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-4">
                        <p className="text-sm text-gray-600 italic mb-4">
                           "{guest.catch_phrase}"
                        </p>

                        <div className="flex gap-2">
                           <Input
                              type="number"
                              placeholder="Points to award"
                              value={pointsToAward[guest.id] || ''}
                              onChange={(e) => setPointsToAward({
                                 ...pointsToAward,
                                 [guest.id]: e.target.value
                              })}
                              className="flex-1 text-gray-900"
                              min="1"
                           />
                           <Button
                              onClick={() => awardPoints(guest.id)}
                              disabled={!pointsToAward[guest.id] || awardingPoints === guest.id}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                           >
                              {awardingPoints === guest.id ? (
                                 <Sparkles className="w-4 h-4 animate-spin" />
                              ) : (
                                 <>
                                    <Gift className="w-4 h-4 mr-2" />
                                    Award
                                 </>
                              )}
                           </Button>
                        </div>

                        {/* Success animation */}
                        {awardingPoints === guest.id && (
                           <div className="mt-2 text-center text-green-600 font-bold animate-bounce">
                              +{pointsToAward[guest.id]} Points! 🎉
                           </div>
                        )}
                     </CardContent>
                  </Card>
               ))}
            </div>

            {guests.length === 0 && (
               <Card className="bg-white/95 backdrop-blur">
                  <CardContent className="text-center py-8">
                     <p className="text-xl text-gray-600">
                        No players yet! Wait for guests to join the carnival! 🎟️
                     </p>
                  </CardContent>
               </Card>
            )}

            {/* Fun footer */}
            <div className="mt-8 text-center text-white">
               <p className="text-lg font-semibold">
                  <Coins className="inline w-6 h-6 mr-2" />
                  Award points for Ring Toss, Duck Pond, Strength Test, and more!
               </p>
            </div>
         </div>
      </div>
   );
}
