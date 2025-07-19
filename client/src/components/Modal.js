import React from 'react';

const Modal = ({ isOpen, onClose, title, children, size = '5xl' }) => { // Default size is '5xl' for large forms
  if (!isOpen) {
    return null;
  }

  // A map of size options to their corresponding Tailwind CSS classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl', // Added for invoice
    '5xl': 'max-w-5xl',
  };

  return (
    // Backdrop
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      {/* Modal Content - now with dynamic sizing and a subtle animation */}
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size] || sizeClasses.lg} z-50 relative animate-fade-in-up`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
