
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface StepPixelArtProps {
  options: string[];
  isLoading: boolean;
  loadingMessage: string;
  onSelect: (url: string) => void;
  onRestart: () => void;
}

const StepPixelArt: React.FC<StepPixelArtProps> = ({ options, isLoading, loadingMessage, onSelect, onRestart }) => {
  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2 text-white">Step 3: Choose Your Character Style</h2>
      <p className="text-gray-400 mb-6">Select your favorite 3-head-proportion pixel art character.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {options.map((url, index) => (
          <div
            key={index}
            onClick={() => onSelect(url)}
            className="group cursor-pointer bg-gray-700/50 p-2 rounded-lg border-2 border-transparent hover:border-purple-500 hover:bg-gray-700 transition-all transform hover:scale-105"
          >
            <img 
              src={url} 
              alt={`Pixel art option ${index + 1}`} 
              className="w-48 h-48 object-contain"
              style={{ imageRendering: 'pixelated' }} 
            />
          </div>
        ))}
      </div>
      <button
        onClick={onRestart}
        className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
      >
        Start Over
      </button>
    </div>
  );
};

export default StepPixelArt;
