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
    <div className={`flex flex-nowrap items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 w-full max-w-full overflow-hidden ${className}`}>
      {institutionalLogos.map((logo, index) => (
        <div key={index} className="flex shrink items-center justify-center min-w-0">
          <Image
            src={logo.src}
            alt={logo.alt}
            title={logo.alt}
            width={120}
            height={120}
            className={`${imageClassName} max-w-full max-h-full shrink object-contain transition-transform duration-200 hover:scale-110 drop-shadow-xs`}
          />
        </div>
      ))}
    </div>
  );
};
