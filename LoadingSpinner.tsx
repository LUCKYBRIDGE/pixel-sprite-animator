
import React from 'react';

interface LoadingSpinnerProps {
    message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mb-4"></div>
            <p className="text-lg text-gray-300">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
