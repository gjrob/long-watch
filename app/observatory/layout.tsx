import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Observatory — Long Watch',
  description: 'The Long Watch long-duration verification prototype and its live observation record.',
};

export default function ObservatoryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
