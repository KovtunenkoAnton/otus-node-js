export interface TagCount {
  tag: string;
  count: number;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface Stats {
  byTags: TagCount[];
  byDate: DayCount[];
  streak: number;
}
