import React from 'react';

interface StyleSelectorProps {
  styles: string[];
  onSelect: (style: string) => void;
  isLoading: boolean;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ styles, onSelect, isLoading }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {styles.map((style) => (
        <button
          key={style}
          onClick={() => onSelect(style)}
          disabled={isLoading}
          className="px-5 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-full font-medium transition-all duration-200 ease-in-out hover:bg-emerald-500 hover:border-emerald-500 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-50 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-stone-700"
        >
          {style}
        </button>
      ))}
    </div>
  );
};

export default StyleSelector;