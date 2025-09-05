'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {GamepadIcon, PartyPopper, Sparkles, Trophy} from 'lucide-react';

export default function WelcomePage() {
    const [showConfetti, setShowConfetti] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Hide confetti after 3 seconds
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4 relative overflow-hidden">
            {/* Animated confetti */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        >
                            {['🎊', '🎉', '🎈', '🎪', '⭐'][Math.floor(Math.random() * 5)]}
                        </div>
                    ))}
                </div>
            )}

            <div className="max-w-2xl mx-auto pt-20">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <PartyPopper className="w-20 h-20 text-yellow-300 mx-auto mb-4 animate-bounce"/>
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Welcome to HANIVAL!
                    </h1>
                    <p className="text-2xl text-white/90">
                        You're officially part of the carnival! 🎊
                    </p>
                </div>

                {/* Welcome Card */}
                <Card className="bg-white/95 backdrop-blur shadow-2xl border-4 border-yellow-400 mb-6">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 -m-[2px] rounded-t-lg">
                        <CardTitle className="text-center text-2xl text-white">
                            🎯 Ready to Play? 🎯
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 text-center">
                        <div className="space-y-4 mb-6">
                            <div className="bg-purple-50 rounded-lg p-4">
                                <GamepadIcon className="w-8 h-8 text-purple-600 mx-auto mb-2"/>
                                <h3 className="font-bold text-lg text-gray-800 mb-1">Find the Game Booths!</h3>
                                <p className="text-gray-600">
                                    Visit our 4 exciting carnival games around the party
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4">
                                <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2"/>
                                <h3 className="font-bold text-lg text-gray-800 mb-1">Win Points!</h3>
                                <p className="text-gray-600">
                                    You may play every game once, and whichever you like best a second time.
                                </p>
                            </div>

                            <div className="bg-yellow-50 rounded-lg p-4">
                                <Sparkles className="w-8 h-8 text-yellow-600 mx-auto mb-2"/>
                                <h3 className="font-bold text-lg text-gray-800 mb-1">Become a Champion!</h3>
                                <p className="text-gray-600">
                                    Win prizes in every game — and compete for the grand prize as overall games champion
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 mb-6">
                            <h3 className="font-bold text-lg mb-2">🎮 The Games:</h3>
                            <div className="grid grid-cols-2 gap-2 text-lg">
                                <div>🎯 Ring Toss</div>
                                <div>🦆 Duck Hunt</div>
                                <div>🎲 Plinko</div>
                                <div>🎈 Balloon Darts</div>
                            </div>
                        </div>


                    </CardContent>
                </Card>

                {/* Fun footer */}
                <div className="text-center text-white">
                    <p className="text-xl font-semibold animate-pulse">
                        🎠 Let the games begin! 🎡
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes fall {
                    0% {
                        transform: translateY(-100vh) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }

                .animate-fall {
                    animation: fall linear forwards;
                }
            `}</style>
        </div>
    );
}