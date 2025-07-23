const MissionSection = () => {
  return (
    <section id="mission" className="bg-white section-padding">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="animate-slide-up mb-12">
            <h2 className="text-4xl md:text-5xl font-montserrat font-bold mb-6 text-primary">
              Our Mission
            </h2>
            
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground max-w-5xl mx-auto">
              Community Connect is dedicated to fostering meaningful relationships between passionate volunteers and impactful opportunities. We believe that when individuals come together with shared purpose, they can create transformative change that extends far beyond individual efforts. Our platform serves as a bridge, connecting hearts and hands to build stronger, more resilient Upland through collective action.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;