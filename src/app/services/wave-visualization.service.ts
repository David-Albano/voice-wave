import { Injectable, ElementRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WaveVisualizationService {

  private animationId: number = 0;

  startWave(canvasRef: ElementRef<HTMLCanvasElement>, analyser: AnalyserNode) {
    this.drawWave(canvasRef, analyser);
  }

  stopWave() {
    cancelAnimationFrame(this.animationId);
  }

  private drawWave(canvasRef: ElementRef<HTMLCanvasElement>, analyser: AnalyserNode) {
    const canvas = canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const dpr = window.devicePixelRatio || 1;
    const size = 200;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    analyser.fftSize = 2048;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let time = 0;

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, size, size);

      const centerY = size / 2;

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const volume = sum / bufferLength / 255;

      drawLayer(1.6, 3, 10.3, 'rgba(0,255,255,0.7)');
      drawLayer(1.4, 4, 10.6, 'rgba(255,0,255,0.5)');
      drawLayer(1.3, 5, 11, 'rgba(0,150,255,0.9)');

      time += 0.02;

      function drawLayer(amplitudeFactor: number, frequency: number, speed: number, color: string) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;

        for (let x = 0; x <= size; x++) {
          const progress = x / size;
          const wave =
            Math.sin(progress * frequency * Math.PI * 2 + time * speed) *
            amplitudeFactor *
            80 *
            volume;

          const y = centerY + wave;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }
    };

    draw();
  }
}
