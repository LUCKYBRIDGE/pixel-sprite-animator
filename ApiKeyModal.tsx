import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  currentKey?: string | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, currentKey }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    // Pre-fill with existing key if available, for editing purposes
    if (isOpen && currentKey) {
      setApiKey(currentKey);
    } else {
      setApiKey(''); // Clear on open if no key exists
    }
  }, [isOpen, currentKey]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm"
      aria-modal="true" 
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg mx-4 border border-gray-700"
      >
        <h3 className="text-2xl font-bold text-white mb-4">Enter Your Gemini API Key</h3>
        <p className="text-gray-400 mb-6">
          To use this application, you need to provide your own Google Gemini API key. 
          Your key is stored securely in your browser's local storage and is never sent anywhere else.
        </p>
        
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key here"
          className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition mb-4"
          aria-label="Gemini API Key Input"
        />

        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-purple-400 hover:text-purple-300 transition text-sm"
        >
          Get your API key from Google AI Studio &rarr;
        </a>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Save and Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
