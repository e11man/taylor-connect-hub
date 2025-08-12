import AnimatedSection from "@/components/ui/animated-section";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const CommunityTransitionImage = () => {
  return (
    <section id="community-transition" className="bg-white py-6 md:py-10">
      <div className="container-custom">
        <AnimatedSection variant="fade" delay={0.1}>
          <div className="relative overflow-hidden rounded-2xl shadow-card ring-1 ring-border/50">
            <AspectRatio ratio={16 / 9}>
              <img
                src="/community_picture.jpg"
                alt="Community members together making an impact"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
                className="h-full w-full object-cover"
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