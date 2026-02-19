import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {

  private mediaRecorder!: MediaRecorder;
  private audioChunks: Blob[] = [];
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private microphoneStream!: MediaStream;

  private silenceTimer: any = null;
  private silenceThreshold = 10;
  private silenceDuration = 3000;

  constructor(private http: HttpClient) {}

  async initMicrophone() {
    this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.microphoneStream);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);

    this.mediaRecorder = new MediaRecorder(this.microphoneStream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
  }

  getAnalyser() {
    return this.analyser;
  }

  startRecording(onStop: (blob: Blob) => void) {
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];
      onStop(blob);
    };

    this.mediaRecorder.start();
    this.detectSilence();
  }

  stopRecording() {
    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  private detectSilence() {
    const dataArray = new Uint8Array(this.analyser.fftSize);

    const checkVolume = () => {
      this.analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const x = dataArray[i] - 128;
        sum += x * x;
      }

      const volume = Math.sqrt(sum / dataArray.length);

      if (volume < this.silenceThreshold) {
        if (!this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            this.stopRecording();
          }, this.silenceDuration);
        }
      } else {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      if (this.mediaRecorder.state === 'recording') {
        requestAnimationFrame(checkVolume);
      }
    };

    requestAnimationFrame(checkVolume);
  }

  stopAll() {
    this.microphoneStream?.getTracks().forEach(track => track.stop());
  }
}
