import React from 'react';

interface MultiPhotosLayoutProps {
  images: string[];
  onImageClick?: (url: string) => void;
  selectedImageUrl?: string | null;
}

export const MultiPhotosLayout: React.FC<MultiPhotosLayoutProps> = ({ 
  images, 
  onImageClick,
  selectedImageUrl 
}) => {
  if (!images || images.length === 0) return null;

  const count = images.length;

  const handleClick = (imgUrl: string) => {
    if (onImageClick) {
      onImageClick(imgUrl);
    }
  };

  // Modern Mosaic Layouts depending on image count
  if (count === 1) {
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-zinc-150 shadow-xs relative bg-stone-50/50 flex justify-center items-center">
        <img 
          loading="lazy"
          src={images[0]} 
          alt="Visual Attachment" 
          onClick={() => handleClick(images[0])}
          className={`w-full h-full object-cover cursor-pointer hover:scale-[1.01] transition-transform duration-500 ${
            selectedImageUrl === images[0] ? 'ring-4 ring-orange-500' : ''
          }`}
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 w-full aspect-video rounded-2xl overflow-hidden border border-zinc-150 shadow-xs">
        {images.map((img, idx) => (
          <div key={idx} className="relative h-full overflow-hidden bg-zinc-950 group flex items-center justify-center">
            <img 
              loading="lazy"
              src={img} 
              alt={`Attachment ${idx + 1}`} 
              onClick={() => handleClick(img)}
              className={`w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-500 ${
                selectedImageUrl === img ? 'opacity-90 ring-2 ring-inset ring-orange-500' : ''
              }`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-3 gap-2 w-full aspect-video rounded-2xl overflow-hidden border border-zinc-150 shadow-xs">
        <div className="col-span-2 relative h-full overflow-hidden bg-zinc-950 group flex items-center justify-center">
          <img 
            loading="lazy"
            src={images[0]} 
            alt="Lead Attachment" 
            onClick={() => handleClick(images[0])}
            className={`w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-500 ${
              selectedImageUrl === images[0] ? 'opacity-90 ring-2 ring-inset ring-orange-500' : ''
            }`}
          />
        </div>
        <div className="col-span-1 grid grid-rows-2 gap-2 h-full">
          {images.slice(1, 3).map((img, idx) => (
            <div key={idx} className="relative h-full overflow-hidden bg-zinc-950 group flex items-center justify-center">
              <img 
                loading="lazy"
                src={img} 
                alt={`Attachment ${idx + 2}`} 
                onClick={() => handleClick(img)}
                className={`w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-500 ${
                  selectedImageUrl === img ? 'opacity-90 ring-2 ring-inset ring-orange-500' : ''
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-4 gap-2 w-full aspect-video rounded-2xl overflow-hidden border border-zinc-150 shadow-xs">
        <div className="col-span-2 relative h-full overflow-hidden bg-zinc-950 group flex items-center justify-center">
          <img 
            loading="lazy"
            src={images[0]} 
            alt="Lead Attachment" 
            onClick={() => handleClick(images[0])}
            className={`w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-500 ${
              selectedImageUrl === images[0] ? 'opacity-90 ring-2 ring-inset ring-orange-500' : ''
            }`}
          />
        </div>
        <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2 h-full">
          {images.slice(1, 4).map((img, idx) => (
            <div key={idx} className="relative h-full overflow-hidden bg-zinc-950 group flex items-center justify-center">
              <img 
                loading="lazy"
                src={img} 
                alt={`Attachment ${idx + 2}`} 
                onClick={() => handleClick(img)}
                className={`w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-500 ${
                  selectedImageUrl === img ? 'opacity-90 ring-2 ring-inset ring-orange-500' : ''
                }`}
              />
            </div>
          ))}
          {/* Fill fourth cell if needed, otherwise empty space will not happen due to grid definition */}
        </div>
      </div>
    );
  }

  // count >= 5
  const remaining = count - 4;
  return (
    <div className="grid grid-cols-4 gap-2 w-full aspect-video rounded-2xl overflow-hidden border border-zinc-150 shadow-xs">
      <div className="col-span-2 relative h-full overflow-hidden bg-zinc-950 group flex items-center justify-center">
        <img 
          loading="lazy"
          src={images[0]} 
          alt="Lead Attachment" 
          onClick={() => handleClick(images[0])}
          className={`w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-500 ${
            selectedImageUrl === images[0] ? 'opacity-90 ring-2 ring-inset ring-orange-500' : ''
          }`}
        />
      </div>
      <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2 h-full">
        {images.slice(1, 4).map((img, idx) => (
          <div key={idx} className="relative h-full overflow-hidden bg-zinc-950 group flex items-center justify-center">
            <img 
              loading="lazy"
              src={img} 
              alt={`Attachment ${idx + 2}`} 
              onClick={() => handleClick(img)}
              className={`w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-500 ${
                selectedImageUrl === img ? 'opacity-90 ring-2 ring-inset ring-orange-500' : ''
              }`}
            />
            {idx === 2 && remaining > 0 && (
              <div 
                onClick={() => handleClick(img)}
                className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center text-white select-none cursor-pointer"
              >
                <span className="text-sm font-black tracking-wide">+{remaining}</span>
                <span className="text-[7px] uppercase font-bold tracking-widest opacity-80 mt-0.5">more photos</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
