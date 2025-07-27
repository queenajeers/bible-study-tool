export type VerseContentItem =
  | string
  | { text?: string; noteId?: number; poem?: number; lineBreak?: boolean };

export interface HeadingBlock {
  type: "heading";
  content: string[];
}

export interface VerseBlock {
  type: "verse";
  number: number;
  content: VerseContentItem[];
}

export interface LineBreakBlock {
  type: "line_break";
}

export type ChapterContentBlock = HeadingBlock | VerseBlock | LineBreakBlock;

export interface Chapter {
  number: number;
  content: ChapterContentBlock[];
}

export interface Book {
  id: string;
  title: string;
}

export interface Translation {
  id: string;
  shortName: string;
}

export interface ChapterData {
  translation: Translation;
  book: Book;
  chapter: Chapter;
}
