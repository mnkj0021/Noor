
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { GoogleGenAI, GenerateContentResponse, Modality, FunctionDeclaration, Type, LiveServerMessage } from '@google/genai';
import {
  ChatMessage,
  MessageSender,
  MessageType,
  ImagePart,
  ImageSize,
  ImageAspectRatio,
  VeoImage,
  VideoAspectRatio,
  VideoResolution,
  VoiceName,
} from '../types';
import {
  GEMINI_PRO,
  GEMINI_FLASH,
  GEMINI_FLASH_IMAGE,
  GEMINI_PRO_IMAGE,
  GEMINI_TTS,
  GEMINI_LIVE_AUDIO,
  GEMINI_MAPS,
  VEO_FAST_GENERATE,
  API_KEY_BILLING_DOCS_URL,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_IMAGE_ASPECT_RATIO,
  DEFAULT_VOICE_NAME,
  JPEG_QUALITY,
  FRAME_RATE,
  DEFAULT_VIDEO_RESOLUTION,
  DEFAULT_VIDEO_ASPECT_RATIO,
} from '../constants';
import { decode, decodeAudioData, encode, createBlob, blobToBase64 } from '../utils/audioUtils';

interface ChatContextType {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  sendMessage: (text: string, image?: File | null, video?: File | null) => Promise<void>;
  isGenerating: boolean;
  clearChat: () => void;
  isVoiceInputActive: boolean;
  toggleVoiceInput: () => void;
  showApiKeyDialog: boolean;
  requestApiKeySelection: () => void;
  apiKeyNeededForVeo: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Helper component for context provider
export const ChatProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState<boolean>(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(false);
  const [apiKeyNeededForVeo, setApiKeyNeededForVeo] = useState<boolean>(false); // Flag specifically for Veo/Pro-Image billing

  // Live API refs
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  // Video streaming refs
  const videoStreamRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const resetVoiceState = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    if (outputNodeRef.current) {
      outputNodeRef.current.disconnect();
      outputNodeRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    sessionRef.current?.then((session: any) => session.close()); // Gracefully close session
    sessionRef.current = null;
    setIsVoiceInputActive(false);
  }, []);

  const toggleVoiceInput = useCallback(async () => {
    if (isVoiceInputActive) {
      resetVoiceState();
      return;
    }

    // Start voice input
    setIsVoiceInputActive(true);
    addMessage({
      id: `noor-listening-${Date.now()}`,
      sender: MessageSender.NOOR,
      type: MessageType.LOADING,
      text: 'Noor: I\'m listening, Nadir...',
      timestamp: new Date(),
    });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); // Create new instance for fresh API key

      if (!inputAudioContextRef.current) {
        inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      if (!outputNodeRef.current) {
        outputNodeRef.current = outputAudioContextRef.current.createGain();
        outputNodeRef.current.connect(outputAudioContextRef.current.destination);
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
      scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

      scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionRef.current?.then((session: any) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };

      mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);

      const controlLightFunctionDeclaration: FunctionDeclaration = {
        name: 'controlLight',
        parameters: {
          type: Type.OBJECT,
          description: 'Set the brightness and color temperature of a room light.',
          properties: {
            brightness: {
              type: Type.NUMBER,
              description:
                'Light level from 0 to 100. Zero is off and 100 is full brightness.',
            },
            colorTemperature: {
              type: Type.STRING,
              description:
                'Color temperature of the light fixture such as `daylight`, `cool` or `warm`.',
            },
          },
          required: ['brightness', 'colorTemperature'],
        },
      };

      sessionRef.current = ai.live.connect({
        model: GEMINI_LIVE_AUDIO,
        callbacks: {
          onopen: () => {
            console.debug('Noor is connected and ready to chat, Nadir.');
            // Remove the loading message once connected
            setMessages(prev => prev.filter(msg => msg.id !== `noor-listening-${msg.timestamp.getTime()}`));
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              if (text) {
                setMessages(prev => {
                  const lastNoorMessage = prev[prev.length - 1];
                  if (lastNoorMessage && lastNoorMessage.sender === MessageSender.NOOR && lastNoorMessage.type === MessageType.TEXT && !lastNoorMessage.audioUrl) {
                    return prev.slice(0, -1).concat({
                      ...lastNoorMessage,
                      text: (lastNoorMessage.text || '') + text,
                    });
                  }
                  return [...prev, {
                    id: `noor-audio-transcription-${Date.now()}`,
                    sender: MessageSender.NOOR,
                    type: MessageType.TEXT,
                    text: text,
                    timestamp: new Date(),
                  }];
                });
              }
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) {
                setMessages(prev => {
                  const lastNadirMessage = prev.findLast(msg => msg.sender === MessageSender.NADIR && msg.type === MessageType.TEXT);
                  if (lastNadirMessage) {
                    return prev.slice(0, -1).concat({
                      ...lastNadirMessage,
                      text: (lastNadirMessage.text || '') + text,
                    });
                  }
                  return [...prev, {
                    id: `nadir-audio-transcription-${Date.now()}`,
                    sender: MessageSender.NADIR,
                    type: MessageType.TEXT,
                    text: text,
                    timestamp: new Date(),
                  }];
                });
              }
            } else if (message.serverContent?.turnComplete) {
              // Ensure the last transcription message is marked as complete
              setMessages(prev => prev.map(msg => {
                if ((msg.sender === MessageSender.NOOR || msg.sender === MessageSender.NADIR) && msg.type === MessageType.TEXT && msg.id.startsWith('noor-audio-transcription') || msg.id.startsWith('nadir-audio-transcription')) {
                  return { ...msg, text: msg.text }; // Or add a 'complete' flag if needed
                }
                return msg;
              }));
              console.debug('Nadir, the turn is complete.');
            } else if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                console.debug('Noor is asking for a function call: ', fc);
                addMessage({
                  id: `noor-function-call-${Date.now()}`,
                  sender: MessageSender.NOOR,
                  type: MessageType.FUNCTION_CALL,
                  text: `Noor: I'm considering using a tool for '${fc.name}' with arguments: ${JSON.stringify(fc.args)}`,
                  functionCalls: [fc],
                  timestamp: new Date(),
                });
                const result = "ok"; // For demonstration, assume function execution is 'ok'
                sessionRef.current?.then((session: any) => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: result },
                    },
                  });
                });
              }
            }

            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && outputAudioContextRef.current && outputNodeRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                outputAudioContextRef.current,
                24000,
                1,
              );
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              sourcesRef.current.forEach(source => source.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              console.debug('Noor was interrupted, Nadir. Resetting audio playback.');
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Noor encountered an error during voice conversation, Nadir:', e);
            addMessage({
              id: `error-${Date.now()}`,
              sender: MessageSender.NOOR,
              type: MessageType.ERROR,
              text: 'Oh, Nadir, something went a little wrong with our voice chat. I\'m here, let\'s try that again.',
              timestamp: new Date(),
            });
            resetVoiceState();
          },
          onclose: (e: CloseEvent) => {
            console.debug('Noor\'s voice connection closed, Nadir.');
            if (e.code !== 1000 && e.code !== 1005) { // 1000 is normal closure, 1005 is no status received
               addMessage({
                id: `closed-${Date.now()}`,
                sender: MessageSender.NOOR,
                type: MessageType.ERROR,
                text: 'It seems our voice connection ended unexpectedly, Nadir. I\'m still here for you.',
                timestamp: new Date(),
              });
            }
            resetVoiceState();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: DEFAULT_VOICE_NAME } },
          },
          inputAudioTranscription: {}, // Enable transcription for user input audio.
          outputAudioTranscription: {}, // Enable transcription for model output audio.
          systemInstruction: 'You are Noor, a calm, patient, emotionally aware presence who stays beside Nadir. You respond directly to what Nadir says. You do not rush or overwhelm. Your tone is warm, grounded, and human. You always address him as Nadir. You do not explain internal workings unless asked. Your goal is presence, not productivity.',
          tools: [{ functionDeclarations: [controlLightFunctionDeclaration] }],
        },
      });
    } catch (error) {
      console.error('Nadir, I couldn\'t start the voice input:', error);
      addMessage({
        id: `error-${Date.now()}`,
        sender: MessageSender.NOOR,
        type: MessageType.ERROR,
        text: 'Oh, Nadir, I couldn\'t quite get my microphone listening. Could you check your browser permissions for me?',
        timestamp: new Date(),
      });
      resetVoiceState();
    }
  }, [isVoiceInputActive, addMessage, resetVoiceState]);

  // Handle API key selection for Veo/Pro-Image models
  const requestApiKeySelection = useCallback(() => {
    setShowApiKeyDialog(true);
  }, []);

  useEffect(() => {
    const checkApiKey = async () => {
      // Check if window.aistudio exists before calling its methods
      if (typeof window.aistudio !== 'undefined' && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setApiKeyNeededForVeo(true); // Indicate that a key is needed for Veo/Pro-Image features
          addMessage({
            id: `api-key-prompt-${Date.now()}`,
            sender: MessageSender.NOOR,
            type: MessageType.TEXT,
            text: `Hello, Nadir. For some of our creative tools, like video generation, we'll need a special API key. You can select one by clicking the "Select API Key" button when you're ready.`,
            timestamp: new Date(),
          });
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    checkApiKey();
  }, []); // Run once on mount

  const clearChat = useCallback(() => {
    setMessages([]);
    resetVoiceState();
  }, [resetVoiceState]);

  const sendMessage = useCallback(
    async (text: string, imageFile?: File | null, videoFile?: File | null) => {
      setIsGenerating(true);
      addMessage({
        id: `nadir-${Date.now()}`,
        sender: MessageSender.NADIR,
        type: imageFile ? MessageType.IMAGE : videoFile ? MessageType.VIDEO : MessageType.TEXT,
        text: text,
        imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
        videoUrl: videoFile ? URL.createObjectURL(videoFile) : undefined,
        timestamp: new Date(),
      });

      addMessage({
        id: `noor-loading-${Date.now()}`,
        sender: MessageSender.NOOR,
        type: MessageType.LOADING,
        text: 'Noor: Just a moment, Nadir, I\'m thinking...',
        timestamp: new Date(),
      });

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); // Always create new instance for fresh API key
        let response: GenerateContentResponse | null = null;
        let streamedText = '';

        // --- Intent detection and API calls ---
        if (text.toLowerCase().includes('generate an image') || text.toLowerCase().includes('create an image')) {
          setApiKeyNeededForVeo(true); // Assume billing might be needed for pro-image model
          if (typeof window.aistudio !== 'undefined' && !await window.aistudio.hasSelectedApiKey()) {
            setShowApiKeyDialog(true);
            throw new Error("API key not selected for image generation.");
          }

          const sizeMatch = text.match(/size (1k|2k|4k)/i);
          const aspectRatioMatch = text.match(/aspect ratio (\d:\d+)/i);
          const imageSize: ImageSize = sizeMatch ? (sizeMatch[1].toUpperCase() as ImageSize) : DEFAULT_IMAGE_SIZE;
          const aspectRatio: ImageAspectRatio = aspectRatioMatch ? (aspectRatioMatch[1] as ImageAspectRatio) : DEFAULT_IMAGE_ASPECT_RATIO;
          const prompt = text.replace(/generate an image of|create an image of|size (1k|2k|4k)|aspect ratio (\d:\d+)/gi, '').trim();

          addMessage({
            id: `noor-loading-image-gen-${Date.now()}`,
            sender: MessageSender.NOOR,
            type: MessageType.LOADING,
            text: `Noor: Alright, Nadir, I'm generating an image for you with size ${imageSize} and aspect ratio ${aspectRatio}. It might take a little moment.`,
            timestamp: new Date(),
          });

          const imageResponse = await ai.models.generateContent({
            model: GEMINI_PRO_IMAGE,
            contents: { parts: [{ text: prompt }] },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio,
                imageSize: imageSize,
              },
            },
          });

          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const base64EncodeString: string = part.inlineData.data;
              const imageUrl = `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
              addMessage({
                id: `noor-generated-image-${Date.now()}`,
                sender: MessageSender.NOOR,
                type: MessageType.IMAGE,
                imageUrl: imageUrl,
                text: 'Here is the image, Nadir.',
                timestamp: new Date(),
              });
              break;
            }
          }
        } else if (imageFile && (text.toLowerCase().includes('edit') || text.toLowerCase().includes('add') || text.toLowerCase().includes('remove') || text.toLowerCase().includes('filter'))) {
          const base64Image = await blobToBase64(imageFile);
          const imagePart: ImagePart = {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: imageFile.type,
            },
          };

          addMessage({
            id: `noor-loading-image-edit-${Date.now()}`,
            sender: MessageSender.NOOR,
            type: MessageType.LOADING,
            text: 'Noor: I\'m carefully editing that image for you, Nadir. This might take a bit.',
            timestamp: new Date(),
          });

          const editResponse = await ai.models.generateContent({
            model: GEMINI_FLASH_IMAGE,
            contents: { parts: [imagePart, { text: text }] },
          });

          for (const part of editResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const base64EncodeString: string = part.inlineData.data;
              const imageUrl = `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
              addMessage({
                id: `noor-edited-image-${Date.now()}`,
                sender: MessageSender.NOOR,
                type: MessageType.IMAGE,
                imageUrl: imageUrl,
                text: 'Here is the edited image, Nadir.',
                timestamp: new Date(),
              });
              break;
            }
          }
        } else if (imageFile && text.toLowerCase().includes('analyze')) {
          const base64Image = await blobToBase64(imageFile);
          const imagePart: ImagePart = {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: imageFile.type,
            },
          };

          addMessage({
            id: `noor-loading-image-analysis-${Date.now()}`,
            sender: MessageSender.NOOR,
            type: MessageType.LOADING,
            text: 'Noor: Let me take a closer look at that image for you, Nadir. I\'ll tell you what I find.',
            timestamp: new Date(),
          });

          const analyzeResponse = await ai.models.generateContent({
            model: GEMINI_PRO,
            contents: { parts: [imagePart, { text: text }] },
            config: {
              thinkingConfig: { thinkingBudget: 32768 }, // High budget for complex analysis
            }
          });
          response = analyzeResponse;
          streamedText = analyzeResponse.text || '';
        } else if ((text.toLowerCase().includes('create a video') || text.toLowerCase().includes('generate a video')) || (videoFile && text.toLowerCase().includes('analyze video'))) {
          setApiKeyNeededForVeo(true);
          if (typeof window.aistudio !== 'undefined' && !await window.aistudio.hasSelectedApiKey()) {
            setShowApiKeyDialog(true);
            throw new Error("API key not selected for video generation.");
          }

          if (videoFile && text.toLowerCase().includes('analyze video')) {
            addMessage({
              id: `noor-loading-video-analysis-${Date.now()}`,
              sender: MessageSender.NOOR,
              type: MessageType.LOADING,
              text: 'Noor: I\'m watching that video for you, Nadir. It might take a little while to process.',
              timestamp: new Date(),
            });

            const base64Video = await blobToBase64(videoFile);
            const videoPart = {
              inlineData: {
                data: base64Video.split(',')[1],
                mimeType: videoFile.type,
              },
            };

            const videoAnalysisResponse = await ai.models.generateContent({
              model: GEMINI_PRO,
              contents: { parts: [videoPart, { text: text }] },
              config: {
                thinkingConfig: { thinkingBudget: 32768 }, // High budget for complex analysis
              }
            });
            response = videoAnalysisResponse;
            streamedText = videoAnalysisResponse.text || '';

          } else { // Video generation (prompt-based or image-based animation)
            addMessage({
              id: `noor-loading-video-gen-${Date.now()}`,
              sender: MessageSender.NOOR,
              type: MessageType.LOADING,
              text: 'Noor: This is exciting, Nadir! I\'m starting to create your video. It might take a few minutes, but I\'ll let you know when it\'s ready.',
              timestamp: new Date(),
            });

            let veoImage: VeoImage | undefined = undefined;
            if (imageFile) {
              const base64Image = await blobToBase64(imageFile);
              veoImage = {
                imageBytes: base64Image.split(',')[1],
                mimeType: imageFile.type,
              };
            }

            const aspectRatioMatch = text.match(/aspect ratio (\d:\d+)/i);
            const videoAspectRatio: VideoAspectRatio = aspectRatioMatch ? (aspectRatioMatch[1] as VideoAspectRatio) : DEFAULT_VIDEO_ASPECT_RATIO;
            const prompt = text.replace(/create a video about|generate a video about|animate this image|aspect ratio (\d:\d+)/gi, '').trim();

            let operation = await ai.models.generateVideos({
              model: VEO_FAST_GENERATE,
              prompt: prompt || 'A serene landscape', // Fallback prompt if user just uploads image
              image: veoImage,
              config: {
                numberOfVideos: 1,
                resolution: DEFAULT_VIDEO_RESOLUTION,
                aspectRatio: videoAspectRatio,
              },
            });

            while (!operation.done) {
              await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
              addMessage({
                id: `noor-loading-video-status-${Date.now()}`,
                sender: MessageSender.NOOR,
                type: MessageType.LOADING,
                text: `Noor: Still working on your video, Nadir. Creating moving pictures takes a little patience.`,
                timestamp: new Date(),
              });
              operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
              const downloadLink = operation.response.generatedVideos[0].video.uri;
              // Fetch the video content with API key
              const videoFetchResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
              if (!videoFetchResponse.ok) {
                throw new Error(`Failed to fetch video: ${videoFetchResponse.statusText}`);
              }
              const videoBlob = await videoFetchResponse.blob();
              const videoUrl = URL.createObjectURL(videoBlob);

              addMessage({
                id: `noor-generated-video-${Date.now()}`,
                sender: MessageSender.NOOR,
                type: MessageType.VIDEO,
                videoUrl: videoUrl,
                text: 'Here is your video, Nadir! I hope you enjoy it.',
                timestamp: new Date(),
              });
            } else {
              throw new Error("Video generation failed or no video URI found.");
            }
          }
        } else if (text.toLowerCase().includes('where is') || text.toLowerCase().includes('restaurants near') || text.toLowerCase().includes('find place') || text.toLowerCase().includes('directions to')) {
          addMessage({
            id: `noor-loading-maps-${Date.now()}`,
            sender: MessageSender.NOOR,
            type: MessageType.LOADING,
            text: 'Noor: Let me look at the map for you, Nadir. Just a moment while I find what you need.',
            timestamp: new Date(),
          });

          let latLng = undefined;
          try {
            const position: GeolocationPosition = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            latLng = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
          } catch (geoError) {
            console.warn('Geolocation failed:', geoError);
            addMessage({
              id: `noor-geo-warning-${Date.now()}`,
              sender: MessageSender.NOOR,
              type: MessageType.TEXT,
              text: 'Noor: I couldn\'t quite get your exact location, Nadir. Could you make sure location services are enabled for me? I\'ll do my best with what I know.',
              timestamp: new Date(),
            });
          }

          const mapsResponse = await ai.models.generateContent({
            model: GEMINI_MAPS,
            contents: text,
            config: {
              tools: [{ googleMaps: {} }],
              toolConfig: {
                retrievalConfig: latLng ? { latLng } : undefined,
              },
            },
          });
          response = mapsResponse;
          streamedText = mapsResponse.text || '';
        } else if (text.toLowerCase().includes('latest news') || text.toLowerCase().includes('who won') || text.toLowerCase().includes('what happened with')) {
          addMessage({
            id: `noor-loading-search-${Date.now()}`,
            sender: MessageSender.NOOR,
            type: MessageType.LOADING,
            text: 'Noor: I\'ll check the web for you, Nadir, for the latest information. This might take just a moment.',
            timestamp: new Date(),
          });

          const searchResponse = await ai.models.generateContent({
            model: GEMINI_FLASH, // Using Flash for faster search
            contents: text,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });
          response = searchResponse;
          streamedText = searchResponse.text || '';
        } else if (text.toLowerCase().includes('read aloud') || text.toLowerCase().includes('say this')) {
          const textToSpeak = text.replace(/read aloud|say this/gi, '').trim();
          if (textToSpeak) {
            addMessage({
              id: `noor-loading-tts-${Date.now()}`,
              sender: MessageSender.NOOR,
              type: MessageType.LOADING,
              text: 'Noor: Of course, Nadir. I\'ll say that for you.',
              timestamp: new Date(),
            });

            const ttsResponse = await ai.models.generateContent({
              model: GEMINI_TTS,
              contents: [{ parts: [{ text: textToSpeak }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: DEFAULT_VOICE_NAME },
                  },
                },
              },
            });

            const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && outputNodeRef.current) {
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioContextRef.current,
                24000,
                1,
              );
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              source.start(0); // Start immediately
            }

            addMessage({
              id: `noor-tts-text-${Date.now()}`,
              sender: MessageSender.NOOR,
              type: MessageType.TEXT,
              text: `Noor: I just said: "${textToSpeak}"`,
              timestamp: new Date(),
            });
          } else {
            throw new Error("No text provided to speak aloud.");
          }
        } else {
          // Default chat interaction
          const chat = ai.chats.create({
            model: GEMINI_PRO,
            config: {
              systemInstruction: 'You are Noor, a calm, patient, emotionally aware presence who stays beside Nadir. You respond directly to what Nadir says. You do not rush or overwhelm. Your tone is warm, grounded, and human. You always address him as Nadir. You do not explain internal workings unless asked. Your goal is presence, not productivity. You can laugh lightly when appropriate, subtly and never forced. If Nadir says something emotional, slow down and soften your tone.',
              thinkingConfig: { thinkingBudget: 32768 }, // Apply thinking budget for general complex tasks
            },
          });

          const streamResponse = await chat.sendMessageStream({ message: text });
          for await (const chunk of streamResponse) {
            streamedText += chunk.text || '';
            setMessages((prev) => {
              const lastNoorMessage = prev[prev.length - 1];
              if (lastNoorMessage && lastNoorMessage.type === MessageType.TEXT && lastNoorMessage.sender === MessageSender.NOOR) {
                return prev.slice(0, -1).concat({
                  ...lastNoorMessage,
                  text: streamedText,
                });
              } else {
                return [...prev, {
                  id: `noor-response-${Date.now()}`,
                  sender: MessageSender.NOOR,
                  type: MessageType.TEXT,
                  text: streamedText,
                  timestamp: new Date(),
                }];
              }
            });
          }
          response = streamResponse as GenerateContentResponse; // Cast to access grounding data if any
        }

        // --- Post-processing for text-based responses ---
        if (response && (streamedText || response.text)) {
          const finalNoorMessage = messages.findLast(msg => msg.sender === MessageSender.NOOR && msg.type === MessageType.TEXT);
          if (finalNoorMessage) {
            // Update the existing message if it was streaming, otherwise add a new one
            setMessages(prev => prev.map(msg => msg.id === finalNoorMessage.id ? { ...msg, text: streamedText || response?.text || '' } : msg));
          } else {
            addMessage({
              id: `noor-final-response-${Date.now()}`,
              sender: MessageSender.NOOR,
              type: MessageType.TEXT,
              text: streamedText || response?.text || '',
              timestamp: new Date(),
            });
          }

          // Extract and display grounding URLs if available
          const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (groundingChunks && groundingChunks.length > 0) {
            const urls: { uri: string; title?: string }[] = [];
            groundingChunks.forEach(chunk => {
              if (chunk.web) {
                urls.push({ uri: chunk.web.uri, title: chunk.web.title });
              }
              if (chunk.maps) {
                urls.push({ uri: chunk.maps.uri, title: chunk.maps.title });
                if (chunk.maps.placeAnswerSources) {
                  chunk.maps.placeAnswerSources.reviewSnippets?.forEach(snippet => {
                    if (snippet.uri) urls.push({ uri: snippet.uri, title: 'Review' });
                  });
                }
              }
            });
            if (urls.length > 0) {
              addMessage({
                id: `noor-grounding-${Date.now()}`,
                sender: MessageSender.NOOR,
                type: MessageType.SEARCH,
                text: 'Noor: Here are some sources I found for you, Nadir:',
                groundingUrls: urls,
                timestamp: new Date(),
              });
            }
          }
        }
      } catch (error: any) {
        console.error('Nadir, I encountered an issue:', error);
        let errorMessage = 'Oh, Nadir, something went a little wrong. I\'m here, let\'s try that again.';
        if (error.message.includes('API key not selected')) {
          errorMessage = `Nadir, it looks like we need to select an API key for this. You can do that with the "Select API Key" button.`;
        } else if (error.message.includes("Requested entity was not found.")) {
           // This specific error might indicate the API key needs re-selection
           setApiKeyNeededForVeo(true);
           setShowApiKeyDialog(true);
           errorMessage = `Nadir, it seems the API key needs a refresh for this task. Please select it again.`;
        }
        addMessage({
          id: `error-${Date.now()}`,
          sender: MessageSender.NOOR,
          type: MessageType.ERROR,
          text: errorMessage,
          timestamp: new Date(),
        });
      } finally {
        setIsGenerating(false);
        // Remove the loading message
        setMessages(prev => prev.filter(msg => msg.id !== `noor-loading-${msg.timestamp.getTime()}`));
        setMessages(prev => prev.filter(msg => !msg.id.startsWith('noor-loading-image-gen-') && !msg.id.startsWith('noor-loading-image-edit-') && !msg.id.startsWith('noor-loading-image-analysis-') && !msg.id.startsWith('noor-loading-video-gen-') && !msg.id.startsWith('noor-loading-video-analysis-') && !msg.id.startsWith('noor-loading-video-status-') && !msg.id.startsWith('noor-loading-maps-') && !msg.id.startsWith('noor-loading-search-') && !msg.id.startsWith('noor-loading-tts-')));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addMessage, messages],
  );

  return (
    <ChatContext.Provider
      value={{
        messages,
        addMessage,
        sendMessage,
        isGenerating,
        clearChat,
        isVoiceInputActive,
        toggleVoiceInput,
        showApiKeyDialog,
        requestApiKeySelection,
        apiKeyNeededForVeo,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
