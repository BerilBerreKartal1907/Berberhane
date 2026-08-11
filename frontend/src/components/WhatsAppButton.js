import { WhatsappLogo } from "@phosphor-icons/react";

const WhatsAppButton = ({ phone }) => {
  const phoneNumber = phone?.replace(/\D/g, "") || "905551234567";

  return (
    <a
      href={`https://wa.me/${phoneNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center whatsapp-pulse"
      aria-label="WhatsApp ile iletişime geç"
      data-testid="whatsapp-button"
    >
      <WhatsappLogo size={28} weight="fill" />
    </a>
  );
};

export default WhatsAppButton;
