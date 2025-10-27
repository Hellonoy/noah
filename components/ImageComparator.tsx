import React, { useState, useRef } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface ImageComparatorProps {
  originalSrc: string;
  generatedSrc: string;
}

const ImageComparator: React.FC<ImageComparatorProps> = ({ originalSrc, generatedSrc }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = generatedSrc;
    // Extract file extension from MIME type for a better filename
    const mimeType = generatedSrc.split(';')[0].split(':')[1] || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `ai-interior-design.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-stone-200 p-4 sm:p-6 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-semibold mb-4 text-stone-700 text-center">2. Compare Your Design</h2>
      <div ref={containerRef} className="relative w-full aspect-video rounded-xl overflow-hidden select-none group">
        <img
          src={originalSrc}
          alt="Original Room"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <div
          className="absolute top-0 left-0 h-full w-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={generatedSrc}
            alt="Generated Design"
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-0 left-0 w-full h-full p-2 flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between">
                <span className="bg-white/70 backdrop-blur-sm text-stone-800 px-3 py-1 rounded-full text-sm font-semibold">Original</span>
                <span className="bg-white/70 backdrop-blur-sm text-stone-800 px-3 py-1 rounded-full text-sm font-semibold">AI Generated</span>
            </div>
        </div>
        <div 
          className="absolute top-0 h-full bg-white/90 w-1 pointer-events-none" 
          style={{ left: `calc(${sliderPosition}% - 2px)`}}
        ></div>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          className="absolute top-0 left-0 w-full h-full cursor-ew-resize opacity-0"
          aria-label="Image comparison slider"
        />
      </div>
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-50 focus:ring-emerald-500 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <DownloadIcon />
          Download Design
        </button>
      </div>
    </div>
  );
};

export default ImageComparator;