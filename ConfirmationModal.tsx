import React, { useEffect, useState, useRef } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  confirmText?: string;
  cancelText?: string;
  children: React.ReactNode;
  anchorPosition?: { x: number; y: number; placement: 'above' | 'below' };
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  confirmText = "Yes, add all",
  cancelText = "No, just this one",
  children,
  anchorPosition,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollYRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      // 1. Save current scroll position
      scrollYRef.current = window.scrollY;

      // 2. Prevent body from scrolling and maintain position to avoid page jumping
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.left = '0';
      document.body.style.right = '0';

      // 3. Start animation after a short delay
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      // This runs when isOpen becomes false (modal is closing)
      if (document.body.style.position === 'fixed') {
        // 1. Restore body scrolling ability
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.left = '';
        document.body.style.right = '';

        // 2. Restore the original scroll position
        window.scrollTo(0, scrollYRef.current);
      }
      // 3. Reset animation state
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Cleanup effect in case the component unmounts while the modal is open
  useEffect(() => {
    return () => {
      if (document.body.style.position === 'fixed') {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.left = '';
        document.body.style.right = '';
        window.scrollTo(0, scrollYRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const transformParts: string[] = [];
  if (anchorPosition) {
    transformParts.push(anchorPosition.placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)');
  }
  transformParts.push(`scale(${isAnimating ? 1 : 0.95})`);

  const modalStyle: React.CSSProperties = {
    opacity: isAnimating ? 1 : 0,
    transform: transformParts.join(' '),
  };

  if (anchorPosition) {
    Object.assign(modalStyle, {
      position: 'absolute' as const,
      top: anchorPosition.y,
      left: anchorPosition.x,
    });
  }

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center z-50 transition-opacity duration-300 ease-out ${isAnimating ? 'bg-opacity-75' : 'bg-opacity-0'}`}
      aria-modal="true" 
      role="dialog"
      onClick={onCancel}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-gray-700 transition-all duration-300 ease-out"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <div className="text-gray-300 mb-6">
          {children}
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
