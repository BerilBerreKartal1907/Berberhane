import { useEffect, useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import GallerySection from "@/components/GallerySection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getServices, getSettings } from "@/lib/api";

const HomePage = () => {
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, settingsData] = await Promise.all([
          getServices(),
          getSettings(),
        ]);
        setServices(servicesData);
        setSettings(settingsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#A3A3A3] font-manrope">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="home-page">
      <Header settings={settings} />
      <main>
        <HeroSection />
        <ServicesSection services={services} />
        <GallerySection />
        <ContactSection settings={settings} />
      </main>
      <Footer settings={settings} />
      <BookingModal services={services} />
      <WhatsAppButton phone={settings?.whatsapp} />
    </div>
  );
};

export default HomePage;