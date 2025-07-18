// client/src/components/TailwindTest.js

import React from 'react';

const TailwindTest = () => {
  return (
    // This div uses several distinct Tailwind classes for easy visual confirmation.
    // bg-gradient-to-r from-purple-400 to-pink-500: A gradient background
    // p-8: Large padding all around
    // rounded-xl: Extra large rounded corners
    // shadow-lg: A large box shadow
    // text-white: White text color
    // text-center: Center-aligned text
    // my-10: Margin top and bottom
    // max-w-md: Maximum width
    // mx-auto: Center the block horizontally
    <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-8 rounded-xl shadow-lg text-white text-center my-10 max-w-md mx-auto">
      {/* Heading with specific text size and weight */}
      <h2 className="text-4xl font-extrabold mb-4">
        Tailwind CSS Test!
      </h2>
      {/* Paragraph with specific text size and opacity */}
      <p className="text-lg opacity-90">
        If you see this box styled, Tailwind CSS is working correctly!
      </p>
      {/* Button with various styling classes */}
      <button className="mt-6 bg-white text-purple-600 font-semibold py-3 px-8 rounded-full shadow-md hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105">
        Awesome!
      </button>
    </div>
  );
};

export default TailwindTest;
