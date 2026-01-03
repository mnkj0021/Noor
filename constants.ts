
import { ImageAspectRatio, ImageSize, VoiceName, VideoAspectRatio, VideoResolution } from './types';

export const GEMINI_PRO = 'gemini-3-pro-preview';
export const GEMINI_FLASH = 'gemini-3-flash-preview';
export const GEMINI_FLASH_LITE = 'gemini-flash-lite-latest';
export const GEMINI_FLASH_IMAGE = 'gemini-2.5-flash-image';
export const GEMINI_PRO_IMAGE = 'gemini-3-pro-image-preview';
export const GEMINI_TTS = 'gemini-2.5-flash-preview-tts';
export const GEMINI_LIVE_AUDIO = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const GEMINI_MAPS = 'gemini-2.5-flash'; // For maps grounding

export const VEO_FAST_GENERATE = 'veo-3.1-fast-generate-preview';
export const VEO_GENERATE = 'veo-3.1-generate-preview';

export const DEFAULT_IMAGE_SIZE = ImageSize.K1;
export const DEFAULT_IMAGE_ASPECT_RATIO = ImageAspectRatio.SIXTEEN_TO_NINE;

export const DEFAULT_VIDEO_RESOLUTION = VideoResolution.P720;
export const DEFAULT_VIDEO_ASPECT_RATIO = VideoAspectRatio.SIXTEEN_TO_NINE;

export const DEFAULT_VOICE_NAME = VoiceName.KORE;

export const API_KEY_BILLING_DOCS_URL = 'ai.google.dev/gemini-api/docs/billing';

export const JPEG_QUALITY = 0.8;
export const FRAME_RATE = 1; // Frames per second for video streaming
