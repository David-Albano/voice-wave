import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AudioRecorderService } from './services/audio-recorder.service';
import { WaveVisualizationService } from './services/wave-visualization.service';
import { SpeechService } from './speech.service';

type VoiceState = 'listening' | 'processing' | 'speaking';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {

  @ViewChild('waveCanvas') waveCanvas!: ElementRef<HTMLCanvasElement>;

  state = signal<VoiceState>('listening');

  constructor(
    private http: HttpClient,
    private audioService: AudioRecorderService,
    private waveService: WaveVisualizationService,
    private speechService: SpeechService
  ) {}

  async ngOnInit() {
    await this.audioService.initMicrophone();
    this.startRecording();
  }

  ngOnDestroy() {
    this.audioService.stopAll();
    this.waveService.stopWave();
  }

  updateState(newState: VoiceState) {
    this.state.set(newState);
  }

  startRecording() {
    this.updateState('listening');

    setTimeout(() => {
      this.waveService.startWave(
        this.waveCanvas,
        this.audioService.getAnalyser()
      );
    });

    this.audioService.startRecording((blob) => {
      this.waveService.stopWave();
      this.handleTranscription(blob);
    });
  }

  handleTranscription(blob: Blob) {
    this.updateState('processing');

    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');

    this.http.post<any>('http://localhost:8000/api/handle_transcription', formData)
      .subscribe({
        next: (response) => {
          this.speakText(response.text, response.language);
        },
        error: (err) => {
          console.error(err);
          this.startRecording();
        }
      });
  }

  speakText(text: string, lang: string) {
    this.updateState('speaking');

    this.speechService.speak(text, lang, () => {
      this.startRecording();
    });
  }
}
