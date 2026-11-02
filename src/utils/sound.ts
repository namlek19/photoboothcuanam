// Pure Web Audio API Mechanical Camera Shutter Sound (No external MP3 required)

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Synthesizes a realistic two-curtain mechanical camera shutter sound ("Tách!")
 */
export function playShutterSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. First curtain mechanical click (sharp transient noise + high pitch metallic ping)
    const bufferSize = Math.floor(ctx.sampleRate * 0.045);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 2.4);
      output[i] = (Math.random() * 2 - 1) * env;
    }

    const firstCurtainNoise = ctx.createBufferSource();
    firstCurtainNoise.buffer = noiseBuffer;

    const bandpass1 = ctx.createBiquadFilter();
    bandpass1.type = 'bandpass';
    bandpass1.frequency.setValueAtTime(2400, now);
    bandpass1.Q.setValueAtTime(1.4, now);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.65, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.042);

    firstCurtainNoise.connect(bandpass1);
    bandpass1.connect(gain1);
    gain1.connect(ctx.destination);
    firstCurtainNoise.start(now);

    // Subtle mechanical mirror slap body thump
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(340, now);
    osc1.frequency.exponentialRampToValueAtTime(65, now + 0.035);

    const oscGain1 = ctx.createGain();
    oscGain1.gain.setValueAtTime(0.42, now);
    oscGain1.gain.exponentialRampToValueAtTime(0.005, now + 0.038);

    osc1.connect(oscGain1);
    oscGain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.04);

    // 2. Second curtain return click (about 55ms later for realistic SLR/Instant feel)
    const delay = 0.055;
    const secondCurtainNoise = ctx.createBufferSource();
    secondCurtainNoise.buffer = noiseBuffer;

    const bandpass2 = ctx.createBiquadFilter();
    bandpass2.type = 'bandpass';
    bandpass2.frequency.setValueAtTime(1850, now + delay);
    bandpass2.Q.setValueAtTime(1.8, now + delay);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.48, now + delay);
    gain2.gain.exponentialRampToValueAtTime(0.008, now + delay + 0.038);

    secondCurtainNoise.connect(bandpass2);
    bandpass2.connect(gain2);
    gain2.connect(ctx.destination);
    secondCurtainNoise.start(now + delay);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(920, now + delay);
    osc2.frequency.exponentialRampToValueAtTime(180, now + delay + 0.025);

    const oscGain2 = ctx.createGain();
    oscGain2.gain.setValueAtTime(0.28, now + delay);
    oscGain2.gain.exponentialRampToValueAtTime(0.005, now + delay + 0.028);

    osc2.connect(oscGain2);
    oscGain2.connect(ctx.destination);
    osc2.start(now + delay);
    osc2.stop(now + delay + 0.03);
  } catch {
    // Ignore audio context restriction errors if user hasn't interacted yet
  }
}

