import { motion } from "framer-motion";
import { MapPin, Phone, Clock, WhatsappLogo } from "@phosphor-icons/react";

const ContactSection = ({ settings }) => {
  const workingHours = settings?.working_hours || [];

  return (
    <section
      id="iletisim"
      className="py-24 sm:py-32 px-4 sm:px-6 bg-[#171717]"
      data-testid="contact-section"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-oswald text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white">
            İletişim
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Address */}
            <div className="flex items-start gap-4" data-testid="contact-address">
              <div className="w-12 h-12 bg-[#D97706]/10 border border-[#D97706]/20 rounded-sm flex items-center justify-center flex-shrink-0">
                <MapPin size={24} weight="duotone" className="text-[#D97706]" />
              </div>
              <div>
                <h3 className="font-oswald text-xl uppercase tracking-tight text-white mb-2">
                  Adres
                </h3>
                <p className="font-manrope text-[#A3A3A3] leading-relaxed">
                  {settings?.address || "Dumlupınar, 19 Mayıs Cd. No:87 D:b, 41100 Gölcük/Kocaeli, Türkiye"}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4" data-testid="contact-phone">
              <div className="w-12 h-12 bg-[#D97706]/10 border border-[#D97706]/20 rounded-sm flex items-center justify-center flex-shrink-0">
                <Phone size={24} weight="duotone" className="text-[#D97706]" />
              </div>
              <div>
                <h3 className="font-oswald text-xl uppercase tracking-tight text-white mb-2">
                  Telefon
                </h3>
                <a
                  href={`tel:${(settings?.phone || "+905551234567").replace(/\s/g, "")}`}
                  className="font-manrope text-[#A3A3A3] hover:text-[#D97706] transition-colors"
                >
                  {settings?.phone || "+90 555 123 4567"}
                </a>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start gap-4" data-testid="contact-whatsapp">
              <div className="w-12 h-12 bg-[#25D366]/10 border border-[#25D366]/20 rounded-sm flex items-center justify-center flex-shrink-0">
                <WhatsappLogo size={24} weight="duotone" className="text-[#25D366]" />
              </div>
              <div>
                <h3 className="font-oswald text-xl uppercase tracking-tight text-white mb-2">
                  WhatsApp
                </h3>
                <a
                  href={`https://wa.me/${(settings?.whatsapp || "+905551234567").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-manrope text-[#A3A3A3] hover:text-[#25D366] transition-colors"
                >
                  Mesaj Gönder
                </a>
              </div>
            </div>

            {/* Working Hours */}
            <div className="flex items-start gap-4" data-testid="contact-hours">
              <div className="w-12 h-12 bg-[#D97706]/10 border border-[#D97706]/20 rounded-sm flex items-center justify-center flex-shrink-0">
                <Clock size={24} weight="duotone" className="text-[#D97706]" />
              </div>
              <div className="flex-1">
                <h3 className="font-oswald text-xl uppercase tracking-tight text-white mb-4">
                  Çalışma Saatleri
                </h3>
                <div className="space-y-2">
                  {workingHours.map((day) => (
                    <div
                      key={day.day}
                      className="flex justify-between font-manrope text-sm"
                    >
                      <span className="text-[#A3A3A3]">{day.day_name}</span>
                      <span className={day.is_open ? "text-white" : "text-red-400"}>
                        {day.is_open
                          ? `${day.open_time} - ${day.close_time}`
                          : "Kapalı"}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#666] font-manrope mt-3 italic">
                  Saatlerimizin güncel hali burada gösterilir.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            <div
              className="h-[400px] lg:h-full min-h-[350px] rounded-sm overflow-hidden border border-[#262626]"
              data-testid="contact-map"
            >
              <iframe
                src="https://maps.google.com/maps?q=Berberhane+Golcuk+Kocaeli&z=17&output=embed"
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  filter: "invert(92%) hue-rotate(180deg) contrast(90%) brightness(95%) saturate(120%)",
                }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Berberhane Konum"
              />
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=40.7181519,29.8258375&destination_place_id=ChIJMZvRL5hByxQRgMWtfiYfqDw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-manrope font-medium py-3 rounded-sm transition-colors"
              data-testid="directions-button"
            >
              <MapPin size={20} weight="bold" />
              Yol Tarifi Al
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;