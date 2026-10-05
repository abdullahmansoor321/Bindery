"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/workspace");
    router.refresh();
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex w-full bg-[#FAF8F5]">
      {/* Left Editorial Brand Showcase with Real Figma Bookbinding Background Image */}
      <div className="hidden lg:flex lg:w-[540px] xl:w-[580px] relative p-16 flex-col justify-between overflow-hidden text-[#FAF8F5] select-none shrink-0">
        {/* Figma Background Image (Files bound with ropes) */}
        <Image
          src="/images/auth-login-bg.png"
          alt="Bindery Bookbinding Archive"
          fill
          priority
          sizes="(min-width: 1280px) 580px, 540px"
          className="object-cover object-center"
        />

        {/* Figma Gradient Overlay: linear-gradient(135deg, rgba(11, 28, 20, 0.88) 0%, rgba(20, 51, 37, 0.95) 70%, rgba(5, 12, 7, 0.98) 100%) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(11, 28, 20, 0.88) 0%, rgba(20, 51, 37, 0.95) 70%, rgba(5, 12, 7, 0.98) 100%)",
          }}
        />

        {/* Top Logo */}
        <div className="relative z-10">
          <Logo variant="inverted" size="lg" />
        </div>

        {/* Center Editorial Quote from Figma */}
        <div className="relative z-10 space-y-4 max-w-md">
          <h2 className="font-serif text-3xl xl:text-4xl leading-[1.15] font-semibold text-[#FAF8F5]">
            Cultivate your collective intelligence
          </h2>
          <p className="text-sm xl:text-base leading-relaxed text-[#FAF8F5]/80 font-sans">
            An institutional archive built for modern teams. Secure, editorial, and deeply search-optimized.
          </p>
        </div>

        {/* Footer Copyright */}
        <div className="relative z-10">
          <p className="text-[11px] text-[#FAF8F5]/50 font-mono tracking-wider">
            © {new Date().getFullYear()} BINDERY INC. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center pb-2">
            <Logo size="md" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1F2421]">
              Welcome back
            </h1>
            <p className="text-sm text-[#6B6E6B] leading-relaxed">
              Enter your credentials to access your workspaces.
            </p>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium leading-relaxed">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign in to Bindery
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#EAE5DC]" />
            <span className="bg-[#FAF8F5] px-3 text-xs uppercase tracking-wider text-[#A3AAA3] absolute font-medium">
              or continue with
            </span>
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-[#F8F6F1]"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              }
            >
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              disabled
              className="w-full bg-white opacity-70 cursor-not-allowed"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.65-.79 1.09-1.89.97-2.99-1 .04-2.22.67-2.92 1.49-.61.71-1.15 1.83-1.01 2.92 1.13.09 2.28-.59 2.96-1.42z" />
                </svg>
              }
            >
              Apple
            </Button>
          </div>

          {/* Footer Registration Link */}
          <p className="text-center text-xs text-[#6B6E6B]">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#143325] hover:underline underline-offset-4"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}