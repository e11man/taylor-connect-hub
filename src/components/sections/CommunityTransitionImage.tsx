import AnimatedSection from "@/components/ui/animated-section";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const CommunityTransitionImage = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Subtle parallax: translateY from -10px to 10px over scroll, scale 1.02 -> 1
  const y = useTransform(scrollYProgress, [0, 1], [-10, 10]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.02, 1]);

  return (
    <section id="community-transition" className="bg-white py-6 md:py-10">
      <div className="container-custom">
        <AnimatedSection variant="fade" delay={0.1}>
          <div ref={sectionRef} className="relative overflow-hidden rounded-2xl shadow-card ring-1 ring-border/50">
            <AspectRatio ratio={16 / 9}>
              <motion.img
                src="/community_picture.jpg"
                alt="Community members together making an impact"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
                className="h-full w-full object-cover will-change-transform"
                style={{ y, scale }}
                transition={{ type: "spring", stiffness: 60, damping: 20 }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent"
              />
            </AspectRatio>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default CommunityTransitionImage;