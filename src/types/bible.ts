export interface BookMeta {
  id: string;
  name: string;
  abbrev: string;
  testament: 'OT' | 'NT';
  order: number;
  chapters: number;
  verseCounts: number[];
  dateRange: { start: number; end: number };
}
