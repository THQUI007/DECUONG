export interface PDFFile {
  id: string;
  name: string;
  size: number;
  status: 'loading' | 'success' | 'error';
  text?: string;
  error?: string;
}

export interface OutlineConfig {
  chapterName: string;
  gradeLevel: string; // "10", "11", "12", etc.
  exampleCountMin: number;
  exampleCountMax: number;
  exerciseCountMin: number;
  exerciseCountMax: number;
  exerciseCountPerType: number; // dropdown 1 to 40
  difficultyLevels: string[]; // ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']
  supplementFromInternet: boolean;
  hasAnswers: boolean;
}

export interface GenerationProgress {
  status: 'idle' | 'reading' | 'generating' | 'success' | 'error';
  message: string;
  percent: number;
  error?: string;
}
