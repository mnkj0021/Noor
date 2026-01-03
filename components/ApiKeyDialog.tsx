
import React from 'react';
import { useChat } from '../context/ChatContext';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { API_KEY_BILLING_DOCS_URL } from '../constants';

const ApiKeyDialog: React.FC = () => {
  const { apiKeyNeededForVeo } = useChat();

  const handleSelectKey = async () => {
    if (typeof window.aistudio !== 'undefined' && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success and refresh behavior will handle state update.
      // The ChatContext.tsx will create a new GoogleGenAI instance on the next API call.
    } else {
      console.error('window.aistudio.openSelectKey is not available.');
    }
  };

  if (!apiKeyNeededForVeo) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-xl border border-blue-200 z-50 max-w-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-blue-800">Noor: API Key Needed</h3>
      </div>
      <p className="text-gray-700 text-sm mb-3">
        Hello Nadir, for advanced features like video or high-quality image generation,
        we need to ensure your API key is linked to a paid GCP project.
        Please select your API key.
      </p>
      <div className="flex flex-col space-y-2">
        <button
          onClick={handleSelectKey}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
        >
          Select API Key
        </button>
        <a
          href={`https://${API_KEY_BILLING_DOCS_URL}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-xs text-center"
        >
          Learn more about billing
        </a>
      </div>
    </div>
  );
};

export default ApiKeyDialog;
