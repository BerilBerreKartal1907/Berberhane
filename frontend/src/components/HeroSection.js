import { motion } from "framer-motion";
import { Scissors, CalendarCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/context/BookingContext";

const HeroSection = () => {
  const { openBooking } = useBooking();

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-testid="hero-section"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/hero-bg.png')`,
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
            <Scissors className="text-[#D97706]" size={18} weight="duotone" />
            <span className="text-xs sm:text-sm font-manrope uppercase tracking-[0.2em] text-[#A3A3A3]">
              Gölcük'ün En İyi Erkek Kuaförü
            </span>
          </div>

          {/* Title */}
          <h1 className="font-oswald text-5xl sm:text-6xl lg:text-8xl font-bold uppercase tracking-tighter text-white mb-6">
            BERBERHANE
          </h1>

          {/* Subtitle */}
          <p className="font-manrope text-lg sm:text-xl text-[#A3A3A3] mb-10 max-w-2xl mx-auto leading-relaxed">
            Profesyonel erkek kuaförlüğünün en iyi adresi. Modern tarz, klasik ustalık.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => openBooking()}
              className="w-full sm:w-auto bg-[#D97706] hover:bg-[#B45309] text-white font-oswald text-lg uppercase tracking-wider px-10 py-7 btn-primary"
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
              className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent border border-[#262626] text-white hover:bg-[#171717] font-oswald text-lg uppercase tracking-wider px-10 py-[1.625rem] transition-colors"
              data-testid="hero-services-link"
            >
              Hizmetlerimiz
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-1.5 bg-[#D97706] rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;