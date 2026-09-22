import type { Metadata } from 'next';
import './globals.css';
import { AppStateProvider } from '@/context/AppStateContext';
import TopNav from '@/components/TopNav/TopNav';

export const metadata: Metadata = {
  title: 'Knee AI Assist — Orthopaedic MRI Review',
  description: 'Clinical AI-assisted knee MRI review tool for orthopaedic doctors. Powered by ResNet-34 5-fold ensemble with per-slice probability analysis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppStateProvider>
          <TopNav />
          {children}
        </AppStateProvider>
      </body>
    </html>
  );
}
