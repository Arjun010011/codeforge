import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import { ThemeInitializer } from '@/components/ui/ThemeInitializer';
import AuthSync from '@/components/auth/AuthSync';

export const metadata: Metadata = {
  title: 'TypeForge — Typing Reimagined',
  description:
    'A MonkeyType-quality typing test with KeyBr-style adaptive lessons. Practice typing, learn touch typing, and track your progress.',
  keywords: ['typing test', 'typing practice', 'touch typing', 'typing lessons', 'wpm'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="dark" suppressHydrationWarning>
        <body>
          <ThemeInitializer />
          <AuthSync />
          <Navbar />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
