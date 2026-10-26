import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import {
  X,
  Scissors,
  CalendarBlank,
  Clock,
  User,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Phone,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useBooking } from "@/context/BookingContext";
import { getAvailableSlots, createAppointment, getSettings } from "@/lib/api";

// Online randevu açık mı? Tanımlı değilse açık kabul edilir.
// Yayına hazır olana kadar Cloudflare'de REACT_APP_BOOKING_ENABLED=false yapılır.
const BOOKING_ENABLED =
  (process.env.REACT_APP_BOOKING_ENABLED || "true").trim().toLowerCase() !== "false";

const STEPS = [
  { id: 1, title: "Hizmet Seç", icon: Scissors },
  { id: 2, title: "Tarih Seç", icon: CalendarBlank },
  { id: 3, title: "Saat Seç", icon: Clock },
  { id: 4, title: "Bilgiler", icon: User },
  { id: 5, title: "Onay", icon: CheckCircle },
];

const BookingModal = ({ services }) => {
  const { isBookingOpen, closeBooking, selectedService, setSelectedService } = useBooking();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [noSlotsMessage, setNoSlotsMessage] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [completedAppointment, setCompletedAppointment] = useState(null);
  const [closedWeekdays, setClosedWeekdays] = useState([]);
  const [contactInfo, setContactInfo] = useState({ phone: "", whatsapp: "" });

  // İşletme ayarlarını çek (kapalı günleri takvimde engellemek ve iletişim bilgisi için)
  useEffect(() => {
    if (isBookingOpen) {
      getSettings()
        .then((data) => {
          // Backend: Pazartesi=0...Pazar=6 (Python weekday). JS Date.getDay(): Pazar=0...Cumartesi=6.
          const closed = (data.working_hours || [])
            .filter((h) => !h.is_open)
            .map((h) => (h.day + 1) % 7);
          setClosedWeekdays(closed);
          setContactInfo({
            phone: data.phone || "",
            whatsapp: data.whatsapp || "",
          });
        })
        .catch(() => {});
    }
  }, [isBookingOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isBookingOpen) {
      setTimeout(() => {
        setStep(1);
        setSelectedDate(null);
        setSelectedTime(null);
        setAvailableSlots([]);
        setAllSlots([]);
        setNoSlotsMessage(null);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerNote("");
        setBookingComplete(false);
        setCompletedAppointment(null);
      }, 300);
    } else if (selectedService) {
      setStep(2);
    }
  }, [isBookingOpen, selectedService]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (BOOKING_ENABLED && selectedDate && selectedService) {
      fetchSlots();
    }
  }, [selectedDate, selectedService]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    setSelectedTime(null);
    setNoSlotsMessage(null);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const data = await getAvailableSlots(dateStr, selectedService.id);
      setAvailableSlots(data.slots || []);
      setAllSlots(data.all_slots || []);
      if (data.message && data.slots?.length === 0) {
        setNoSlotsMessage(data.message);
      } else if (data.partial_block_message) {
        toast.info(data.partial_block_message);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Müsait saatler alınamadı");
      setAvailableSlots([]);
      setAllSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const isValidPhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length >= 10 && digitsOnly.length <= 13;
  };

  const isValidName = (name) => name.trim().length >= 3;

  const handleSubmit = async () => {
    if (!isValidName(customerName)) {
      toast.error("Lütfen geçerli bir ad soyad girin");
      return;
    }
    if (!isValidPhone(customerPhone)) {
      toast.error("Lütfen geçerli bir telefon numarası girin (en az 10 hane)");
      return;
    }

    setIsSubmitting(true);
    try {
      const appointment = await createAppointment({
        service_id: selectedService.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_note: customerNote.trim() || null,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
      });

      setCompletedAppointment(appointment);
      setBookingComplete(true);
      setStep(5);
      toast.success("Randevunuz başarıyla oluşturuldu!");
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error(error.response?.data?.detail || "Randevu oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedService;
      case 2:
        return !!selectedDate;
      case 3:
        return !!selectedTime;
      case 4:
        return isValidName(customerName) && isValidPhone(customerPhone);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < 5) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Disable past dates, dates more than 30 days in the future, and kapalı günler
  const disabledDays = (date) => {
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 30);
    if (isBefore(date, today) || isBefore(maxDate, date)) return true;
    if (closedWeekdays.includes(date.getDay())) return true;
    return false;
  };

  const phoneHref = contactInfo.phone ? `tel:${contactInfo.phone.replace(/\s/g, "")}` : null;
  const whatsappDigits = contactInfo.whatsapp.replace(/\D/g, "");
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null;

  return (
    <Dialog open={isBookingOpen} onOpenChange={closeBooking}>
      <DialogContent
        className="max-w-lg w-[95vw] bg-[#0A0A0A] border border-[#262626] p-0 overflow-hidden"
        data-testid="booking-modal"
      >
        <DialogTitle className="sr-only">Randevu Al</DialogTitle>
        
        {/* Header */}
        <div className="border-b border-[#262626] p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-oswald text-xl sm:text-2xl uppercase tracking-tight text-white">
              Randevu Al
            </h2>
          </div>

          {/* Step Indicators */}
          {BOOKING_ENABLED && !bookingComplete && (
            <div className="flex justify-center gap-2 mt-4">
              {STEPS.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className={`w-2 h-2 rounded-full transition-all ${
                    s.id === step
                      ? "bg-[#D97706] scale-125"
                      : s.id < step
                      ? "bg-[#22c55e]"
                      : "bg-[#262626]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Online randevu kapalıyken: "yakında" mesajı ve iletişim butonları */}
        {!BOOKING_ENABLED && (
          <div className="p-6 sm:p-8 text-center" data-testid="booking-coming-soon">
            <div className="w-16 h-16 bg-[#D97706]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CalendarBlank size={32} weight="duotone" className="text-[#D97706]" />
            </div>
            <h3 className="font-oswald text-xl sm:text-2xl uppercase tracking-tight text-white mb-2">
              Online randevu çok yakında
            </h3>
            <p className="font-manrope text-[#A3A3A3] mb-6">
              Şimdilik randevu için bizi arayabilir ya da WhatsApp'tan yazabilirsiniz.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {phoneHref && (
                <a
                  href={phoneHref}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-[#D97706] hover:bg-[#B45309] text-white font-oswald uppercase tracking-wider transition-colors"
                  data-testid="booking-call-btn"
                >
                  <Phone size={20} weight="fill" />
                  Ara
                </a>
              )}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm border border-[#22c55e]/40 text-[#22c55e] hover:bg-[#22c55e]/10 font-oswald uppercase tracking-wider transition-colors"
                  data-testid="booking-whatsapp-btn"
                >
                  <WhatsappLogo size={20} weight="fill" />
                  WhatsApp
                </a>
              )}
            </div>

            {contactInfo.phone && (
              <p className="font-manrope text-sm text-[#A3A3A3] mt-5">{contactInfo.phone}</p>
            )}

            <Button
              onClick={closeBooking}
              variant="ghost"
              className="mt-4 text-[#A3A3A3] hover:text-white"
            >
              Kapat
            </Button>
          </div>
        )}

        {/* Content */}
        {BOOKING_ENABLED && (
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Service */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
                data-testid="booking-step-1"
              >
                <p className="font-manrope text-[#A3A3A3] mb-4">
                  Hangi hizmeti almak istiyorsunuz?
                </p>
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`w-full p-4 border rounded-sm text-left transition-all ${
                      selectedService?.id === service.id
                        ? "border-[#D97706] bg-[#D97706]/10"
                        : "border-[#262626] bg-[#171717] hover:border-[#D97706]/50"
                    }`}
                    data-testid={`booking-service-${service.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-oswald text-lg text-white uppercase tracking-tight">
                          {service.name}
                        </h3>
                        <p className="text-sm text-[#A3A3A3] mt-1">
                          {service.duration} dakika
                        </p>
                      </div>
                      <span className="font-oswald text-xl text-[#D97706]">
                        ₺{service.price}
                      </span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Step 2: Select Date */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center"
                data-testid="booking-step-2"
              >
                <p className="font-manrope text-[#A3A3A3] mb-4 self-start">
                  Hangi tarihte gelmek istiyorsunuz?
                </p>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) setStep(3);
                  }}
                  disabled={disabledDays}
                  locale={tr}
                  className="bg-[#171717] border border-[#262626] rounded-sm p-3"
                  classNames={{
                    day_selected: "bg-[#D97706] text-white hover:bg-[#B45309]",
                    day_today: "bg-[#262626] text-white",
                  }}
                />
              </motion.div>
            )}

            {/* Step 3: Select Time */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                data-testid="booking-step-3"
              >
                <p className="font-manrope text-[#A3A3A3] mb-4">
                  {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })} tarihinde
                  müsait saatler:
                </p>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : allSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {allSlots.map(({ time: slot, available }) => (
                      <button
                        key={slot}
                        onClick={() => {
                          if (!available) return;
                          setSelectedTime(slot);
                          setStep(4);
                        }}
                        disabled={!available}
                        className={`relative p-3 border rounded-sm font-manrope text-sm transition-all ${
                          !available
                            ? "border-[#262626] bg-[#0A0A0A] text-[#525252] cursor-not-allowed"
                            : selectedTime === slot
                            ? "border-[#D97706] bg-[#D97706]/10 text-white"
                            : "border-[#262626] bg-[#171717] text-[#A3A3A3] hover:border-[#D97706]/50"
                        }`}
                        data-testid={`booking-slot-${slot}`}
                      >
                        {slot}
                        {!available && (
                          <X
                            size={14}
                            weight="bold"
                            className="absolute top-1 right-1 text-red-500/70"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#A3A3A3] font-manrope">
                      {noSlotsMessage || "Bu tarihte müsait saat bulunmuyor."}
                    </p>
                    <Button
                      onClick={prevStep}
                      variant="ghost"
                      className="mt-4 text-[#D97706]"
                    >
                      Başka tarih seçin
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Customer Details */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
                data-testid="booking-step-4"
              >
                <p className="font-manrope text-[#A3A3A3] mb-4">
                  İletişim bilgilerinizi girin:
                </p>

                <div>
                  <label className="block text-sm font-manrope text-[#A3A3A3] mb-2">
                    Ad Soyad *
                  </label>
                  <Input
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(e.target.value.toLocaleUpperCase("tr-TR"))
                    }
                    placeholder="ADINIZ SOYADINIZ"
                    className="bg-[#171717] border-[#262626] text-white placeholder:text-[#666]"
                    data-testid="booking-customer-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-manrope text-[#A3A3A3] mb-2">
                    Telefon *
                  </label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const filtered = raw.replace(/[^0-9+\s]/g, "");
                      if (filtered !== raw) {
                        toast.error("Telefon numarası sadece rakam içerebilir");
                      }
                      setCustomerPhone(filtered);
                    }}
                    placeholder="05XX XXX XX XX"
                    type="tel"
                    inputMode="numeric"
                    className="bg-[#171717] border-[#262626] text-white placeholder:text-[#666]"
                    data-testid="booking-customer-phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-manrope text-[#A3A3A3] mb-2">
                    Not (opsiyonel)
                  </label>
                  <Input
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Eklemek istediğiniz bir not varsa..."
                    className="bg-[#171717] border-[#262626] text-white placeholder:text-[#666]"
                    data-testid="booking-customer-note"
                  />
                </div>

                <p className="text-xs text-[#666] font-manrope leading-relaxed">
                  Randevu oluşturarak, kişisel verilerinizin randevu hizmeti kapsamında
                  işlenmesini kabul etmiş olursunuz. Detaylar için{" "}
                  <a href="/kvkk" target="_blank" rel="noopener noreferrer" className="text-[#D97706] hover:underline">
                    KVKK Aydınlatma Metni
                  </a>
                  'ni inceleyebilirsiniz.
                </p>

                {/* Summary */}
                <div className="mt-6 p-4 bg-[#171717] border border-[#262626] rounded-sm">
                  <h4 className="font-oswald text-white uppercase tracking-tight mb-3">
                    Randevu Özeti
                  </h4>
                  <div className="space-y-2 text-sm font-manrope">
                    <div className="flex justify-between">
                      <span className="text-[#A3A3A3]">Hizmet:</span>
                      <span className="text-white">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A3A3A3]">Tarih:</span>
                      <span className="text-white">
                        {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A3A3A3]">Saat:</span>
                      <span className="text-white">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#262626]">
                      <span className="text-[#A3A3A3]">Ücret:</span>
                      <span className="text-[#D97706] font-oswald text-lg">
                        ₺{selectedService?.price}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Confirmation */}
            {step === 5 && bookingComplete && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
                data-testid="booking-step-5"
              >
                <div className="w-20 h-20 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={48} weight="fill" className="text-[#22c55e]" />
                </div>

                <h3 className="font-oswald text-2xl uppercase tracking-tight text-white mb-2">
                  Randevunuz Onaylandı!
                </h3>
                <p className="font-manrope text-[#A3A3A3] mb-6">
                  Sizi bekliyoruz.
                </p>

                <div className="p-4 bg-[#171717] border border-[#262626] rounded-sm text-left">
                  <div className="space-y-2 text-sm font-manrope">
                    <div className="flex justify-between">
                      <span className="text-[#A3A3A3]">Hizmet:</span>
                      <span className="text-white">{completedAppointment?.service_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A3A3A3]">Tarih:</span>
                      <span className="text-white">
                        {completedAppointment?.date &&
                          format(new Date(completedAppointment.date), "d MMMM yyyy", {
                            locale: tr,
                          })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#A3A3A3]">Saat:</span>
                      <span className="text-white">{completedAppointment?.time}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={closeBooking}
                  className="mt-6 bg-[#D97706] hover:bg-[#B45309] text-white font-oswald uppercase tracking-wider"
                  data-testid="booking-complete-close"
                >
                  Tamam
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {/* Footer Navigation */}
        {BOOKING_ENABLED && !bookingComplete && (
          <div className="border-t border-[#262626] p-4 sm:p-6 flex justify-between">
            <Button
              onClick={prevStep}
              disabled={step === 1}
              variant="ghost"
              className="text-[#A3A3A3] disabled:opacity-30"
              data-testid="booking-prev-btn"
            >
              <ArrowLeft size={18} className="mr-2" />
              Geri
            </Button>

            {step < 4 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-[#D97706] hover:bg-[#B45309] text-white font-oswald uppercase tracking-wider disabled:opacity-50"
                data-testid="booking-next-btn"
              >
                İleri
                <ArrowRight size={18} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="bg-[#D97706] hover:bg-[#B45309] text-white font-oswald uppercase tracking-wider disabled:opacity-50"
                data-testid="booking-submit-btn"
              >
                {isSubmitting ? "Gönderiliyor..." : "Randevuyu Onayla"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;