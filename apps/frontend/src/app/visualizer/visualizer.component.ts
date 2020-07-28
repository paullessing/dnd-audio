import { AfterViewInit, Component, ElementRef, Input, NgZone, ViewChild } from '@angular/core';

@Component({
  selector: 'dnd-audio-visualizer',
  template: `<canvas #canvas width="600" height="150"></canvas>`,
})
export class VisualizerComponent implements AfterViewInit {
  @Input()
  public analyserNode: AnalyserNode;

  @ViewChild('canvas')
  public canvasRef: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D;

  constructor(private zone: NgZone) {
  }

  public ngAfterViewInit(): void {
    const ctx = this.ctx = this.canvasRef.nativeElement.getContext('2d');

    const WIDTH = this.canvasRef.nativeElement.width;
    const HEIGHT = this.canvasRef.nativeElement.height;

    const analyser = this.analyserNode;

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    this.zone.runOutsideAngular(() => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const draw = () => {
        analyser.getByteFrequencyData(data);

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        const barWidth = (WIDTH / bufferLength) * 2.5;
        let offsetX = 0;

        for (const barHeight of data) {
          ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
          ctx.fillRect(offsetX, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

          offsetX += barWidth + 1;
        }

        requestAnimationFrame(draw);
      };

      draw();
    });
  }
}
