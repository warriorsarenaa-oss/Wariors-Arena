import Navbar from '../../components/layout/Navbar';
import Hero from '../../components/layout/Hero';
import GamesSection from '../../components/ui/GamesSection';
import HowItWorksSection from '../../components/ui/HowItWorksSection';
import ImportantNoticeSection from '../../components/ui/ImportantNoticeSection';
import Footer from '../../components/layout/Footer';
import dynamic from 'next/dynamic';

const LocationSection = dynamic(
  () => import('../../components/ui/LocationSection'),
  { 
    loading: () => (
      <div style={{ 
        height: '400px', 
        backgroundColor: '#13131A',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#A0A0B8',
        fontSize: '14px'
      }}>
        Loading map...
      </div>
    )
  }
);

export const metadata = {
  title: 'Warriors Arena | Laser Tag & Gel Blasters — Heliopolis, Cairo',
  description: 'Book your Laser Tag or Gel Blasters session online at Warriors Arena, Heliopolis Cairo. Real-time slot booking, instant confirmation.',
  openGraph: {
    title: 'Warriors Arena | Laser Tag & Gel Blasters',
    description: 'Book your session online — Warriors Arena, Heliopolis Cairo',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="w-full overflow-hidden flex flex-col">
        <Hero />
        <GamesSection />
        <HowItWorksSection />
        <ImportantNoticeSection />
        <LocationSection />
      </main>
      <Footer />
    </>
  );
}
