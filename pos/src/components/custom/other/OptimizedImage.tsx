"use client";
import { LoaderCircle } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import React, { useState } from "react";
const OptimizedImage = ({
  src,
  alt = "",
}: {
  src: StaticImageData | string;
  alt?: string;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <div className="relative size-full">
      <Image
        // unoptimized
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        fill
        src={src}
        alt={alt}
        className={` ${
          imageLoaded
            ? "opacity-100 blur-0"
            : "opacity-0  blur-lg mix-blend-multiply"
        } w-full h-full object-cover absolute -z-0  transition-all duration-500`}
      />

      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent animate-pulse">
          <LoaderCircle size={24} className="animate-spin" />
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
