import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
      onClick={onClose} // Close modal when clicking the backdrop
    >
      {/* Modal Content - The fix is here: changed max-w-lg to max-w-5xl */}
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-5xl p-6 z-50 relative"
        onClick={e => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-light"
          >
            &times;
          </button>
        </div>
        
        {/* Modal Body */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
