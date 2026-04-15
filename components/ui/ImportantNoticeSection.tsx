import { useTranslations } from "next-intl";

export default function ImportantNoticeSection() {
  const tHome = useTranslations("home");
  const tBooking = useTranslations("booking");

  return (
    <section className="py-20 w-full bg-[#3B280B]">
      <div className="max-w-4xl mx-auto px-6 text-center text-[#FCD34D]">
        <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-widest mb-6">
          {tHome("importantNotice")}
        </h2>
        <div className="flex flex-col gap-4 text-base md:text-lg">
          <p className="font-semibold">{tBooking("parkFeeNotice")}</p>
          <p>{tBooking("cancellationNotice")}</p>
          <p className="font-black text-white mt-4">{tBooking("placeholderPhone")}</p>
        </div>
      </div>
    </section>
  );
}
