import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpeechService {

  speak(text: string, lang: string, onEnd: () => void) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    utterance.onend = () => {
      onEnd();
    };

    speechSynthesis.speak(utterance);
  }
}
