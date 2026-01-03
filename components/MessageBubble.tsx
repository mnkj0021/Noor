
import React from 'react';
import { ChatMessage, MessageSender, MessageType } from '../types';
import { PlayIcon, StopIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/solid';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isNoor = message.sender === MessageSender.NOOR;
  const bubbleClasses = isNoor
    ? 'bg-gradient-to-br from-indigo-100 to-purple-100 text-gray-800 self-start rounded-br-3xl rounded-tl-3xl rounded-tr-xl'
    : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white self-end rounded-bl-3xl rounded-tl-xl rounded-tr-3xl';

  const avatar = isNoor ? (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-300 text-white flex items-center justify-center text-sm font-semibold mr-2" aria-label="Noor's avatar">
      ن
    </div>
  ) : (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center text-sm font-semibold ml-2" aria-label="Nadir's avatar">
      Na
    </div>
  );

  const renderContent = () => {
    switch (message.type) {
      case MessageType.TEXT:
        return <p className="whitespace-pre-wrap">{message.text}</p>;
      case MessageType.IMAGE:
        return (
          <>
            {message.text && <p className="mb-2 whitespace-pre-wrap">{message.text}</p>}
            {message.imageUrl && (
              <img src={message.imageUrl} alt="Generated image" className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg shadow-md mt-2" />
            )}
          </>
        );
      case MessageType.VIDEO:
        return (
          <>
            {message.text && <p className="mb-2 whitespace-pre-wrap">{message.text}</p>}
            {message.videoUrl && (
              <video src={message.videoUrl} controls className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg shadow-md mt-2" />
            )}
          </>
        );
      case MessageType.AUDIO:
        return (
          <>
            {message.text && <p className="mb-2 whitespace-pre-wrap">{message.text}</p>}
            {message.audioUrl && (
              <audio controls src={message.audioUrl} className="w-full mt-2" />
            )}
          </>
        );
      case MessageType.SEARCH:
      case MessageType.MAPS:
        return (
          <>
            {message.text && <p className="mb-2 whitespace-pre-wrap">{message.text}</p>}
            {message.groundingUrls && message.groundingUrls.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-semibold flex items-center mb-1">
                  {message.type === MessageType.SEARCH ? <MagnifyingGlassIcon className="h-4 w-4 mr-1" /> : <MapPinIcon className="h-4 w-4 mr-1" />}
                  {isNoor ? 'Sources:' : 'My Sources:'}
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {message.groundingUrls.map((url, index) => (
                    <li key={index}>
                      <a href={url.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {url.title || url.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        );
      case MessageType.ERROR:
        return (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-12a1 1 0 112 0v4a1 1 0 11-2 0V6zm0 8a1 1 0 102 0 1 1 0 00-2 0z" clipRule="evenodd" />
            </svg>
            <p className="whitespace-pre-wrap">{message.text || 'An unexpected error occurred.'}</p>
          </div>
        );
      case MessageType.LOADING:
        return (
          <div className="flex items-center space-x-2 text-gray-500 italic">
            <div className="animate-pulse flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <p>{message.text || 'Thinking...'}</p>
          </div>
        );
      case MessageType.FUNCTION_CALL:
        return (
          <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM14.243 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zM5.757 14.243a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l.707-.707zM3 10a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zM4.343 5.757l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414z" />
            </svg>
            <p className="whitespace-pre-wrap">{message.text || 'Function call initiated.'}</p>
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap">{message.text || 'Unsupported message type.'}</p>;
    }
  };

  return (
    <div className={`flex items-start mb-4 ${isNoor ? 'justify-start' : 'justify-end'}`}>
      {!isNoor && avatar} {/* Nadir's avatar on the right */}
      <div className={`max-w-[70%] p-3 rounded-xl shadow-md ${bubbleClasses}`}>
        {renderContent()}
        <span className={`block text-xs mt-2 ${isNoor ? 'text-gray-500' : 'text-blue-100'} text-right`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {isNoor && avatar} {/* Noor's avatar on the left */}
    </div>
  );
};

export default MessageBubble;
