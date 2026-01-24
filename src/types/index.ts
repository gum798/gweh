// Weather types
export interface WeatherData {
  temp: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  clouds: number;
  description: string;
  icon: string;
  cityName: string;
  sunrise: number;
  sunset: number;
}

// Moon types
export interface MoonData {
  phase: number;
  phaseName: string;
  phaseKorean: string;
  illumination: number;
  age: number;
  emoji: string;
}

// Earthquake types
export interface EarthquakeData {
  count: number;
  maxMagnitude: number;
  avgMagnitude: number;
  nearestDistance: number;
  recentQuakes: {
    magnitude: number;
    place: string;
    time: number;
    distance: number;
  }[];
}

// NASA APOD types
export interface NasaData {
  title: string;
  url: string;
  explanation: string;
  mediaType: string;
  date: string;
}

// Omen types
export interface OmenData {
  mainOmen: string;
  subOmen: string;
  advice: string;
  luckyColor: string;
  luckyNumber: number;
  element: string;
  elementEmoji: string;
}

// Saju types
export interface SajuPillar {
  stem: string;
  branch: string;
  stemKorean: string;
  branchKorean: string;
  element: string;
  animal: string;
}

export interface SajuData {
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour: SajuPillar;
}

export interface SajuInterpretation {
  mainMessage: string;
  personality: string;
  career: string;
  relationship: string;
  health: string;
  advice: string;
}

// Personal Color types
export interface SkinSample {
  name: string;
  color: { r: number; g: number; b: number };
}

export interface PersonalColorResult {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  seasonKorean: string;
  characteristics: string;
  colorPalette: string[];
  omen?: string;
  tips?: {
    best: string;
    avoid: string;
  };
}

// Physiognomy types
export interface FaceFeatures {
  foreheadRatio: number;
  eyeDistance: number;
  noseLength: number;
  mouthWidth: number;
  faceShape: string;
}

export interface PhysiognomyResult {
  mainMessage: string;
  details: {
    part: string;
    partKorean: string;
    type: string;
    typeKorean: string;
    message: string;
  }[];
}

// Palm Reading types
export interface PalmLine {
  points: { x: number; y: number }[];
  strength: number;
}

export interface PalmLines {
  lifeLine?: PalmLine;
  headLine?: PalmLine;
  heartLine?: PalmLine;
  fateLine?: PalmLine;
}

export interface HandFeatures {
  handSize: 'small' | 'medium' | 'large';
  fingerType: 'ringDominant' | 'indexDominant' | 'balanced';
  fingerRatio: number;
  palmType: 'long' | 'square' | 'balanced';
  palmShape: number;
  normalizedPalmLength: number;
}

export interface FingerGesture {
  thumbUp: boolean;
  indexUp: boolean;
  middleUp: boolean;
  ringUp: boolean;
  pinkyUp: boolean;
  fingerCount: number;
  gestureName: string;
}

export interface PalmInterpretation {
  mainMessage: string;
  handedness: string;
  details: {
    icon: string;
    category: string;
    type: string;
    message: string;
  }[];
  advice?: string;
}

// Face Detection types
export interface Keypoint {
  x: number;
  y: number;
  z?: number;
  name?: string;
}

export interface FaceDetectionResult {
  landmarks: Keypoint[];
  skinSamples: SkinSample[];
  annotatedImage: string;
  imageWidth: number;
  imageHeight: number;
}

// Hand Detection types
export interface HandDetectionResult {
  keypoints: Keypoint[];
  handedness: string;
  features: HandFeatures;
  palmLines: PalmLines | null;
  fingerGesture: FingerGesture;
  annotatedImage: string;
  imageWidth: number;
  imageHeight: number;
}

// Component Props types
export interface LocationPromptProps {
  onRequestLocation: () => void;
  onSkip: () => void;
  error: string | null;
}

export interface OmenCardProps {
  omen: OmenData | null;
  weather: WeatherData | null;
  moon: MoonData | null;
  earthquake: EarthquakeData | null;
}

export interface DataPanelProps {
  weather: WeatherData | null;
  moon: MoonData | null;
  earthquake: EarthquakeData | null;
  nasa: NasaData | null;
}

export interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface LoadingScreenProps {
  message?: string;
}

export interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  captureLabel?: string;
  instruction?: string;
  detectType?: 'face' | 'hand';
}

// Location types
export interface Location {
  lat: number;
  lon: number;
}
