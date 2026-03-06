"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const section = containerRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const threshold = window.innerHeight * 0.9;
      const scrolledInto = rect.top < threshold;
      setIsVisible(scrolledInto);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={containerRef}
      className="bg-[#1a2d25] text-[#f3f2ec] w-full flex md:flex-row relative min-h-[300vh] border-t-6 border-[#f3f2ec]"
    >
      {/* Left column - sticky heading */}
      <div className="md:w-1/3 sticky top-20 h-fit p-10 md:p-20 z-10 self-start">
        <span className="inline-block bg-[#f3f2ec] text-[#1a2d25] text-xs tracking-widest font-semibold px-4 py-2 rounded-br-xl mb-6">
          ABOUT
        </span>
        <h2 className="headline-serif text-5xl font-light leading-tight">
          All about
          <br />
          <span className="brush-underline">Bake Ree</span>
        </h2>
      </div>

      {/* Middle column - now scrolls full height */}
      <div className="md:w-1/3 flex flex-col z-10 self-start px-6 pb-20 pt-[90vh] min-h-[130vh] gap-12">
        <motion.div
          initial={{ y: 120 }}
          animate={isVisible ? { y: 0 } : {}}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col gap-10"
        >
          <p>
            Bake Ree began as a humble home kitchen tucked in a quiet
            neighborhood. The smell of warm, buttery croissants and freshly
            baked sourdough would drift from the windows and tempt every
            passerby. It was not a business then — just a passion project born
            from memories of Sunday mornings spent baking with family, and
            recipes scribbled in the margins of old cookbooks.
          </p>
          <p>
            What started with simple loaves soon turned into layered cakes,
            delicate tarts, and pillowy donuts, all crafted with love and
            intention. Friends became loyal customers, and a small dining table
            turned into a counter full of flour-dusted trays and the laughter of
            a growing community.
          </p>
          <p>
            Our founder believed in creating moments — those little joys you
            feel when breaking bread with loved ones or surprising someone with
            their favorite sweet. From sourcing local eggs and seasonal fruits,
            to hand-folding every pastry, Bake Ree is built on care, heritage,
            and the courage to do things slowly and right.
          </p>
          <p>
            Every bite tells a story — of traditions honored, of innovation
            welcomed, and of smiles shared across generations. Whether it is the
            richness of our cheesecake, the tang of our lemon tart, or the flake
            of our chocolate croissant, you will taste the commitment in every
            layer.
          </p>
          <p>
            Today, Bake Ree is more than just a bakery. It is a space where
            flavor and feeling come together. We believe that good food connects
            us, and we’re honored to be part of your celebrations, comfort, and
            everyday joys.
          </p>
        </motion.div>
      </div>

      {/* Right column - enlarged B diagram */}
      <div className="md:w-1/3 sticky top-[40vh] self-start p-10 z-10 mt-60 flex items-center justify-end">
        <div className="grid grid-cols-2 grid-rows-3 w-[400px] h-[600px] gap-0 relative">
          <div className="w-full h-full bg-[#f3f2ec] rounded-full rounded-br-[100px]" />
          <div className="w-full h-full bg-[#008066] rounded-tr-full" />
          <div className="w-full h-full bg-[#f3f2ec] rounded-full rounded-tr-[100px]" />
          <div className="w-full h-full bg-[#f3f2ec] rounded-full rounded-tl-[100px]" />
          <div className="w-full h-full bg-[#afa5f7] rounded-bl-[100px]" />
          <div className="w-full h-full bg-[#f3f2ec] rounded-full rounded-tl-[100px]" />
        </div>
      </div>
    </section>
  );
}
