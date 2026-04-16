import { ReactNode } from 'react';

export const metadata = {
  title: 'Book Your Session | Warriors Arena',
  description: 'Choose your game, pick your time slot, and get instant booking confirmation at Warriors Arena Heliopolis Cairo.',
  openGraph: {
    title: 'Book Your Session | Warriors Arena',
    description: 'Real-time slot booking for Laser Tag and Gel Blasters in Heliopolis, Cairo.',
    type: 'website',
  },
};

export default function BookLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
