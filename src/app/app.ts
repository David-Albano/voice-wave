import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;


  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private dataArray!: Uint8Array;
  private ctx!: CanvasRenderingContext2D;


  listening = false;


  ngOnInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
  }


  async startListening() {
    if (this.listening) return;


    this.listening = true;


    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });


    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);


    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;


    source.connect(this.analyser);


    const bufferLength = this.analyser.frequencyBinCount;
    const buffer = new ArrayBuffer(bufferLength);
    this.dataArray = new Uint8Array(buffer);


    this.animate();
  }


  animate() {
    requestAnimationFrame(() => this.animate());


    this.analyser.getByteFrequencyData(this.dataArray as unknown as Uint8Array<ArrayBuffer>);


    const canvas = this.canvasRef.nativeElement;
    const width = canvas.width;
    const height = canvas.height;


    this.ctx.clearRect(0, 0, width, height);


    const barWidth = width / this.dataArray.length;


    let x = 0;


    for (let i = 0; i < this.dataArray.length; i++) {
      const barHeight = this.dataArray[i] / 1.5;


      const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#22c55e');


      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);


      x += barWidth;
    }
  }
}
