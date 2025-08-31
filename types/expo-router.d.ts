import { Link, router } from 'expo-router';

declare module 'expo-router' {
  interface Router {
    push: (path: string) => void;
    replace: (path: string) => void;
    back: () => void;
  }
}