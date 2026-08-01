import React from "react";
import Image from "next/image";

interface InstitutionalLogosProps {
  className?: string;
  imageClassName?: string;
}

export const institutionalLogos = [
  { src: "/tut_wuri.png", alt: "Tut Wuri Handayani" },
  { src: "/ditjen_risbang.png", alt: "Ditjen Risbang" },
  { src: "/diktisaintek.png", alt: "Diktisaintek Berdampak" },
  { src: "/unhas.png", alt: "Logo Unhas" },
];

export const InstitutionalLogos: React.FC<InstitutionalLogosProps> = ({
  className = "",
  imageClassName = "h-6 sm:h-8 md:h-9 w-auto object-contain",
}) => {
  return (
    <div className={`flex items-center gap-3.5 sm:gap-5 md:gap-6 ${className}`}>
      {institutionalLogos.map((logo, index) => (
        <Image
          key={index}
          src={logo.src}
          alt={logo.alt}
          title={logo.alt}
          width={120}
          height={120}
          className={`${imageClassName} shrink-0 transition-transform duration-200 hover:scale-110 drop-shadow-xs`}
        />
      ))}
    </div>
  );
};
