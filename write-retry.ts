// write-retry.ts — writeFileSync that survives transient Windows file locks.
// On a OneDrive-backed Desktop, OneDrive backup and Defender scanning briefly
// lock a freshly-written file; the next write to it throws EBUSY/EPERM/EACCES
// or a bare UNKNOWN (errno -4094). Those are transient — retry through them
// instead of aborting the whole sync.
import fs from "node:fs";

export function writeFileRetry(filePath: string, data: string | Buffer, tries = 8): void {
  for (let i = 0; i < tries; i++) {
    try {
      fs.writeFileSync(filePath, data);
      return;
    } catch (e: unknown) {
      const code = (e as NodeJS.ErrnoException)?.code;
      const transient =
        code === "EBUSY" || code === "EPERM" || code === "EACCES" || code === "UNKNOWN";
      if (!transient || i === tries - 1) throw e;
      // Synchronous backoff (these are CLI scripts): 150,300,…  ~5.4s over 8 tries.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150 * (i + 1));
    }
  }
}
