'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Medal, Star, Trophy, Crown, LogOut, Home, Settings } from 'lucide-react';
import Link from 'next/link';

interface Guest {
   id: string;
   name: string;
   photo_url: string | null;
   catch_phrase: string;
   points: number;
   created_at: string;
}

interface Game {
   id: string;
   name: string;
}

interface GamePlay {
   guest_id: string;
   game_id: string;
   points_awarded: number;
}

interface GameLeader {
   game_name: string;
   guest_name: string;
   points: number;
}

export default function AdminLeaderboardPage() {
   const [guests, setGuests] = useState<Guest[]>([]);
   const [games, setGames] = useState<Game[]>([]);
   const [gamePlays, setGamePlays] = useState<GamePlay[]>([]);
   const [gameLeaders, setGameLeaders] = useState<GameLeader[]>([]);
   const [loading, setLoading] = useState(true);
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const router = useRouter();
   const supabase = createClient();

   useEffect(() => {
      checkAuth();
   }, []);

   const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push('/auth/login?redirect=/leaderboard');
      } else {
         setIsAuthenticated(true);
         fetchLeaderboard();
      }
   };

   const fetchLeaderboard = async () => {
      try {
         // Fetch guests
         const { data: guestsData, error: guestsError } = await supabase
             .from('guests')
             .select('*')
             .order('points', { ascending: false });

         if (guestsError) throw guestsError;
         setGuests(guestsData || []);

         // Fetch games
         const { data: gamesData, error: gamesError } = await supabase
             .from('games')
             .select('*')
             .order('name');

         if (gamesError) throw gamesError;
         setGames(gamesData || []);

         // Fetch game plays
         const { data: playsData, error: playsError } = await supabase
             .from('game_plays')
             .select('*');

         if (playsError) throw playsError;
         setGamePlays(playsData || []);

         // Calculate game leaders
         if (gamesData && playsData && guestsData) {
            const leaders: GameLeader[] = [];

            gamesData.forEach(game => {
               const gamePlaysForGame = playsData.filter(p => p.game_id === game.id);
               if (gamePlaysForGame.length > 0) {
                  const topPlay = gamePlaysForGame.reduce((prev, current) =>
                      prev.points_awarded > current.points_awarded ? prev : current
                  );
                  const topGuest = guestsData.find(g => g.id === topPlay.guest_id);
                  if (topGuest) {
                     leaders.push({
                        game_name: game.name,
                        guest_name: topGuest.name,
                        points: topPlay.points_awarded
                     });
                  }
               }
            });

            setGameLeaders(leaders);
         }
      } catch (error) {
         console.error('Error fetching leaderboard:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/');
   };

   const getRankIcon = (position: number) => {
      switch (position) {
         case 0:
            return <Trophy className="w-8 h-8 text-yellow-500" />;
         case 1:
            return <Medal className="w-8 h-8 text-gray-400" />;
         case 2:
            return <Award className="w-8 h-8 text-orange-600" />;
         default:
            return <Star className="w-6 h-6 text-purple-500" />;
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

   const getGameIcon = (gameName: string) => {
      switch(gameName) {
         case 'Ring Toss': return '🎯';
         case 'Duck Hunt': return '🦆';
         case 'Plinko': return '🎲';
         case 'Balloon Darts': return '🎈';
         default: return '🎮';
      }
   };

   const getGamesPlayedByGuest = (guestId: string) => {
      return gamePlays.filter(p => p.guest_id === guestId).length;
   };

   if (!isAuthenticated || loading) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 flex items-center justify-center">
             <div className="text-white text-2xl animate-pulse">Loading... 🎪</div>
          </div>
      );
   }

   return (
       <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 p-4">
          <div className="max-w-4xl mx-auto">
             {/* Header */}
             <div className="text-center mb-8 pt-8">
                <h1 className="text-5xl font-bold text-white mb-2">
                   🏆 ADMIN LEADERBOARD 🏆
                </h1>
                <p className="text-xl text-white/90">Complete Rankings & Game Leaders</p>
             </div>

             {/* Navigation */}
             <div className="flex justify-center gap-4 mb-6">
                <Link href="/admin">
                   <Button className="bg-white text-purple-600 hover:bg-gray-100">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Panel
                   </Button>
                </Link>
                <Button
                    onClick={handleLogout}
                    className="bg-red-500 text-white hover:bg-red-600"
                >
                   <LogOut className="w-4 h-4 mr-2" />
                   Logout
                </Button>
             </div>

             {/* Game Leaders Section */}
             <Card className="bg-white/95 backdrop-blur shadow-xl mb-6">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 -m-[1px] rounded-t-lg">
                   <CardTitle className="text-white text-xl flex items-center justify-center">
                      <Crown className="w-6 h-6 mr-2" />
                      Game Champions
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {games.map(game => {
                         const leader = gameLeaders.find(l => l.game_name === game.name);
                         return (
                             <div key={game.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <span className="text-2xl">{getGameIcon(game.name)}</span>
                                      <div>
                                         <p className="font-bold text-gray-800">{game.name}</p>
                                         {leader ? (
                                             <p className="text-sm text-gray-600">
                                                👑 {leader.guest_name}
                                             </p>
                                         ) : (
                                             <p className="text-sm text-gray-500 italic">
                                                No plays yet
                                             </p>
                                         )}
                                      </div>
                                   </div>
                                   {leader && (
                                       <Badge className="bg-yellow-500 text-white">
                                          {leader.points} pts
                                       </Badge>
                                   )}
                                </div>
                             </div>
                         );
                      })}
                   </div>
                </CardContent>
             </Card>

             {/* Overall Leaderboard */}
             <Card className="bg-white/95 backdrop-blur shadow-xl mb-6">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 -m-[1px] rounded-t-lg">
                   <CardTitle className="text-white text-xl">Total Points Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                   <div className="space-y-4">
                      {guests.length === 0 ? (
                          <div className="text-center py-8">
                             <p className="text-xl text-gray-600">
                                No players yet! Waiting for carnival guests... 🎟️
                             </p>
                          </div>
                      ) : (
                          guests.map((guest, index) => (
                              <Card
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
                                          <h3 className="text-xl font-bold text-gray-800">
                                             {guest.name}
                                             {index === 0 && <span className="ml-2">👑</span>}
                                          </h3>
                                          <p className="text-sm text-gray-600 italic">"{guest.catch_phrase}"</p>
                                          <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-gray-500">
                                             Games played: {getGamesPlayedByGuest(guest.id)}/4
                                          </span>
                                             {getGamesPlayedByGuest(guest.id) === 4 && (
                                                 <Badge className="bg-green-500 text-white text-xs">
                                                    All Games Completed!
                                                 </Badge>
                                             )}
                                          </div>
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
                                    {index < 3 && (
                                        <div className="mt-3 flex justify-center gap-2">
                                           {Array.from({ length: 3 - index }).map((_, i) => (
                                               <span key={i} className="text-2xl animate-bounce"
                                                     style={{ animationDelay: `${i * 0.1}s` }}>
                                             ⭐
                                          </span>
                                           ))}
                                        </div>
                                    )}
                                 </CardContent>
                              </Card>
                          ))
                      )}
                   </div>
                </CardContent>
             </Card>

             {/* Statistics */}
             <Card className="bg-white/95 backdrop-blur shadow-xl">
                <CardContent className="p-6">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                         <p className="text-3xl font-bold text-purple-600">{guests.length}</p>
                         <p className="text-sm text-gray-600">Total Players</p>
                      </div>
                      <div>
                         <p className="text-3xl font-bold text-blue-600">{gamePlays.length}</p>
                         <p className="text-sm text-gray-600">Games Played</p>
                      </div>
                      <div>
                         <p className="text-3xl font-bold text-green-600">
                            {guests.filter(g => getGamesPlayedByGuest(g.id) === 4).length}
                         </p>
                         <p className="text-sm text-gray-600">Completed All</p>
                      </div>
                      <div>
                         <p className="text-3xl font-bold text-yellow-600">
                            {guests.reduce((sum, g) => sum + g.points, 0)}
                         </p>
                         <p className="text-sm text-gray-600">Total Points</p>
                      </div>
                   </div>
                </CardContent>
             </Card>

             {/* Footer */}
             <div className="mt-8 text-center text-white">
                <p className="text-lg font-semibold animate-pulse">
                   🎠 The carnival continues! 🎡
                </p>
             </div>
          </div>
       </div>
   );
}