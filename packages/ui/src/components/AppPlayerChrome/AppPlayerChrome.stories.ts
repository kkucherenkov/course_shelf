import { ref } from 'vue';

import type { Meta, StoryObj } from '@storybook/vue3';

import AppPlayerChrome from './AppPlayerChrome.vue';

const meta: Meta<typeof AppPlayerChrome> = {
  title: 'Domain/AppPlayerChrome',
  component: AppPlayerChrome,
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'playing', 'paused', 'buffering', 'error', 'end', 'locked'],
    },
    mode: { control: 'inline-radio', options: ['overlay', 'minimal'] },
  },
  render: (args) => ({
    components: { AppPlayerChrome },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 800px; padding: var(--space-4);"><AppPlayerChrome v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppPlayerChrome>;

const base = {
  position: 425,
  duration: 1104,
  buffered: 600,
  speed: 1,
  lessonTitle: 'Lesson 12 · Quorum reads',
  lessonSubtitle: 'SECTION 04 · CONSENSUS',
  chapters: [0.18, 0.45, 0.72],
  bookmarks: [{ time: 640, label: 'Recap' }],
};

export const Playing: Story = { args: { ...base, state: 'playing' } };

export const Paused: Story = { args: { ...base, state: 'paused' } };

export const Idle: Story = { args: { ...base, state: 'idle' } };

export const Buffering: Story = { args: { ...base, state: 'buffering' } };

export const Error: Story = {
  args: {
    ...base,
    state: 'error',
    errorMessage: 'Network connection lost',
  },
};

export const Locked: Story = { args: { ...base, state: 'locked' } };

export const EndOfLesson: Story = {
  args: {
    ...base,
    position: base.duration,
    state: 'end',
    endNext: { title: 'Lesson 13 · Causal consistency', countdownSec: 5 },
  },
};

export const AtCourseStart: Story = {
  args: { ...base, state: 'playing', hasPrev: false },
  parameters: {
    docs: { description: { story: 'First lesson: the previous-lesson control is disabled.' } },
  },
};

export const Minimal: Story = { args: { ...base, mode: 'minimal' } };

export const Muted: Story = { args: { ...base, state: 'playing', muted: true } };

export const NoChaptersOrBookmarks: Story = {
  args: { ...base, chapters: [], bookmarks: [] },
};

export const Interactive: Story = {
  render: () => ({
    components: { AppPlayerChrome },
    setup() {
      const state = ref<'idle' | 'playing' | 'paused' | 'buffering'>('paused');
      const position = ref(0);
      const duration = ref(600);
      const muted = ref(false);
      const subtitlesEnabled = ref(false);
      const fullscreen = ref(false);
      const speed = ref(1);
      const lastEvent = ref<string>('—');

      function log(name: string, payload?: unknown): void {
        lastEvent.value =
          payload === undefined
            ? name
            : `${name}(${typeof payload === 'number' ? payload.toFixed(2) : String(payload)})`;
      }

      return {
        state,
        position,
        duration,
        muted,
        subtitlesEnabled,
        fullscreen,
        speed,
        lastEvent,
        onPlay: () => {
          state.value = 'playing';
          log('play');
        },
        onPause: () => {
          state.value = 'paused';
          log('pause');
        },
        onSeek: (sec: number) => {
          position.value = sec;
          log('seek', sec);
        },
        onSpeed: (rate: number) => {
          speed.value = rate;
          log('speed', rate);
        },
        onToggleSubtitles: () => {
          subtitlesEnabled.value = !subtitlesEnabled.value;
          log('toggleSubtitles');
        },
        onToggleMute: () => {
          muted.value = !muted.value;
          log('toggleMute');
        },
        onTogglePip: () => log('togglePip'),
        onToggleFullscreen: () => {
          fullscreen.value = !fullscreen.value;
          log('toggleFullscreen');
        },
        onNextLesson: () => log('nextLesson'),
        onPrevLesson: () => log('prevLesson'),
      };
    },
    template: `
      <div style="max-width: 800px; padding: var(--space-4);">
        <AppPlayerChrome
          :state="state"
          :position="position"
          :duration="duration"
          :buffered="position + 60"
          :speed="speed"
          :muted="muted"
          :subtitles-enabled="subtitlesEnabled"
          :fullscreen="fullscreen"
          lesson-title="Lesson 12 · Quorum reads"
          lesson-subtitle="SECTION 04 · CONSENSUS"
          :chapters="[0.18, 0.45, 0.72]"
          :bookmarks="[{ time: 240, label: 'Worked example' }]"
          @play="onPlay"
          @pause="onPause"
          @seek="onSeek"
          @speed="onSpeed"
          @toggle-subtitles="onToggleSubtitles"
          @toggle-mute="onToggleMute"
          @toggle-pip="onTogglePip"
          @toggle-fullscreen="onToggleFullscreen"
          @next-lesson="onNextLesson"
          @prev-lesson="onPrevLesson"
        />
        <p style="margin-top: var(--space-3); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary);">
          Last event: <strong>{{ lastEvent }}</strong>
        </p>
      </div>
    `,
  }),
};
