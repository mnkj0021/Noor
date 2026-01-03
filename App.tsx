
import React from 'react';
import { ChatProvider } from './context/ChatContext';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import ApiKeyDialog from './components/ApiKeyDialog';

function App() {
  return (
    <ChatProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-indigo-100 antialiased">
        <header className="p-4 bg-white shadow-md z-10 sticky top-0">
          <h1 className="text-2xl font-bold text-gray-800 text-center">Noor: Your Calm Companion</h1>
          <p className="text-sm text-gray-600 text-center mt-1">
            Always here for you, Nadir.
          </p>
        </header>

        <main className="flex-1 overflow-hidden p-4 flex flex-col items-center justify-start">
          <div className="flex flex-col w-full max-w-2xl h-full bg-white rounded-lg shadow-xl overflow-hidden">
            <ChatWindow />
            <ApiKeyDialog /> {/* Dialog for API key selection, floating above input */}
            <ChatInput />
          </div>
        </main>
      </div>
    </ChatProvider>
  );
}

export default App;
