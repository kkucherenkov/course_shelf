export type CourseAccent = 'teal' | 'amber' | 'indigo' | 'warm' | 'coral' | 'neutral';

export interface Course {
  id: string;
  title: string;
  instructor: string;
  lessons: number;
  completed: number;
  accent: CourseAccent;
  cover?: string;
}

export type CourseState = 'auto' | 'not-started' | 'in-progress' | 'completed' | 'locked';
export type CourseRealState = 'not-started' | 'in-progress' | 'completed' | 'locked';
