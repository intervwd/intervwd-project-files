export class AudioPlayer {
  constructor() {
    this.onAudioPlayedListeners = [];
    this.initialized = false;
  }

  addEventListener(event, callback) {
    if (event === "onAudioPlayed") {
      this.onAudioPlayedListeners.push(callback);
    }
  }

  async start() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;

    await this.audioContext.audioWorklet.addModule("/AudioPlayerProcessor.js");

    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      "audio-player-processor"
    );

    this.workletNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.recorderNode = this.audioContext.createScriptProcessor(512, 1, 1);
    this.recorderNode.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const outputData = event.outputBuffer.getChannelData(0);
      outputData.set(inputData);

      const samples = new Float32Array(outputData.length);
      samples.set(outputData);
      this.onAudioPlayedListeners.forEach((listener) => listener(samples));
    };

    this.maybeOverrideInitialBufferLength();
    this.initialized = true;
  }

  bargeIn() {
    this.workletNode?.port.postMessage({ type: "barge-in" });
  }

  stop() {
    this.audioContext?.close();
    this.analyser?.disconnect();
    this.workletNode?.disconnect();
    this.recorderNode?.disconnect();

    this.initialized = false;
    this.audioContext = null;
    this.analyser = null;
    this.workletNode = null;
    this.recorderNode = null;
  }

  maybeOverrideInitialBufferLength() {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("audioPlayerInitialBufferLength");
    if (!value) return;

    const bufferLength = parseInt(value);
    if (!isNaN(bufferLength)) {
      this.workletNode.port.postMessage({
        type: "initial-buffer-length",
        bufferLength,
      });
    }
  }

  playAudio(samples) {
    if (!this.initialized) {
      console.error("Audio player not initialized. Call start() first.");
      return;
    }
    this.workletNode.port.postMessage({
      type: "audio",
      audioData: samples,
    });
  }

  getSamples() {
    if (!this.initialized) return null;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return [...dataArray].map((e) => e / 128 - 1);
  }

  getVolume() {
    if (!this.initialized) return 0;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    let normSamples = [...dataArray].map((e) => e / 128 - 1);
    let sum = normSamples.reduce((acc, v) => acc + v * v, 0);
    return Math.sqrt(sum / normSamples.length);
  }
}
