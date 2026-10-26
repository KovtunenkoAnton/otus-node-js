export const MOODS = ['good', 'neutral', 'bad'] as const;

export type Mood = (typeof MOODS)[number];

export interface EntryLink {
  label: string;
  url: string;
}

export interface Entry {
  id: string;
  title: string;
  mood: Mood;
  tags: string[];
  notes: string;
  content: string;
  links: EntryLink[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EntryInput {
  title: string;
  mood?: Mood | undefined;
  tags?: string[] | undefined;
  notes?: string | undefined;
  content: string;
  links?: EntryLink[] | undefined;
}

export interface EntryUpdate {
  title?: string | undefined;
  mood?: Mood | undefined;
  tags?: string[] | undefined;
  notes?: string | undefined;
  content?: string | undefined;
  links?: EntryLink[] | undefined;
}
