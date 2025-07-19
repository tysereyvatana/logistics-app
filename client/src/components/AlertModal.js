import React from 'react';
import Modal from './Modal';

const AlertModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="text-center w-full flex flex-col items-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-5">
          <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        {/* Message */}
        <div className="mt-2">
          <p className="text-base text-gray-600">{message}</p>
        </div>

        {/* Button */}
        <div className="mt-6 w-full">
          <button
            onClick={onClose}
            className="w-full sm:w-auto sm:px-10 py-2.5 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AlertModal;
