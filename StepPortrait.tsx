import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface StepPortraitProps {
  options: string[];
  isLoading: boolean;
  loadingMessage: string;
  onSelect: (url: string) => void;
  onRestart: () => void;
  figureName: string;
}

const StepPortrait: React.FC<StepPortraitProps> = ({ options, isLoading, loadingMessage, onSelect, onRestart, figureName }) => {
  if (isLoading && options.length === 0) {
    return <LoadingSpinner message={loadingMessage} />;
  }
  
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2 text-white">Step 2: Choose Your Portrait</h2>
      <p className="text-gray-400 mb-6">Select your favorite portrait of {figureName}.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {options.map((url, index) => (
          <div
            key={index}
            onClick={() => onSelect(url)}
            className="group cursor-pointer bg-gray-700/50 p-2 rounded-lg border-2 border-transparent hover:border-purple-500 hover:bg-gray-700 transition-all transform hover:scale-105"
          >
            <img 
              src={url} 
              alt={`Portrait option ${index + 1} of ${figureName}`} 
              className="w-48 h-48 object-cover"
            />
          </div>
        ))}
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={onRestart}
          disabled={isLoading}
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Try Again'}
        </button>
      </div>
    </div>
  );
};

export default StepPortrait;