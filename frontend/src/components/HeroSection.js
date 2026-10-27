import { motion } from "framer-motion";
import { CalendarCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/context/BookingContext";

const HeroSection = () => {
  const { openBooking } = useBooking();

  return (
    <section
      className="relative min-h-screen flex items-end justify-center overflow-hidden"
      data-testid="hero-section"
    >
      {/* Background Image: dükkânın gerçek fotoğrafı, neon tabela başlık görevi görüyor */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url('/hero-bg.jpg')`,
          // Neon tabela yatayda ortada, dikeyde üst kısımda duruyor;
          // telefonda dikey ekranda kırpılırken tabela görünür kalsın diye
          backgroundPosition: "52% 35%",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Content: tabelanın önünü kapatmasın diye ekranın alt kısmında */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto pb-20 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Başlık arama motorları ve ekran okuyucular için; görsel başlık neon tabela */}
          <h1 className="sr-only">BERBERHANE - Gölcük Erkek Kuaförü</h1>

          {/* Subtitle */}
          <p className="font-manrope text-lg sm:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Bir kere gelen, bir daha gelir.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => openBooking()}
              className="w-full sm:w-auto h-14 sm:h-16 bg-[#D97706] hover:bg-[#B45309] text-white font-oswald text-lg uppercase tracking-wider px-10 btn-primary"
              data-testid="hero-cta-randevu-al"
            >
              <CalendarCheck size={24} weight="duotone" className="mr-2" />
              Randevu Al
            </Button>
            <a
              href="#hizmetler"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#hizmetler")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto h-14 sm:h-16 inline-flex items-center justify-center bg-black/30 border border-white/40 text-white hover:bg-black/50 hover:border-white/70 font-oswald text-lg uppercase tracking-wider px-10 rounded-md transition-colors"
              data-testid="hero-services-link"
            >
              Hizmetlerimiz
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;