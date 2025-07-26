import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} bg-background min-h-screen`}>
      {children}
    </div>
  );
} 