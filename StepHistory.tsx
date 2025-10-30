import React from 'react';
import { Creation } from './types';

interface StepHistoryProps {
    creations: Creation[];
    onSelect: (creation: Creation) => void;
    onBack: () => void;
}

const StepHistory: React.FC<StepHistoryProps> = ({ creations, onSelect, onBack }) => {
    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-2 text-white">Creation History</h2>
            <p className="text-gray-400 mb-6">Select a previously generated character to view and download assets.</p>

            {creations.length > 0 ? (
                <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-h-96 overflow-y-auto p-2 bg-gray-900/30 rounded-lg">
                    {creations.map((creation) => (
                        <div
                            key={creation.id}
                            onClick={() => onSelect(creation)}
                            className="group cursor-pointer bg-gray-700/50 p-2 rounded-lg border-2 border-transparent hover:border-purple-500 hover:bg-gray-700 transition-all transform hover:scale-105"
                        >
                            <img
                                src={creation.portraitUrl}
                                alt={`Portrait of ${creation.figureName}`}
                                className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-center text-sm font-semibold mt-2 truncate text-white">{creation.figureName}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 my-8">You haven't created any characters yet.</p>
            )}

            <button
                onClick={onBack}
                className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
            >
                Create New Character
            </button>
        </div>
    );
};

export default StepHistory;
