"use client";

import { useTranslations } from 'next-intl';
import { AnimatePresence } from 'framer-motion';
import { BookingProvider, useBooking } from '../../../components/booking/BookingContext';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import StepIndicator from '../../../components/booking/StepIndicator';
import Step1GameSelect from '../../../components/booking/Step1GameSelect';
import Step2Calendar from '../../../components/booking/Step2Calendar';
import Step3PlayerInfo from '../../../components/booking/Step3PlayerInfo';
import Step5Confirm from '../../../components/booking/Step5Confirm';

function BookingWizard() {
  const { state } = useBooking();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      <StepIndicator />
      
      <div className="w-full relative overflow-visible mt-4">
        <AnimatePresence mode="wait" custom={state.direction}>
          {state.step === 1 && <Step1GameSelect key="step1" />}
          {state.step === 2 && <Step2Calendar key="step2" />}
          {state.step === 3 && <Step3PlayerInfo key="step3" />}
          {state.step === 5 && <Step5Confirm key="step5" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24 px-6 lg:px-8 bg-[#0A0A0F] overflow-x-hidden">
        <BookingProvider>
          <BookingWizard />
        </BookingProvider>
      </main>
      <Footer />
    </>
  );
}
