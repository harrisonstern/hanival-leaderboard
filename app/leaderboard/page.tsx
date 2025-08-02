'use client';

import {useEffect, useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Award, Medal, Star, Trophy} from 'lucide-react';
import Link from 'next/link';

interface Guest {
   id: string;
   name: string;
   photo_url: string | null;
   catch_phrase: string;
   points: number;
   created_at: string;
}

export default function LeaderboardPage() {
   const [guests, setGuests] = useState<Guest[]>([]);
   const [loading, setLoading] = useState(true);
   const supabase = createClient();

   useEffect(() => {
      fetchLeaderboard();

      // Set up real-time subscription
      const subscription = supabase
         .channel('leaderboard')
         .on('postgres_changes', {event: '*', schema: 'public', table: 'guests'}, () => {
            fetchLeaderboard();
         })
         .subscribe();

      return () => {
         subscription.unsubscribe();
      };
   }, []);

   const fetchLeaderboard = async () => {
      try {
         const {data, error} = await supabase
            .from('guests')
            .select('*')
            .order('points', {ascending: false});

         if (error) throw error;
         setGuests(data || []);
      } catch (error) {
         console.error('Error fetching leaderboard:', error);
      } finally {
         setLoading(false);
      }
   };

   const getRankIcon = (position: number) => {
      switch (position) {
         case 0:
            return <Trophy className="w-8 h-8 text-yellow-500"/>;
         case 1:
            return <Medal className="w-8 h-8 text-gray-400"/>;
         case 2:
            return <Award className="w-8 h-8 text-orange-600"/>;
         default:
            return <Star className="w-6 h-6 text-purple-500"/>;
      }
   };

   const getRankTextColor = (position: number) => {
      switch (position) {
         case 0:
            return 'text-yellow-900'; // Dark text for gold background
         case 1:
            return 'text-gray-700'; // Dark text for silver background
         case 2:
            return 'text-orange-800'; // Dark text for bronze background
         default:
            return 'text-gray-800';
      }
   };

   const getRankStyle = (position: number) => {
      switch (position) {
         case 0:
            return 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400 border-4';
         case 1:
            return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400 border-4';
         case 2:
            return 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400 border-4';
         default:
            return 'bg-white border-2 border-purple-300';
      }
   };

   return (<div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 p-4">
         <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 pt-8">
               <h1 className="text-5xl font-bold text-white mb-2">
                  🏆 HANIVAL CHAMPIONS 🏆
               </h1>
               <p className="text-xl text-white/90">Who's Winning the Most Prizes?</p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mb-6">
               <Link href="/">
                  <Button className="bg-white text-purple-600 hover:bg-gray-100">
                     🎪 Join the Fun!
                  </Button>
               </Link>
               <Link href="/admin">
                  <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
                     👑 Admin Panel
                  </Button>
               </Link>
            </div>

            {/* Leaderboard */}
            <div className="space-y-4">
               {loading ? (<div className="text-center text-white text-2xl animate-pulse">
                     Loading champions... 🎪
                  </div>) : guests.length === 0 ? (<Card className="bg-white/95 backdrop-blur">
                     <CardContent className="text-center py-8">
                        <p className="text-xl text-gray-600">
                           No players yet! Be the first to join! 🎟️
                        </p>
                     </CardContent>
                  </Card>) : (guests.map((guest, index) => (<Card
                        key={guest.id}
                        className={`${getRankStyle(index)} shadow-xl transform transition hover:scale-105`}
                     >
                        <CardContent className="p-4">
                           <div className="flex items-center gap-4">
                              {/* Rank */}
                              <div className="flex items-center gap-2 min-w-[120px]">
                                 <div className="flex items-center justify-center">
                                    {getRankIcon(index)}
                                 </div>
                                 <div className="text-3xl font-black text-purple-500 drop-shadow-md">
                                    #{index + 1}
                                 </div>
                              </div>

                              {/* Guest Info */}
                              <div className="flex-1">
                                 <h3 className="text-xl font-bold text-gray-800">{guest.name}</h3>
                                 <p className="text-sm text-gray-600 italic">"{guest.catch_phrase}"</p>
                              </div>

                              {/* Points */}
                              <div className="text-right">
                                 <div className="text-3xl font-bold text-purple-600">
                                    {guest.points}
                                 </div>
                                 <div className="text-sm text-gray-600">points</div>
                              </div>
                           </div>

                           {/* Achievement badges for top 3 */}
                           {index < 3 && (<div className="mt-3 flex justify-center gap-2">
                                 {Array.from({length: 3 - index}).map((_, i) => (
                                    <span key={i} className="text-2xl animate-bounce"
                                          style={{animationDelay: `${i * 0.1}s`}}>
                          ⭐
                        </span>))}
                              </div>)}
                        </CardContent>
                     </Card>)))}
            </div>

            {/* Fun footer */}
            <div className="mt-8 text-center text-white">
               <p className="text-lg font-semibold animate-pulse">
                  🎠 Keep Playing to Win More Points! 🎡
               </p>
            </div>
         </div>
      </div>);
}
