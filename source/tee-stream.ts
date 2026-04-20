import {PassThrough, type TransformCallback} from 'node:stream';

const MAX_SCROLLBACK = 50;

export class TeeStream extends PassThrough {
  private spyTarget: NodeJS.WriteStream | null = null;
  private scrollback: string[] = [];

  // Make Ink treat this as a real terminal for layout purposes
  isTTY = true as const;
  columns = 80;
  rows = 24;

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    // Store in scrollback buffer
    const text = chunk.toString('utf8');
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.length > 0) {
        this.scrollback.push(line);
      }
    }
    // Trim to max size
    if (this.scrollback.length > MAX_SCROLLBACK) {
      this.scrollback = this.scrollback.slice(-MAX_SCROLLBACK);
    }

    if (this.spyTarget) {
      this.spyTarget.write(Uint8Array.from(chunk));
    }
    this.push(chunk);
    callback();
  }

  startSpy(target: NodeJS.WriteStream): void {
    // Replay scrollback first
    for (const line of this.scrollback) {
      target.write(line + '\n');
    }
    this.spyTarget = target;
  }

  stopSpy(): void {
    this.spyTarget = null;
  }
}
