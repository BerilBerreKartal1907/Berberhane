import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <>
      {/* Giriş: dükkânın gerçek fotoğrafı, neon tabela başlık görevi görüyor */}
      <section
        className="relative h-[75vh] sm:h-[85vh] min-h-[460px] overflow-hidden"
        data-testid="hero-section"
      >
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url('/hero-bg.jpg')`,
            // Neon tabela yatayda ortada, dikeyde üst kısımda duruyor;
            // telefonda dikey ekranda kırpılırken tabela görünür kalsın diye
            backgroundPosition: "52% 35%",
          }}
        />

        {/* Fotoğrafın üstünde yazı olmadığı için hafif karartma yeterli */}
        <div className="absolute inset-0 bg-black/25" />
        {/* Üst kısım: menü ve logo okunaklı kalsın */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
        {/* Alt kısım: fotoğraf alttaki slogana yumuşakça geçsin */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0A0A0A]" />

        {/* Başlık arama motorları ve ekran okuyucular için; görsel başlık neon tabela */}
        <h1 className="sr-only">BERBERHANE - Gölcük Erkek Kuaförü</h1>
      </section>

      {/* Slogan */}
      <section className="bg-[#0A0A0A] px-4 sm:px-6 pt-6 pb-20 sm:pb-28" data-testid="hero-slogan">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="w-12 h-[2px] bg-[#D97706] mx-auto mb-8" />
          <p className="font-oswald text-4xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-tight leading-[1.05] text-white">
            Bir kere gelen,
            <br />
            <span className="text-[#D97706]">bir daha gelir.</span>
          </p>
        </motion.div>
      </section>
    </>
  );
};

export default HeroSection;