"use client";

import { useEffect } from "react";

function playInteractionSound() {
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 440;
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.07);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.07);
    window.setTimeout(() => void audio.close(), 100);
  } catch {
    // Browsers can block audio until a user gesture; functionality is unaffected.
  }
}

export default function InteractionSounds() {
  useEffect(() => {
    const handleInteraction = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("button, a, select")) playInteractionSound();
    };
    document.addEventListener("pointerdown", handleInteraction);
    document.addEventListener("keydown", handleInteraction);
    return () => {
      document.removeEventListener("pointerdown", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  return null;
}
