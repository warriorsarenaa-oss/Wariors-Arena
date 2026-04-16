import { ReactNode } from 'react';

export const metadata = {
  title: 'FAQ | Warriors Arena',
  description: 'Frequently asked questions about Warriors Arena laser tag and gel blasters sessions in Heliopolis, Cairo. Pricing, cancellation, park fees and more.',
  openGraph: {
    title: 'FAQ | Warriors Arena',
    description: 'Everything you need to know before booking at Warriors Arena, Heliopolis Cairo.',
    type: 'website',
  },
};

export default function FaqLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
