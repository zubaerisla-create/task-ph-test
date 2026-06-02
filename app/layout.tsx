import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './_components/ThemeProvider';

export const metadata: Metadata = {
  title: 'CollabFlow — Smart Project & Task Management',
  description:
    'A premium team collaboration platform for managing projects, tasks, and team productivity with real-time insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
