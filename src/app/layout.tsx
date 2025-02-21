import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '../../providers/theme.provider';

const lexend = Lexend({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={cn(lexend.className, 'antialiased min-h-screen pt-16')}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
