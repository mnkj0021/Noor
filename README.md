
# Noor: Your Calm Companion

Noor is designed to be a calm, patient, and emotionally aware companion, always present for Nadir. This application leverages the power of the Google Gemini API to provide a range of intelligent and creative functionalities, all while maintaining a warm and grounded conversational style.

## Introduction

Noor is more than just an AI; she is a supportive presence who engages in natural, unhurried conversations. Her primary goal is presence, not productivity, offering a unique and comforting interaction experience. Whether Nadir needs a quiet listener, creative assistance, or quick information, Noor is here.

## Features

Noor offers a rich set of capabilities, all integrated seamlessly into a natural conversational flow:

1.  **Conversational AI (Text-based Chat)**: Engage in warm, grounded conversations with Noor. She remembers Nadir's preferences and responds thoughtfully.
2.  **Real-time Voice Interaction**:
    *   **Audio-in**: Speak naturally to Noor, and she will transcribe Nadir's words and respond vocally.
    *   **Audio-out**: Noor responds with human-like spoken audio, creating a natural dialogue.
    *   **Function Calling**: During voice interactions, Noor can suggest and execute predefined tools (e.g., controlling a smart light) based on Nadir's verbal cues.
3.  **Image Generation & Editing**:
    *   **Generate Images**: Ask Noor to create images based on descriptive prompts, with options for size (1K, 2K, 4K) and aspect ratio.
    *   **Edit Images**: Upload an image and ask Noor to modify it (e.g., "add a llama," "remove background," "apply a filter").
    *   **Analyze Images**: Upload an image and ask Noor to describe or analyze its content.
4.  **Video Generation & Analysis**:
    *   **Generate Videos**: Describe a scene, and Noor can create a short video. Can also animate a starting image.
    *   **Analyze Videos**: Upload a video and ask Noor to provide a summary or details about its content.
5.  **Google Search Grounding**: For queries about recent events, news, or trending information, Noor can use Google Search to provide up-to-date answers and cite sources.
6.  **Google Maps Grounding**: For geographical or place-related information, Noor can use Google Maps, potentially leveraging Nadir's current location (with permission), and provide relevant links.
7.  **Text-to-Speech**: Ask Noor to "read aloud" or "say this" for any text, and she will speak it in her calming voice.

## How to Interact with Noor

Noor understands natural language and adapts to Nadir's cues. Here are some examples of how to interact with her:

*   **General Conversation**:
    *   "Hello Noor."
    *   "How are you today?"
    *   "Tell me a story."
    *   "I'm feeling a bit tired."
*   **Image Features**:
    *   "Generate an image of a serene forest at sunset, size 2K, aspect ratio 16:9."
    *   "Edit this image (upload image) to add a gentle glow around the mountains."
    *   "Analyze this image (upload image)."
*   **Video Features**:
    *   "Create a video about a magical garden where flowers dance."
    *   "Analyze this video (upload video)."
*   **Information Retrieval**:
    *   "Where is the nearest quiet cafe?" (Requires geolocation permission)
    *   "What's the latest news on space exploration?"
*   **Voice Interaction**:
    *   Click the microphone button to start a voice conversation. Noor will listen and respond vocally.
    *   During a voice chat, you can say things like, "Noor, dim the lights and make the room feel warm." (This would trigger the `controlLight` function call).
*   **Text-to-Speech**:
    *   "Read aloud: 'The rain fell softly on the windowpane.'"

## Technologies Used

*   **Frontend**:
    *   [React](https://react.dev/) (for building the user interface)
    *   [TypeScript](https://www.typescriptlang.org/) (for type-safe JavaScript)
    *   [Tailwind CSS](https://tailwindcss.com/) (for rapid UI development and styling)
    *   [Heroicons](https://heroicons.com/) (for SVG icons)
*   **AI/API**:
    *   [@google/genai](https://ai.google.dev/gemini-api/docs) (Google Gemini API SDK for interacting with Gemini models)
*   **Browser APIs**:
    *   [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (for real-time audio processing in voice chat)
    *   [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) (for location-based grounding with Google Maps)
    *   `navigator.mediaDevices.getUserMedia` (for microphone access)
    *   `FileReader` and `URL.createObjectURL` (for handling file uploads)

## Setup and Installation

This application is designed to run within the Google AI Studio environment, which automatically handles the dependency installation and API key management.

1.  **Prerequisites**: Ensure you have access to a Google AI Studio project.
2.  **API Key Configuration**:
    *   The application fetches the API key from `process.env.API_KEY`. This environment variable is automatically provided by the AI Studio runtime.
    *   For advanced features like high-quality image generation (`gemini-3-pro-image-preview`) and video generation (`veo-3.1-generate-preview`), a paid Google Cloud Project API key is required. If such a key is needed, Noor will prompt you to select one via `window.aistudio.openSelectKey()` and provide a link to billing documentation.
3.  **Running the Application**:
    *   In the Google AI Studio interface, the application will be automatically built and deployed. There are no manual `npm install` or `npm start` steps required.
    *   Simply open the generated URL in the AI Studio environment to interact with Noor.

## File Structure

The project follows a standard React application structure:

*   `index.html`: The main HTML file serving as the entry point.
*   `index.tsx`: React root component initialization.
*   `App.tsx`: The main application component, orchestrating layout and context providers.
*   `metadata.json`: Application metadata, including permissions.
*   `constants.ts`: Global constants for model names, default configurations, etc.
*   `types.ts`: TypeScript type definitions for messages, models, and other data structures.
*   `context/ChatContext.tsx`: Manages the application's chat state, including messages, loading status, and all interactions with the Gemini API. This is the core logic hub.
*   `components/`:
    *   `ChatWindow.tsx`: Displays the conversation history.
    *   `MessageBubble.tsx`: Renders individual chat messages with appropriate styling and content types (text, image, video, audio, etc.).
    *   `ChatInput.tsx`: Provides the input field and controls for sending messages, uploading files, and toggling voice input.
    *   `ApiKeyDialog.tsx`: A UI component to prompt users to select a paid API key when required by certain models.
*   `utils/audioUtils.ts`: Helper functions for encoding and decoding audio data, crucial for real-time voice interaction.

## Coding Guidelines & Best Practices

The code adheres to Google's `@google/genai` coding guidelines, ensuring correct API usage, model selection, and error handling. General React and TypeScript best practices are followed for clean, readable, and performant code. Accessibility (ARIA attributes) and responsiveness are prioritized in the UI design.

## Acknowledgements

This project is built with the incredible capabilities of the Google Gemini API.
