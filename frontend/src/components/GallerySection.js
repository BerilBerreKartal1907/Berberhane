import { motion } from "framer-motion";

const galleryImages = [
  { src: "/gallery/berberhane-2.jpg", alt: "Berberhane saç kesimi" },
  { src: "/gallery/berberhane-5.jpg", alt: "Berberhane iç mekan" },
  { src: "/gallery/berberhane-1.jpg", alt: "Berberhane neon tabela" },
  { src: "/gallery/berberhane-4.jpg", alt: "Berberhane dükkan girişi" },
  { src: "/gallery/berberhane-3.jpg", alt: "Berberhane çalışma alanı" },
  { src: "/gallery/berberhane-6.jpg", alt: "Berberhane saç kesimi 2" },
];

const GallerySection = () => {
  return (
    <section
      id="galeri"
      className="py-24 sm:py-32 px-4 sm:px-6 bg-[#171717]"
      data-testid="gallery-section"
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
            Galeri
          </h2>
        </motion.div>

        {/* Gallery Grid - eşit kare hücreler, hiçbir yazı kesilmiyor */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative overflow-hidden rounded-sm group aspect-square"
              data-testid={`gallery-image-${index}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;