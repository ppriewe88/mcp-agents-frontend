export type StreamControlResult = {
  appendText?: string; // was in die UI soll (optional)
  // später: flags wie { log?: boolean, type?: "token"|"event", ... }
};

export function streamControl(chunk: string): StreamControlResult {
  // Beispiel: loggen, aber 1:1 durchreichen
  // (später kannst du hier chunkweise filtern/umformen/event-parsen)
  console.log("streamControl:", chunk);

  return { appendText: chunk };
}
