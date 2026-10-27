import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CaretDown, CaretUp } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/context/BookingContext";

const VISIBLE_COUNT = 9;

const ServicesSection = ({ services }) => {
  const { openBooking } = useBooking();
  const [showAll, setShowAll] = useState(false);

  const displayedServices = showAll ? services : services.slice(0, VISIBLE_COUNT);

  return (
    <section
      id="hizmetler"
      className="py-24 sm:py-32 px-4 sm:px-6 bg-[#0A0A0A] relative"
      data-testid="services-section"
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url('/services-bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-oswald text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white">
            Hizmetlerimiz
          </h2>
        </motion.div>

        {/* Services List */}
        <div className="space-y-0 border-t border-[#262626]">
          {displayedServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="service-card border-b border-[#262626] py-6 sm:py-8 px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group cursor-pointer"
              onClick={() => openBooking(service)}
              data-testid={`service-card-${service.id}`}
            >
              <div className="flex-1">
                <h3 className="font-oswald text-xl sm:text-2xl uppercase tracking-tight text-white group-hover:text-[#D97706] transition-colors">
                  {service.name}
                </h3>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto">
                <Button
                  className="bg-transparent border border-[#262626] text-white hover:bg-[#D97706] hover:border-[#D97706] font-oswald uppercase tracking-wider px-4 py-2 text-sm group-hover:bg-[#D97706] group-hover:border-[#D97706] transition-all"
                  data-testid={`service-book-btn-${service.id}`}
                >
                  <span className="hidden sm:inline mr-2">Seç</span>
                  <ArrowRight size={18} weight="bold" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tüm Hizmetleri Gör / Daha Az Göster */}
        {services.length > VISIBLE_COUNT && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="bg-transparent border border-[#262626] text-white hover:bg-[#171717] hover:border-[#D97706] font-manrope"
              data-testid="toggle-all-services-btn"
            >
              {showAll ? (
                <>
                  Daha Az Göster
                  <CaretUp size={18} className="ml-2" />
                </>
              ) : (
                <>
                  Tüm Hizmetleri Gör ({services.length})
                  <CaretDown size={18} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Button
            onClick={() => openBooking()}
            className="bg-[#D97706] hover:bg-[#B45309] text-white font-oswald text-base uppercase tracking-wider px-8 py-6"
            data-testid="services-cta-randevu-al"
          >
            Hemen Randevu Al
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;