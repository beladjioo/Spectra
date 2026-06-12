// HackRF One WebUSB driver — a TypeScript port of the relevant subset of
// libhackrf (receive-only): vendor control transfers for tuning/gain and the
// bulk IN endpoint for the signed-8-bit IQ stream. No third-party code; the
// protocol is documented in hackrf.h (GPL'd firmware, open protocol).

const VENDOR_GSG = 0x1d50;
export const HACKRF_FILTERS: USBDeviceFilter[] = [
  { vendorId: VENDOR_GSG, productId: 0x6089 }, // HackRF One
  { vendorId: VENDOR_GSG, productId: 0x604b }, // Jawbreaker
  { vendorId: VENDOR_GSG, productId: 0xcc15 }, // rad1o
];

// hackrf.h vendor request codes (receive path only)
const REQ_SET_TRANSCEIVER_MODE = 1;
const REQ_SAMPLE_RATE_SET = 6;
const REQ_BASEBAND_FILTER_BANDWIDTH_SET = 7;
const REQ_VERSION_STRING_READ = 15;
const REQ_SET_FREQ = 16;
const REQ_AMP_ENABLE = 17;
const REQ_BOARD_PARTID_SERIALNO_READ = 18;
const REQ_SET_LNA_GAIN = 19;
const REQ_SET_VGA_GAIN = 20;

const MODE_OFF = 0;
const MODE_RECEIVE = 1;

// valid MAX2837 baseband filter bandwidths (Hz), ascending
const FILTER_BW = [
  1750000, 2500000, 3500000, 5000000, 5500000, 6000000, 7000000, 8000000,
  9000000, 10000000, 12000000, 14000000, 15000000, 20000000, 24000000, 28000000,
];

export class HackRf {
  private constructor(private dev: USBDevice) {}
  firmware = "";
  serial = "";

  static async open(dev: USBDevice): Promise<HackRf> {
    await dev.open();
    if (dev.configuration == null) await dev.selectConfiguration(1);
    await dev.claimInterface(0);
    const h = new HackRf(dev);
    h.firmware = await h.readVersion();
    h.serial = (await h.readSerial()) || dev.serialNumber || "";
    return h;
  }

  private async ctrlOut(request: number, value = 0, index = 0, data?: ArrayBuffer) {
    const r = await this.dev.controlTransferOut(
      { requestType: "vendor", recipient: "device", request, value, index },
      data,
    );
    if (r.status !== "ok") throw new Error(`HackRF control write ${request} failed`);
  }

  private async ctrlIn(request: number, length: number, value = 0, index = 0): Promise<DataView> {
    const r = await this.dev.controlTransferIn(
      { requestType: "vendor", recipient: "device", request, value, index },
      length,
    );
    if (r.status !== "ok" || !r.data) throw new Error(`HackRF control read ${request} failed`);
    return r.data;
  }

  private async readVersion(): Promise<string> {
    try {
      const d = await this.ctrlIn(REQ_VERSION_STRING_READ, 64);
      return new TextDecoder().decode(d.buffer.slice(0, d.byteLength));
    } catch {
      return "";
    }
  }

  /** Board serial — read_partid_serialno_t { u32 part_id[2]; u32 serial_no[4] },
      formatted like hackrf_info (leading all-zero words dropped). */
  private async readSerial(): Promise<string> {
    try {
      const d = await this.ctrlIn(REQ_BOARD_PARTID_SERIALNO_READ, 24);
      if (d.byteLength < 24) return "";
      const words: string[] = [];
      for (let i = 0; i < 4; i++) {
        words.push(d.getUint32(8 + 4 * i, true).toString(16).padStart(8, "0"));
      }
      while (words.length > 2 && words[0] === "00000000") words.shift();
      return words.join("");
    } catch {
      return "";
    }
  }

  /** Tune. struct set_freq_params { u32 freq_mhz; u32 freq_hz; } little-endian. */
  async setFrequency(hz: number): Promise<void> {
    const mhz = Math.floor(hz / 1e6);
    const rem = Math.floor(hz - mhz * 1e6);
    const buf = new ArrayBuffer(8);
    const v = new DataView(buf);
    v.setUint32(0, mhz, true);
    v.setUint32(4, rem, true);
    await this.ctrlOut(REQ_SET_FREQ, 0, 0, buf);
  }

  /** Sample rate (Hz) + matching anti-alias baseband filter (~0.75 × fs). */
  async setSampleRate(hz: number): Promise<void> {
    const buf = new ArrayBuffer(8);
    const v = new DataView(buf);
    v.setUint32(0, Math.round(hz), true);
    v.setUint32(4, 1, true); // divider
    await this.ctrlOut(REQ_SAMPLE_RATE_SET, 0, 0, buf);
    const target = 0.75 * hz;
    let bw = FILTER_BW[0];
    for (const f of FILTER_BW) if (f <= target) bw = f;
    await this.ctrlOut(REQ_BASEBAND_FILTER_BANDWIDTH_SET, bw & 0xffff, bw >>> 16);
  }

  /** LNA 0–40 dB step 8; VGA 0–62 dB step 2; RF amp on/off. */
  async setGains(lna: number, vga: number, amp = false): Promise<void> {
    const l = Math.max(0, Math.min(40, Math.round(lna / 8) * 8));
    const g = Math.max(0, Math.min(62, Math.round(vga / 2) * 2));
    await this.ctrlIn(REQ_SET_LNA_GAIN, 1, 0, l);
    await this.ctrlIn(REQ_SET_VGA_GAIN, 1, 0, g);
    await this.ctrlOut(REQ_AMP_ENABLE, amp ? 1 : 0);
  }

  async startRx(): Promise<void> {
    await this.ctrlOut(REQ_SET_TRANSCEIVER_MODE, MODE_RECEIVE);
  }

  async stopRx(): Promise<void> {
    await this.ctrlOut(REQ_SET_TRANSCEIVER_MODE, MODE_OFF);
  }

  /**
   * Read one block of IQ off the bulk endpoint and convert the signed-8-bit
   * samples to the offset-128 unsigned format the shared DSP expects
   * (s8 → u8 is just flipping the sign bit).
   */
  async readSamples(samples: number): Promise<Uint8Array> {
    const r = await this.dev.transferIn(1, samples * 2);
    if (r.status === "stall") {
      await this.dev.clearHalt("in", 1);
      return new Uint8Array(0);
    }
    if (!r.data) return new Uint8Array(0);
    const u8 = new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.byteLength);
    const out = new Uint8Array(u8.length);
    for (let i = 0; i < u8.length; i++) out[i] = u8[i] ^ 0x80;
    return out;
  }

  async close(): Promise<void> {
    try {
      await this.stopRx();
    } catch {
      /* device may be gone */
    }
    try {
      await this.dev.releaseInterface(0);
      await this.dev.close();
    } catch {
      /* already closed */
    }
  }
}
