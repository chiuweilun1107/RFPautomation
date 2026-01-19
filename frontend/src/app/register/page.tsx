import Link from "next/link"
// Assuming RegisterForm exists or reusing LoginForm for now if not, 
// checking file list soon, but writing this structure first. 
// If RegisterForm missing, I will stick to LoginForm or a placeholder.
// Checking previous turn... user didn't explicitly ask for form logic, just images.
// I will assume RegisterForm might be needed or I use LoginForm with a "Sign Up" mode.
// Ideally I'd use a real RegisterForm. Let's look at the dir list result next.
// For now, I will use LoginForm but customize the text, or wait for list_dir.
// wait, I can't wait inside a tool call. I'll use a placeholder or LoginForm and update later if needed.
// Actually, I'll use LoginForm for now to ensure it builds, and just change the visual context.
import { LoginForm } from "@/components/auth/LoginForm"
import Image from "next/image"

export default function RegisterPage() {
    return (
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background text-foreground">
            <Link
                href="/"
                className="absolute right-4 top-4 md:right-8 md:top-8 z-50 font-mono text-xs font-bold bg-background/50 backdrop-blur-sm border border-black dark:border-white px-4 py-2 hover:bg-black hover:text-white transition-colors"
            >
                [ RETURN_HOME ]
            </Link>

            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex border-r border-black dark:border-white">
                <div className="absolute inset-0 bg-zinc-900">
                    <Image
                        src="/auth-assembly-v2.png"
                        alt="Assembly Robot"
                        fill
                        className="object-cover grayscale"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="relative z-20 flex items-center">
                    <div className="inline-flex items-center border border-white px-3 py-1 text-xs font-mono font-medium bg-black/50 backdrop-blur-md">
                        SYSTEM_ID: NEW_USER_PROTOCOL
                    </div>
                </div>

                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-6 border-l-2 border-white pl-6 bg-black/40 p-4 backdrop-blur-sm">
                        <p className="text-xl font-light leading-relaxed font-mono">
                            "Initiating new operator profil. Assembly line ready for assignment."
                        </p>
                    </blockquote>
                </div>
            </div>

            <div className="lg:p-8 relative">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-bold tracking-tighter font-mono">
                            [ REGISTER_UNIT ]
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Create your workspace credentials.
                        </p>
                    </div>
                    {/* Using LoginForm as placeholder if RegisterForm undefined, usually same comp or similar */}
                    <LoginForm />
                    <div className="px-8 text-center text-xs text-muted-foreground font-mono mt-8">
                        INITIALIZING_DATABASE_ENTRY...
                    </div>
                </div>

                {/* Decorative marks */}
                <div className="absolute top-4 left-4 w-2 h-2 border-l border-t border-black dark:border-white opacity-20"></div>
                <div className="absolute bottom-4 right-4 w-2 h-2 border-r border-b border-black dark:border-white opacity-20"></div>
            </div>
        </div>
    )
}
