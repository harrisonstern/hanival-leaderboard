'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
   Coins,
   Gift,
   Sparkles,
   LogOut,
   Trophy,
   CheckCircle,
   Lock,
   User,
   Target,
   Search,
   X,
   Edit2,
   Save
} from 'lucide-react';
import Link from 'next/link';

interface Guest {
   id: string;
   name: string;
   photo_url: string | null;
   catch_phrase: string;
   points: number;
}

interface Game {
   id: string;
   name: string;
   assigned_user_email: string | null;
}

interface GamePlay {
   id:string;
   guest_id: string;
   game_id: string;
   points_awarded: number;
   played_at: string;
   awarded_by_email: string;
}
//test branch

// Define super admin emails - these users can manage ALL games
const SUPER_ADMINS = ['stern.hari@gmail.com', 'hannah.elisabet.stern@gmail.com']; // Add your super admin email here

export default function AdminPageV2() {
   const [guests, setGuests] = useState<Guest[]>([]);
   const [games, setGames] = useState<Game[]>([]);
   const [gamePlays, setGamePlays] = useState<GamePlay[]>([]);
   const [loading, setLoading] = useState(true);
   const [userEmail, setUserEmail] = useState<string | null>(null);
   const [assignedGame, setAssignedGame] = useState<Game | null>(null);
   const [isSuperAdmin, setIsSuperAdmin] = useState(false);
   const [selectedGame, setSelectedGame] = useState<string>('');
   const [pointsToAward, setPointsToAward] = useState<{ [key: string]: string }>({});
   const [awardingPoints, setAwardingPoints] = useState<string | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [editingGuest, setEditingGuest] = useState<string | null>(null);
   const [editPoints, setEditPoints] = useState<{ [key: string]: string }>({});
   const router = useRouter();
   const supabase = createClient();

   useEffect(() => {
      checkAuth();
   }, []);

   useEffect(() => {
      if (userEmail) {
         fetchData();
      }
   }, [userEmail]);

   const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push('/auth/login?redirect=/admin');
      } else {
         setUserEmail(user.email || null);
         setIsSuperAdmin(SUPER_ADMINS.includes(user.email || ''));
      }
   };

   const fetchData = async () => {
      try {
         // Fetch games
         const { data: gamesData, error: gamesError } = await supabase
             .from('games')
             .select('*')
             .order('name');

         if (gamesError) throw gamesError;
         setGames(gamesData || []);

         // Find user's assigned game
         if (userEmail && gamesData) {
            const assigned = gamesData.find(g => g.assigned_user_email === userEmail);
            if (assigned) {
               setAssignedGame(assigned);
               setSelectedGame(assigned.id);
            } else if (isSuperAdmin && gamesData.length > 0) {
               setSelectedGame(gamesData[0].id);
            }
         }

         // Fetch guests
         const { data: guestsData, error: guestsError } = await supabase
             .from('guests')
             .select('*')
             .order('name');

         if (guestsError) throw guestsError;
         setGuests(guestsData || []);

         // Fetch game plays
         const { data: playsData, error: playsError } = await supabase
             .from('game_plays')
             .select('*');

         if (playsError) throw playsError;
         setGamePlays(playsData || []);

      } catch (error) {
         console.error('Error fetching data:', error);
      } finally {
         setLoading(false);
      }
   };

   const hasPlayedGame = (guestId: string, gameId: string) => {
      return gamePlays.some(
          play => play.guest_id === guestId && play.game_id === gameId
      );
   };

   const getGamePoints = (guestId: string, gameId: string) => {
      const play = gamePlays.find(
          p => p.guest_id === guestId && p.game_id === gameId
      );
      return play?.points_awarded;
   };

   const getGamesPlayedCount = (guestId: string) => {
      return gamePlays.filter(p => p.guest_id === guestId).length;
   };

   const canManageGame = (gameId: string) => {
      if (isSuperAdmin) return true;
      const game = games.find(g => g.id === gameId);
      return game?.assigned_user_email === userEmail;
   };

   const awardPoints = async (guestId: string) => {
      if (!selectedGame) {
         alert('Please select a game first!');
         return;
      }

      if (!canManageGame(selectedGame)) {
         alert('You are not authorized to manage this game!');
         return;
      }

      const points = parseInt(pointsToAward[guestId] || '0');
      if (points === 0) {
         alert('Please enter points to award!');
         return;
      }

      const game = games.find(g => g.id === selectedGame);
      if (!game) return;

      if (hasPlayedGame(guestId, selectedGame)) {
         alert(`This guest has already played ${game.name}!`);
         return;
      }

      setAwardingPoints(guestId);

      try {
         const { data: gamePlay, error: gamePlayError } = await supabase
             .from('game_plays')
             .insert([
                {
                   guest_id: guestId,
                   game_id: selectedGame,
                   points_awarded: points,
                   awarded_by_email: userEmail,
                },
             ])
             .select()
             .single();

         if (gamePlayError) throw gamePlayError;

         const { error: historyError } = await supabase
             .from('points_history')
             .insert([
                {
                   guest_id: guestId,
                   points_awarded: points,
                   reason: game.name,
                   awarded_by: userEmail,
                   game_play_id: gamePlay.id,
                },
             ]);

         if (historyError) throw historyError;

         setPointsToAward({ ...pointsToAward, [guestId]: '' });
         await fetchData();
         setTimeout(() => setAwardingPoints(null), 1000);
      } catch (error) {
         console.error('Error awarding points:', error);
         alert('Error awarding points!');
         setAwardingPoints(null);
      }
   };

   const updatePoints = async (guestId: string) => {
      if (!selectedGame) return;

      const points = parseInt(editPoints[guestId] || '0');
      if (points === 0) {
         alert('Please enter points to update!');
         return;
      }

      const game = games.find(g => g.id === selectedGame);
      if (!game) return;

      setAwardingPoints(guestId);

      try {
         const existingPlay = gamePlays.find(
             p => p.guest_id === guestId && p.game_id === selectedGame
         );

         if (!existingPlay) {
            alert('No existing game play found!');
            setAwardingPoints(null);
            return;
         }

         const { error: updateError } = await supabase
             .from('game_plays')
             .update({
                points_awarded: points,
                awarded_by_email: userEmail,
             })
             .eq('guest_id', guestId)
             .eq('game_id', selectedGame);

         if (updateError) throw updateError;

         const { error: historyError } = await supabase
             .from('points_history')
             .insert([
                {
                   guest_id: guestId,
                   points_awarded: points,
                   reason: game.name,
                   awarded_by: userEmail,
                   game_play_id: existingPlay.id,
                },
             ]);

         if (historyError) throw historyError;

         setEditPoints({ ...editPoints, [guestId]: '' });
         setEditingGuest(null);
         await fetchData();
         setTimeout(() => setAwardingPoints(null), 1000);
      } catch (error) {
         console.error('Error updating points:', error);
         alert('Error updating points!');
         setAwardingPoints(null);
      }
   };

   const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/');
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

   const filteredGuests = guests.filter(guest =>
       guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       guest.catch_phrase.toLowerCase().includes(searchQuery.toLowerCase())
   );

   if (loading) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400 flex items-center justify-center">
             <div className="text-white text-2xl animate-pulse">Loading... 🎪</div>
          </div>
      );
   }

   const availableGames = isSuperAdmin ? games : games.filter(g => g.assigned_user_email === userEmail);

   if (!isSuperAdmin && availableGames.length === 0) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400 p-4">
             <div className="max-w-2xl mx-auto pt-20">
                <Card className="bg-white/95 backdrop-blur">
                   <CardHeader>
                      <CardTitle className="text-2xl text-red-600">No Game Assigned</CardTitle>
                   </CardHeader>
                   <CardContent>
                      <p className="text-gray-600 mb-4">
                         You don't have any games assigned to manage. Please contact an administrator.
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                         Logged in as: {userEmail}
                      </p>
                      <Button onClick={handleLogout} className="bg-red-500 text-white">
                         <LogOut className="w-4 h-4 mr-2" /> Logout
                      </Button>
                   </CardContent>
                </Card>
             </div>
          </div>
      );
   }

   return (
       <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400 p-4">
          <div className="max-w-6xl mx-auto">
             {/* Header */}
             <div className="text-center mb-8 pt-8">
                <h1 className="text-5xl font-bold text-white mb-2">
                   👑 CARNIVAL ADMIN 👑
                </h1>
                <p className="text-xl text-white/90">Award Points for Games!</p>
                <div className="mt-2">
                   <Badge className="bg-white/20 text-white border-white/30">
                      <User className="w-3 h-3 mr-1" />
                      {userEmail} {isSuperAdmin && '(Super Admin)'}
                   </Badge>
                </div>
             </div>

             {/* Navigation */}
             <div className="flex justify-center gap-4 mb-6">
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

             {/* Game Selection or Assignment Display */}
             {isSuperAdmin ? (
                 <Card className="bg-white/95 backdrop-blur shadow-xl mb-6">
                    <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500 -m-[1px] rounded-t-lg">
                       <CardTitle className="text-white text-xl">Select Game (Super Admin)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {games.map((game) => (
                              <Button
                                  key={game.id}
                                  onClick={() => setSelectedGame(game.id)}
                                  variant={selectedGame === game.id ? "default" : "outline"}
                                  className={`h-20 text-lg font-bold ${
                                      selectedGame === game.id
                                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-4 border-purple-600'
                                          : 'hover:bg-purple-100'
                                  }`}
                              >
                                 <div className="flex flex-col items-center">
                                    <span className="text-2xl mb-1">{getGameIcon(game.name)}</span>
                                    <span className="text-sm">{game.name}</span>
                                    {game.assigned_user_email && (
                                        <span className="text-xs opacity-75">
                                       ({game.assigned_user_email.split('@')[0]})
                                    </span>
                                    )}
                                 </div>
                              </Button>
                          ))}
                       </div>
                    </CardContent>
                 </Card>
             ) : assignedGame ? (
                 <Alert className="mb-6 bg-purple-100 border-purple-400">
                    <AlertDescription className="text-lg">
                       <div className="flex items-center justify-between">
                        <span>
                           You are managing: <strong>{assignedGame.name}</strong> {getGameIcon(assignedGame.name)}
                        </span>
                          <Badge className="bg-purple-500 text-white">
                             Your Game
                          </Badge>
                       </div>
                    </AlertDescription>
                 </Alert>
             ) : null}

             {/* Search Bar */}
             <Card className="bg-white/95 backdrop-blur shadow-xl mb-6">
                <CardHeader className="pb-3">
                   <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Search Guests
                   </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                   <div className="relative">
                      <Input
                          type="text"
                          placeholder="Type to search by name or catch phrase..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10 text-gray-900"
                      />
                      {searchQuery && (
                          <Button
                              onClick={() => setSearchQuery('')}
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                          >
                             <X className="h-4 w-4" />
                          </Button>
                      )}
                   </div>
                   {searchQuery && (
                       <p className="mt-2 text-sm text-gray-600">
                          Found {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''} matching "{searchQuery}"
                       </p>
                   )}
                </CardContent>
             </Card>

             {/* Guests Grid */}
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredGuests.map((guest) => {
                   const gameToCheck = selectedGame || assignedGame?.id || '';
                   const hasPlayed = gameToCheck ? hasPlayedGame(guest.id, gameToCheck) : false;
                   const gamePoints = gameToCheck ? getGamePoints(guest.id, gameToCheck) : undefined;
                   const gamesPlayed = getGamesPlayedCount(guest.id);
                   const canManage = gameToCheck && canManageGame(gameToCheck);

                   return (
                       <Card
                           key={guest.id}
                           className={`backdrop-blur shadow-xl transition-all ${
                               hasPlayed
                                   ? 'bg-gray-100/90 opacity-75'
                                   : canManage
                                       ? 'bg-white/95 hover:scale-105'
                                       : 'bg-gray-50/90 opacity-60'
                           }`}
                       >
                          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 -m-[1px] rounded-t-lg">
                             <CardTitle className="text-white flex items-center justify-between">
                                <span className="text-lg">{guest.name}</span>
                                <div className="flex items-center gap-2">
                                   <Trophy className="w-4 h-4" />
                                   <span className="text-2xl">{guest.points}</span>
                                </div>
                             </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                             <p className="text-sm text-gray-600 italic mb-3">
                                "{guest.catch_phrase}"
                             </p>

                             {/* Games played indicator */}
                             <div className="mb-3 flex items-center gap-2">
                                <span className="text-sm text-gray-600">Games played:</span>
                                <div className="flex gap-1">
                                   {games.map(game => {
                                      const played = hasPlayedGame(guest.id, game.id);
                                      return (
                                          <span
                                              key={game.id}
                                              className={`text-lg ${played ? '' : 'opacity-30 grayscale'}`}
                                              title={`${game.name}: ${played ? 'Played' : 'Not played'}`}
                                          >
                                          {getGameIcon(game.name)}
                                       </span>
                                      );
                                   })}
                                </div>
                                <Badge variant="outline" className="ml-auto">
                                   {gamesPlayed}/4
                                </Badge>
                             </div>

                             {/* THE MAIN LOGIC FOR PLAYED/NOT PLAYED GAMES */}
                             {!canManage ? (
                                 <div className="bg-gray-100 rounded-lg p-3 text-center">
                                    <Lock className="w-5 h-5 text-gray-500 inline mr-2" />
                                    <span className="text-gray-600 text-sm">
                                    Select your assigned game
                                 </span>
                                 </div>
                             ) : hasPlayed ? (
                                 // FOR GAMES ALREADY PLAYED - THIS IS THE KEY PART
                                 editingGuest === guest.id ? (
                                     // EDIT MODE - User clicked "Re-enter Score"
                                     <div className="space-y-2">
                                        <div className="bg-yellow-100 rounded-lg p-2 text-center">
                                           <Edit2 className="w-4 h-4 text-yellow-600 inline mr-2" />
                                           <span className="text-sm text-yellow-700 font-semibold">
                                          Re-entering score for {games.find(g => g.id === gameToCheck)?.name}
                                       </span>
                                           <div className="text-xs text-gray-600 mt-1">
                                              Current: {gamePoints} points
                                           </div>
                                        </div>
                                        <div className="flex gap-2">
                                           <Input
                                               type="number"
                                               placeholder="New score"
                                               value={editPoints[guest.id] || ''}
                                               onChange={(e) => setEditPoints({
                                                  ...editPoints,
                                                  [guest.id]: e.target.value
                                               })}
                                               className="flex-1 text-gray-900"
                                               min="1"
                                               autoFocus
                                           />
                                           <Button
                                               onClick={() => updatePoints(guest.id)}
                                               disabled={!editPoints[guest.id] || awardingPoints === guest.id}
                                               className="bg-green-500 hover:bg-green-600 text-white"
                                           >
                                              {awardingPoints === guest.id ? (
                                                  <Sparkles className="w-4 h-4 animate-spin" />
                                              ) : (
                                                  <>
                                                     <Save className="w-4 h-4 mr-1" />
                                                     Save
                                                  </>
                                              )}
                                           </Button>
                                           <Button
                                               onClick={() => {
                                                  setEditingGuest(null);
                                                  setEditPoints({ ...editPoints, [guest.id]: '' });
                                               }}
                                               variant="outline"
                                               size="icon"
                                           >
                                              <X className="w-4 h-4" />
                                           </Button>
                                        </div>
                                     </div>
                                 ) : (
                                     // NORMAL MODE - Shows score and THE RE-ENTER SCORE BUTTON
                                     <div className="space-y-2">
                                        <div className="bg-gray-100 rounded-lg p-3 text-center">
                                           <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
                                           <span className="text-gray-700 font-semibold">
                                          Already played {games.find(g => g.id === gameToCheck)?.name}
                                       </span>
                                           <div className="text-sm text-gray-600 mt-1">
                                              Scored: {gamePoints} points
                                           </div>
                                        </div>
                                        {/* HERE IS THE RE-ENTER SCORE BUTTON */}
                                        <Button
                                            onClick={() => {
                                               setEditingGuest(guest.id);
                                               setEditPoints({ ...editPoints, [guest.id]: '' });
                                            }}
                                            variant="outline"
                                            className="w-full"
                                        >
                                           <Edit2 className="w-4 h-4 mr-2" />
                                           Re-enter Score
                                        </Button>
                                     </div>
                                 )
                             ) : (
                                 // Game not played yet - show normal award points input
                                 <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Points"
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
                             )}

                             {/* Success animation */}
                             {awardingPoints === guest.id && (
                                 <div className="mt-2 text-center font-bold animate-bounce">
                                    {editingGuest === guest.id ? (
                                        <span className="text-blue-600">Updated to {editPoints[guest.id]} Points! ✏️</span>
                                    ) : (
                                        <span className="text-green-600">+{pointsToAward[guest.id]} Points! 🎉</span>
                                    )}
                                 </div>
                             )}
                          </CardContent>
                       </Card>
                   );
                })}
             </div>

             {/* No search results message */}
             {searchQuery && filteredGuests.length === 0 && (
                 <Card className="bg-white/95 backdrop-blur">
                    <CardContent className="text-center py-8">
                       <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                       <p className="text-xl text-gray-600">
                          No guests found matching "{searchQuery}"
                       </p>
                       <Button
                           onClick={() => setSearchQuery('')}
                           variant="outline"
                           className="mt-4"
                       >
                          Clear Search
                       </Button>
                    </CardContent>
                 </Card>
             )}

             {guests.length === 0 && !searchQuery && (
                 <Card className="bg-white/95 backdrop-blur">
                    <CardContent className="text-center py-8">
                       <p className="text-xl text-gray-600">
                          No players yet! Wait for guests to join the carnival! 🎟️
                       </p>
                    </CardContent>
                 </Card>
             )}

             {/* Footer */}
             <div className="mt-8 text-center text-white">
                {assignedGame && !isSuperAdmin ? (
                    <p className="text-lg font-semibold">
                       <Target className="inline w-6 h-6 mr-2" />
                       You're managing {assignedGame.name} - Award points to players!
                    </p>
                ) : (
                    <p className="text-lg font-semibold">
                       <Coins className="inline w-6 h-6 mr-2" />
                       {isSuperAdmin ? 'Super Admin Mode - Manage all games!' : 'Select a game above, then award points to players!'}
                    </p>
                )}
             </div>
          </div>
       </div>
   );
}