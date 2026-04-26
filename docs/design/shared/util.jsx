// Shared helpers across CourseShelf design files.
const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

// Mode (dark/light) + density via data attrs on <html>
function useMode(initial = 'dark') {
  const [mode, setMode] = useState(
    () => document.documentElement.getAttribute('data-mode') || initial,
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode]);
  return [mode, setMode];
}
function useDensity(initial = 'comfortable') {
  const [density, setDensity] = useState(
    () => document.documentElement.getAttribute('data-density') || initial,
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);
  return [density, setDensity];
}

// Format seconds → HH:MM:SS or MM:SS
function fmtTime(secs) {
  secs = Math.max(0, Math.floor(secs || 0));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function fmtDuration(secs) {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// CourseShelf course mock data — realistic, no lorem
const COURSES = [
  {
    id: 'c1',
    title: 'Distributed Systems Foundations',
    instructor: 'Martin Kleppmann',
    cover: '#3F8C84',
    accent: 'teal',
    duration: 14 * 3600 + 20 * 60,
    sections: 8,
    lessons: 42,
    completed: 18,
    library: 'Computer Science',
  },
  {
    id: 'c2',
    title: 'Color, Light & Composition for Painters',
    instructor: 'Marco Bucci',
    cover: '#C8821C',
    accent: 'amber',
    duration: 9 * 3600 + 12 * 60,
    sections: 6,
    lessons: 28,
    completed: 28,
    library: 'Art',
  },
  {
    id: 'c3',
    title: 'Modern PostgreSQL — Performance Deep Dive',
    instructor: 'Lukas Fittl',
    cover: '#6B72B8',
    accent: 'indigo',
    duration: 11 * 3600 + 45 * 60,
    sections: 9,
    lessons: 36,
    completed: 4,
    library: 'Databases',
  },
  {
    id: 'c4',
    title: 'Compilers from First Principles',
    instructor: 'Erik Eidt',
    cover: '#8E8773',
    accent: 'warm',
    duration: 22 * 3600 + 10 * 60,
    sections: 12,
    lessons: 64,
    completed: 0,
    library: 'Computer Science',
  },
  {
    id: 'c5',
    title: 'Linear Algebra for Machine Learning',
    instructor: 'Mikhail Belkin',
    cover: '#5BA89F',
    accent: 'teal',
    duration: 8 * 3600 + 30 * 60,
    sections: 7,
    lessons: 24,
    completed: 12,
    library: 'Mathematics',
  },
  {
    id: 'c6',
    title: 'Audio Mixing for Podcasters',
    instructor: 'Marc Daniel Nelson',
    cover: '#D26B5C',
    accent: 'coral',
    duration: 5 * 3600 + 50 * 60,
    sections: 5,
    lessons: 18,
    completed: 18,
    library: 'Production',
  },
  {
    id: 'c7',
    title: 'Vim, Properly',
    instructor: 'Drew Neil',
    cover: '#454952',
    accent: 'neutral',
    duration: 6 * 3600 + 5 * 60,
    sections: 6,
    lessons: 22,
    completed: 7,
    library: 'Tooling',
  },
  {
    id: 'c8',
    title: 'Watercolor Landscapes — Field Practice',
    instructor: 'Anna Mason',
    cover: '#9ED2CC',
    accent: 'teal',
    duration: 7 * 3600 + 15 * 60,
    sections: 5,
    lessons: 20,
    completed: 0,
    library: 'Art',
  },
];

// Helpers exposed globally
Object.assign(window, {
  useMode,
  useDensity,
  fmtTime,
  fmtDuration,
  COURSES,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
});
