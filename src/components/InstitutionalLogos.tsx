import React from "react";
import Image from "next/image";

interface InstitutionalLogosProps {
  className?: string;
  imageClassName?: string;
}

export const institutionalLogos = [
  { src: "/tut_wuri.png", alt: "Tut Wuri Handayani" },
  { src: "/bima_dikti.png", alt: "BIMA Dikti" },
  { src: "/diktisaintek.png", alt: "Diktisaintek Berdampak" },
  { src: "/unhas.png", alt: "Logo Unhas" },
  { src: "/logo-kalla.png", alt: "Logo Kalla" },
];

export const InstitutionalLogos: React.FC<InstitutionalLogosProps> = ({
  className = "",
  imageClassName = "h-6 sm:h-8 md:h-9 w-auto object-contain",
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 ${className}`}>
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
