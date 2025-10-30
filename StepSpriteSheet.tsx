
import React, { useCallback } from 'react';
import type { SpriteFrame } from './types';
import LoadingSpinner from './LoadingSpinner';

interface StepSpriteSheetProps {
  portraitUrl: string | null;
  baseCharacterUrl: string | null;
  frames: SpriteFrame[];
  isLoading: boolean;
  loadingMessage: string;
  onRestart: () => void;
  figureName: string;
  isFinished: boolean;
}

const downloadImage = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const StepSpriteSheet: React.FC<StepSpriteSheetProps> = ({
  portraitUrl,
  baseCharacterUrl,
  frames,
  isLoading,
  loadingMessage,
  onRestart,
  figureName,
  isFinished,
}) => {

  const formattedFigureName = figureName.toLowerCase().replace(/ /g, '_');

  const downloadAllFrames = useCallback(() => {
    if (frames.length === 0) return;
    frames.forEach(frame => {
      const filename = `${formattedFigureName}_${frame.name}.png`;
      downloadImage(frame.url, filename);
    });
  }, [frames, formattedFigureName]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center">
        {baseCharacterUrl && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-center">Generating frames for:</h3>
            <div className="bg-gray-700/50 p-2 rounded-lg border-2 border-purple-500">
                <img src={baseCharacterUrl} alt="Selected character" className="w-48 h-48 object-contain" style={{ imageRendering: 'pixelated' }} />
            </div>
          </div>
        )}
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  if (!isFinished) return null;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2 text-white">All Assets Generated for {figureName}!</h2>
      <p className="text-gray-400 mb-6">You can now download your generated assets.</p>

      <div className="w-full mb-8 p-4 bg-gray-900/50 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-center">Your Base Characters</h3>
        <div className="flex flex-col sm:flex-row justify-center items-start gap-8">
          {portraitUrl && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-gray-400 text-sm font-semibold">Portrait</p>
              <img src={portraitUrl} alt={`Portrait of ${figureName}`} className="w-48 h-48 object-cover rounded-lg shadow-lg border-2 border-purple-500/30" />
              <button
                onClick={() => downloadImage(portraitUrl, `${formattedFigureName}_portrait.png`)}
                className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Download
              </button>
            </div>
          )}
          {baseCharacterUrl && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-gray-400 text-sm font-semibold">Pixel Art Character</p>
              <img src={baseCharacterUrl} alt="Selected character" className="w-48 h-48 object-contain rounded-lg bg-gray-800/60 p-1" style={{ imageRendering: 'pixelated' }} />
              <button
                onClick={() => downloadImage(baseCharacterUrl, `${formattedFigureName}_pixel_char.png`)}
                className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Download
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-center">Animation Frames ({frames.length})</h3>
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 p-4 bg-gray-900/50 rounded-lg mb-8">
        {frames.map((frame) => (
          <div key={frame.name} className="flex flex-col items-center" title={frame.name}>
            <img 
              src={frame.url} 
              alt={frame.name} 
              className="w-24 h-24 object-contain bg-gray-700/30 rounded"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="text-xs text-gray-400 mt-1 truncate w-full text-center">{frame.name}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
        >
          Start Over
        </button>
        <button
          onClick={downloadAllFrames}
          className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105"
        >
          Download All Frames ({frames.length})
        </button>
      </div>
    </div>
  );
};

export default StepSpriteSheet;
