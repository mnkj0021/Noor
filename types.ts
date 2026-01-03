
import { GenerateContentResponse, FunctionCall } from '@google/genai';

// Augment the Window interface to include webkitAudioContext for broader browser compatibility
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export enum MessageSender {
  NADIR = 'Nadir',
  NOOR = 'Noor',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  MAPS = 'maps',
  SEARCH = 'search',
  ERROR = 'error',
  LOADING = 'loading',
  FUNCTION_CALL = 'function_call',
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  rawResponse?: GenerateContentResponse | string; // For debugging or specific display needs
  timestamp: Date;
  groundingUrls?: { uri: string; title?: string }[];
  functionCalls?: FunctionCall[];
}

export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export interface VeoImage {
  imageBytes: string;
  mimeType: string;
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K',
}

export enum ImageAspectRatio {
  ONE_TO_ONE = '1:1',
  TWO_TO_THREE = '2:3',
  THREE_TO_TWO = '3:2',
  THREE_TO_FOUR = '3:4',
  FOUR_TO_THREE = '4:3',
  NINE_TO_SIXTEEN = '9:16',
  SIXTEEN_TO_NINE = '16:9',
  TWENTYONE_TO_NINE = '21:9',
}

export enum VideoAspectRatio {
  NINE_TO_SIXTEEN = '9:16',
  SIXTEEN_TO_NINE = '16:9',
}

export enum VideoResolution {
  P720 = '720p',
  P1080 = '1080p',
}

export enum VoiceName {
  ZEPHYR = 'Zephyr',
  PUCK = 'Puck',
  CHARON = 'Charon',
  KORE = 'Kore',
  FENRIR = 'Fenrir',
}