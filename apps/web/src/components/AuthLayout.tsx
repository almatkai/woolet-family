import { motion } from 'framer-motion';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Rectangles } from './ui/rectangles';
import { HeroBackground } from './ui/HeroBackground';
import { useTheme } from './theme-provider';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const { theme, setTheme } = useTheme();

    return (
        <div className="min-h-dvh w-full flex bg-background">
            <div
                role="group"
                aria-label="Theme switcher"
                className="absolute right-5 top-5 z-30 flex items-center gap-1 rounded-full border border-border/80 bg-card/85 p-1 shadow-lg backdrop-blur-xl"
            >
                <button
                    type="button"
                    aria-label="Use light theme"
                    aria-pressed={theme === 'light'}
                    title="Light theme"
                    onClick={() => setTheme('light')}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${theme === 'light'
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                >
                    <Sun className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    aria-label="Use dark theme"
                    aria-pressed={theme === 'dark'}
                    title="Dark theme"
                    onClick={() => setTheme('dark')}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${theme === 'dark'
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                >
                    <Moon className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    aria-label="Use system theme"
                    aria-pressed={theme === 'system'}
                    title="System theme"
                    onClick={() => setTheme('system')}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${theme === 'system'
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                >
                    <Monitor className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    aria-label="Use OLED theme"
                    aria-pressed={theme === 'super-dark'}
                    title="OLED theme"
                    onClick={() => setTheme('super-dark')}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${theme === 'super-dark'
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                >
                    <span className="relative inline-flex h-4 w-4 items-center justify-center">
                        <Moon className="h-4 w-4" />
                        <span className="absolute -right-1 -top-1 text-[10px] font-bold leading-none">+</span>
                    </span>
                </button>
            </div>

            {/* Left side - Hero Background animation showcase */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background">
                {/* Hero Background */}
                <HeroBackground />

                {/* Content - centered */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
                    {/* Logo with Glow */}
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full scale-150 group-hover:bg-primary/25 transition-all duration-500" />
                            <img
                                src="/android-chrome-192x192.png"
                                alt="Woolet"
                                className="relative w-28 h-28 rounded-3xl shadow-2xl border border-border/70"
                            />
                        </div>
                    </motion.div>

                    <motion.h1
                        className="text-6xl font-bold text-foreground mb-4 text-center tracking-tight"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        W<span className="text-[#8B5CF6]">oo</span>let
                    </motion.h1>

                    <motion.p
                        className="text-2xl text-muted-foreground text-center max-w-lg mb-12 font-medium"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Your all-in-one personal finance manager
                    </motion.p>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-1 sm:p-6 lg:p-12 relative bg-background overflow-hidden">
                {/* Hero Background on mobile - showing the right side */}
                <HeroBackground className="lg:hidden absolute inset-0 -right-[100%] sm:-right-[50%] md:-right-[25%]" />

                {/* Mobile-only header */}
                <div className="absolute top-6 left-6 lg:hidden">
                    <div className="flex items-center gap-3">
                        <img
                            src="/android-chrome-192x192.png"
                            alt="Woolet"
                            className="w-10 h-10 rounded-xl"
                        />
                        <span className="text-xl font-bold text-foreground">Woolet</span>
                    </div>
                </div>

                <motion.div
                    className="relative z-10 w-full max-w-md mt-16 lg:mt-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Form header */}
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
                        <p className="text-muted-foreground">{subtitle}</p>
                    </div>

                    {/* Form container */}
                    <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-border/80 shadow-2xl">
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <a
                            href="/"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 inline-flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to home
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default AuthLayout;
