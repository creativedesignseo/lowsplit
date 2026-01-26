import { Link } from 'react-router-dom'
import { Check, Shield, Star, ArrowRight, Play, Music, Tv } from 'lucide-react'

const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-background">
            
            {/* Background Atmosphere */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    
                    {/* LEFTSIDE: Content */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                        
                        {/* Trust Pill */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-slate-200 backdrop-blur-sm shadow-sm animate-fade-in">
                            <div className="flex -space-x-2">
                                <div className="w-5 h-5 rounded-full bg-indigo-500 border border-background" />
                                <div className="w-5 h-5 rounded-full bg-purple-500 border border-background" />
                                <div className="w-5 h-5 rounded-full bg-teal-500 border border-background" />
                            </div>
                            <span className="text-xs font-semibold text-muted">
                                <span className="text-primary font-bold">+5,000</span> usuarios ahorrando
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-text-main leading-[1.1] tracking-tight">
                            Tus suscripciones <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-teal-400">
                                a precio de amigo
                            </span>
                        </h1>

                        <p className="text-lg text-text-body max-w-xl leading-relaxed">
                            Accede a Netflix, Spotify y más servicios premium pagando solo una fracción del costo real. <span className="text-text-main font-medium">100% Legal y Seguro.</span>
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <Link 
                                to="/explore" 
                                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-text-main font-bold rounded-2xl transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                Empezar a Ahorrar
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        {/* Features/Trust */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted">
                                <Shield className="w-4 h-4 text-primary" />
                                Garantía de reembolso
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-muted">
                                <Check className="w-4 h-4 text-primary" />
                                Activación inmediata
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-muted">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                4.9/5 Valoración
                            </div>
                        </div>
                    </div>

                    {/* RIGHTSIDE: Visuals (Floating Cards) */}
                    <div className="relative h-[500px] w-full hidden lg:block perspective-[2000px]">
                        
                        {/* Floating Container */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            
                            {/* Main Card (Netflix) */}
                            <div className="absolute z-20 w-[320px] bg-surface/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-2xl transform rotate-[-6deg] translate-y-[-20px] animate-pulse-slow">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-red-600 font-bold border border-white/10">
                                        <span className="text-2xl">N</span>
                                    </div>
                                    <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full">Activo</span>
                                </div>
                                <div className="space-y-4 mb-6">
                                    <div className="h-2 w-24 bg-red-600/10 rounded-full" />
                                    <div className="h-8 w-full bg-slate-50 rounded-lg flex items-center justify-between px-3">
                                        <span className="text-muted text-xs">Ahorro mensual</span>
                                        <span className="text-text-main font-bold text-sm">-$12.50</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                    <div className="flex -space-x-2">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-300 border-2 border-surface" />
                                        ))}
                                    </div>
                                    <span className="text-xs text-muted font-medium">+2 amigos</span>
                                </div>
                            </div>

                            {/* Secondary Card (Spotify) */}
                            <div className="absolute z-10 w-[280px] bg-surface/80 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-xl transform rotate-[6deg] translate-x-[40px] translate-y-[60px]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-[#1db954] flex items-center justify-center text-black">
                                        <Music className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="h-2 w-20 bg-slate-200 rounded-full mb-1" />
                                        <div className="h-2 w-12 bg-slate-100 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 rounded-xl p-3">
                                    <span className="text-xs text-muted">Tu parte</span>
                                    <span className="text-primary font-bold">$2.50</span>
                                </div>
                            </div>

                            {/* Floating Elements (Decorations) */}
                            <div className="absolute top-10 right-10 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl rotate-12 blur-sm opacity-50 z-0 animate-bounce" />
                            <div className="absolute bottom-20 left-10 w-20 h-20 bg-gradient-to-br from-primary to-teal-600 rounded-full blur-2xl opacity-20 z-0" />

                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default Hero
