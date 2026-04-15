import Navbar from '../../components/layout/Navbar';
import Hero from '../../components/layout/Hero';
import GamesSection from '../../components/ui/GamesSection';
import HowItWorksSection from '../../components/ui/HowItWorksSection';
import ImportantNoticeSection from '../../components/ui/ImportantNoticeSection';
import LocationSection from '../../components/ui/LocationSection';
import Footer from '../../components/layout/Footer';

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
