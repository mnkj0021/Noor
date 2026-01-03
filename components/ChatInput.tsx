
import React, { useState, useRef, ChangeEvent } from 'react';
import { useChat } from '../context/ChatContext';
import { PaperAirplaneIcon, PhotoIcon, VideoCameraIcon, MicrophoneIcon, StopIcon, XMarkIcon } from '@heroicons/react/24/solid';

const ChatInput: React.FC = () => {
  const { sendMessage, isGenerating, toggleVoiceInput, isVoiceInputActive } = useChat();
  const [inputText, setInputText] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleSend = async () => {
    if (inputText.trim() || imageFile || videoFile) {
      await sendMessage(inputText.trim(), imageFile, videoFile);
      setInputText('');
      setImageFile(null);
      setVideoFile(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setVideoFile(null); // Clear video if image is selected
    } else {
      setImageFile(null);
    }
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setImageFile(null); // Clear image if video is selected
    } else {
      setVideoFile(null);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const clearVideo = () => {
    setVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200 flex flex-col sticky bottom-0 z-10">
      {(imageFile || videoFile) && (
        <div className="flex items-center p-2 mb-2 bg-gray-100 rounded-lg text-sm text-gray-700">
          {imageFile && (
            <span className="flex items-center">
              <PhotoIcon className="h-4 w-4 mr-1 text-purple-500" /> {imageFile.name}
              <button onClick={clearImage} className="ml-2 text-gray-500 hover:text-red-500">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          )}
          {videoFile && (
            <span className="flex items-center">
              <VideoCameraIcon className="h-4 w-4 mr-1 text-purple-500" /> {videoFile.name}
              <button onClick={clearVideo} className="ml-2 text-gray-500 hover:text-red-500">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          )}
        </div>
      )}
      <div className="flex items-center space-x-2">
        <label htmlFor="image-upload" className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors">
          <PhotoIcon className="h-6 w-6 text-gray-500" />
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={imageInputRef}
            className="hidden"
            disabled={isGenerating || isVoiceInputActive || !!videoFile}
          />
        </label>
        <label htmlFor="video-upload" className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors">
          <VideoCameraIcon className="h-6 w-6 text-gray-500" />
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            ref={videoInputRef}
            className="hidden"
            disabled={isGenerating || isVoiceInputActive || !!imageFile}
          />
        </label>

        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isVoiceInputActive ? "Nadir is speaking..." : "Say something to Noor..."}
          className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200 bg-gray-50 text-gray-800"
          disabled={isGenerating || isVoiceInputActive}
        />

        <button
          onClick={toggleVoiceInput}
          className={`p-3 rounded-full transition-colors flex items-center justify-center ${
            isVoiceInputActive ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          aria-label={isVoiceInputActive ? 'Stop Voice Input' : 'Start Voice Input'}
        >
          {isVoiceInputActive ? (
            <StopIcon className="h-6 w-6" />
          ) : (
            <MicrophoneIcon className="h-6 w-6" />
          )}
        </button>

        <button
          onClick={handleSend}
          className={`p-3 rounded-full transition-colors flex items-center justify-center ${
            (inputText.trim() || imageFile || videoFile) && !isGenerating && !isVoiceInputActive
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!(inputText.trim() || imageFile || videoFile) || isGenerating || isVoiceInputActive}
          aria-label="Send Message"
        >
          <PaperAirplaneIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
