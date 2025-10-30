import React, { useState, useCallback, useEffect } from 'react';
import { AppStep, Creation } from './types';
import type { SpriteFrame } from './types';
import StepIntro from './StepIntro';
import StepPortrait from './StepPortrait';
import StepPixelArt from './StepPixelArt';
import StepSpriteSheet from './StepSpriteSheet';
import StepHistory from './StepHistory';
import ApiKeyModal from './ApiKeyModal';
import { generateHistoricalPortrait, generatePixelArtOptions, generateSpriteFrames } from './geminiService';

const HISTORY_STORAGE_KEY = 'pixelSpriteHistory';
const API_KEY_STORAGE_KEY = 'geminiApiKey';

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.INTRO);
  const [figureName, setFigureName] = useState<string>('');
  const [portraitUrls, setPortraitUrls] = useState<string[]>([]);
  const [selectedPortraitUrl, setSelectedPortraitUrl] = useState<string | null>(null);
  const [pixelArtOptions, setPixelArtOptions] = useState<string[]>([]);
  const [selectedPixelArt, setSelectedPixelArt] = useState<string | null>(null);
  const [spriteFrames, setSpriteFrames] = useState<SpriteFrame[]>([]);
  const [history, setHistory] = useState<Creation[]>([]);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    // Load history
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
    
    // Load API Key
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setIsApiKeyModalOpen(true);
    }
  }, []);
  
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setIsApiKeyModalOpen(false);
    // If there was an error about the key, clear it
    if(error && error.includes("API Key")) {
        setError(null);
    }
  };

  const handleApiError = (e: any) => {
      console.error(e);
      // Check for common API key-related errors
      if (e instanceof Error && (e.message.includes('API key not valid') || e.message.includes('400') || e.message.includes('permission denied'))) {
          setError("API request failed. Your key might be invalid, out of quota, or not enabled for this API. Please use the 'Change API Key' button below to correct it.");
          // No longer automatically opening the modal
      } else {
          setError('An unexpected error occurred. Please try again.');
      }
  }

  const handleStart = (prompt: string, image?: File) => {
    if(!prompt.trim() && !image) {
        setError("Please describe a character or upload an image.");
        return;
    }
    if (!apiKey) {
        setError("Please enter your Gemini API Key to begin.");
        setIsApiKeyModalOpen(true);
        return;
    }
    setError(null);
    setFigureName(prompt);
    setUploadedImageFile(image || null);
    setStep(AppStep.PORTRAIT_GENERATION);
    handleGeneratePortrait(prompt, image);
  };
  
  const handleGeneratePortrait = useCallback(async (prompt: string, image?: File) => {
    if (!apiKey) return;
    setIsLoading(true);
    setLoadingMessage(`Generating portraits of ${prompt || 'the uploaded figure'}...`);
    try {
      const urls = await generateHistoricalPortrait(prompt, image, apiKey);
      setPortraitUrls(urls);
    } catch (e) {
      handleApiError(e);
      setStep(AppStep.INTRO);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const handlePortraitSelection = (url: string) => {
    if (!url) return;
    setSelectedPortraitUrl(url);
    setStep(AppStep.PIXEL_ART_SELECTION);
    handleGeneratePixelArt(url);
  };

  const handleGeneratePixelArt = useCallback(async (url: string) => {
    if (!apiKey) return;
    setIsLoading(true);
    setLoadingMessage('Generating pixel art styles...');
    try {
      const options = await generatePixelArtOptions(url, apiKey);
      setPixelArtOptions(options);
    } catch (e) {
      handleApiError(e);
      setStep(AppStep.PORTRAIT_GENERATION);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const handlePixelArtSelection = (url: string) => {
    setSelectedPixelArt(url);
    setStep(AppStep.SPRITE_GENERATION);
    handleGenerateSprites(url);
  };

  const handleGenerateSprites = useCallback(async (baseCharacterUrl: string) => {
    if (!apiKey) return;
    setIsLoading(true);
    const onProgress = (progress: number, message: string) => {
      setLoadingMessage(`${message} (${Math.round(progress)}%)`);
    };
    setLoadingMessage('Preparing to generate sprite frames...');
    try {
        const frames = await generateSpriteFrames(baseCharacterUrl, onProgress, apiKey);
        setSpriteFrames(frames);

        const newCreation: Creation = {
          id: Date.now(),
          figureName: figureName,
          portraitUrl: selectedPortraitUrl!,
          baseCharacterUrl: baseCharacterUrl,
          frames: frames,
        };
        
        setHistory(prevHistory => {
            const updatedHistory = [newCreation, ...prevHistory];
            try {
              localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
            } catch (storageError) {
              console.warn('Failed to persist history, clearing stored history.', storageError);
              localStorage.removeItem(HISTORY_STORAGE_KEY);
            }
            return updatedHistory;
        });

        setStep(AppStep.FINISHED);
    } catch (e) {
        handleApiError(e);
        setStep(AppStep.PIXEL_ART_SELECTION);
    } finally {
        setIsLoading(false);
    }
  }, [figureName, selectedPortraitUrl, apiKey]);

  const handleRetryPortrait = () => {
    if (!figureName && !uploadedImageFile) return;
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    setError(null);
    setPortraitUrls([]);
    setSelectedPortraitUrl(null);
    handleGeneratePortrait(figureName, uploadedImageFile || undefined);
  };

  const handleStartOver = () => {
    setStep(AppStep.INTRO);
    setFigureName('');
    setPortraitUrls([]);
    setSelectedPortraitUrl(null);
    setPixelArtOptions([]);
    setSelectedPixelArt(null);
    setSpriteFrames([]);
    setError(null);
    setUploadedImageFile(null);
  };

  const handleShowHistory = () => {
    setError(null);
    setStep(AppStep.HISTORY);
  };

  const handleHistorySelection = (creation: Creation) => {
    setFigureName(creation.figureName);
    setSelectedPortraitUrl(creation.portraitUrl);
    setSelectedPixelArt(creation.baseCharacterUrl);
    setSpriteFrames(creation.frames);
    setStep(AppStep.FINISHED);
  };

  const renderStep = () => {
    switch (step) {
      case AppStep.INTRO:
        return <StepIntro 
            onStart={handleStart} 
            isLoading={isLoading} 
            initialName={figureName} 
            error={error} 
            onShowHistory={handleShowHistory} 
            history={history}
            onHistorySelect={handleHistorySelection}
            />;
      case AppStep.PORTRAIT_GENERATION:
        return <StepPortrait 
            options={portraitUrls} 
            isLoading={isLoading} 
            loadingMessage={loadingMessage}
            onSelect={handlePortraitSelection}
            onRestart={handleRetryPortrait}
            figureName={figureName || 'the uploaded figure'}
            />;
      case AppStep.PIXEL_ART_SELECTION:
        return <StepPixelArt
            options={pixelArtOptions}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            onSelect={handlePixelArtSelection}
            onRestart={handleStartOver}
            />;
      case AppStep.SPRITE_GENERATION:
      case AppStep.FINISHED:
          return <StepSpriteSheet
            portraitUrl={selectedPortraitUrl}
            baseCharacterUrl={selectedPixelArt}
            frames={spriteFrames}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            onRestart={handleStartOver}
            figureName={figureName}
            isFinished={step === AppStep.FINISHED}
            />;
      case AppStep.HISTORY:
          return <StepHistory 
              creations={history}
              onSelect={handleHistorySelection}
              onBack={handleStartOver}
          />;
      default:
        return <StepIntro 
            onStart={handleStart} 
            isLoading={isLoading} 
            error={error} 
            onShowHistory={handleShowHistory}
            history={history}
            onHistorySelect={handleHistorySelection}
            />;
    }
  };

  return (
    <>
      <ApiKeyModal isOpen={isApiKeyModalOpen} onSave={handleSaveApiKey} currentKey={apiKey} />
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
              Pixel Sprite Animator
            </h1>
            <p className="text-gray-400 mt-2">From historical figures to game-ready sprites in minutes.</p>
          </header>
          <main className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 backdrop-blur-sm">
            {renderStep()}
          </main>
          <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Powered by Google Gemini</p>
            <button 
              onClick={() => setIsApiKeyModalOpen(true)}
              className="mt-2 text-purple-400 hover:text-purple-300 transition underline text-xs"
            >
              Change API Key
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

export default App;
