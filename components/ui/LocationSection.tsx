import { useTranslations } from "next-intl";

export default function LocationSection() {
  const tHome = useTranslations("home");

  return (
    <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-widest mb-4">
          {tHome("location")}
        </h2>
        <p className="text-[#A0A0B8] text-lg uppercase tracking-wider">
          {tHome("address")}
        </p>
      </div>

      <div className="w-full h-[400px] rounded-[16px] overflow-hidden border border-[#1E1E2E] shadow-xl relative z-10">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13814.284305886475!2d31.258752250000003!3d30.0491763!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1458409fbe7cfa1f%3A0xc6cbfa8467d022b3!2sAl-Azhar%20Park!5e0!3m2!1sen!2seg!4v1700000000000!5m2!1sen!2seg" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen={true} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="mt-12 text-center">
        <a 
          href="https://goo.gl/maps/AzharPark" 
          target="_blank" 
          rel="noreferrer"
          className="btn-secondary uppercase text-sm tracking-wider"
        >
          {tHome("getDirections")}
        </a>
      </div>
    </section>
  );
}
