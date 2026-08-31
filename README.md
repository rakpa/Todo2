# Dayline

A visual daily planner for iPhone. The entire day is one vertical timeline. Events, tasks, routines, and habits live on that same spine so you can see what to do now, what’s next, and where free time actually is.

**Your day on one timeline.**

## Why Dayline

Most planners give you a blank list. Dayline gives you time. Every scheduled block has a start and a duration. Height on the timeline is proportional to duration. Empty gaps stay visible as real space. A now-marker tracks the current time. Completed blocks strike through and fade but keep their place, so the shape of the day stays readable.

## Stack

- Expo SDK 54, React Native, TypeScript
- React Navigation native stack
- Zustand + SQLite (`expo-sqlite`) as the durable local store, with an in-memory fallback for tests and environments where SQLite cannot open
- date-fns / date-fns-tz
- Gesture Handler + Reanimated
- Expo Notifications, Haptics, Splash Screen, Fonts

Data stays on device in v1. There is no account wall and no paywall.

## Run

```bash
npm install
npm test
npm run ios      # Expo Go or a native iOS build
npm run web      # browser preview
```

iOS is the primary target. Use a development build for SQLite, notifications, and the native splash storyboard. Expo Go covers most of the timeline UI.

## First launch

1. Native splash: Dayline mark on a calm field (light and dark)
2. In-app splash (~0.8–1.4s, VoiceOver-silent except the app name)
3. Short, skippable onboarding (resume if you quit mid-flow)
4. Today’s timeline, empty except for anything you created

Returning launches skip to today after a short branded splash. Warm resumes skip the in-app splash entirely.

## Settings of note

- Replay tutorial (does not wipe data)
- Load / remove sample day
- Appearance: System / Light / Dark (theme engine chooses text contrast; blocks use color tokens, never stored font colors)
- Optional dyslexia-friendly Atkinson Hyperlegible font
- Privacy: local SQLite only unless you opt into sync later
