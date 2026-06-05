#!/usr/bin/env python3
"""Minimal wideband-FM demodulator for the HackRF (via SoapySDR).

Reads IQ from the HackRF, demodulates broadcast FM, and writes signed 16-bit
mono PCM at 48 kHz to stdout (meant to be piped into ffmpeg for MP3 streaming).

  python3 fm_demod.py <freq_mhz>

Pure numpy/scipy DSP — no third-party binaries. Filter states are carried across
blocks so the audio is continuous (no clicks at block boundaries).
"""
import math
import sys

import numpy as np
import SoapySDR
from SoapySDR import SOAPY_SDR_CF32, SOAPY_SDR_RX
from scipy.signal import firwin, lfilter, lfilter_zi

FS = 2_400_000        # HackRF sample rate (>= 2 MHz minimum)
DEC1 = 10             # IQ decimation -> 240 kHz (keeps the ~200 kHz WBFM channel)
FS1 = FS // DEC1      # 240_000
DEC2 = 5              # audio decimation -> 48 kHz
FS_AUDIO = FS1 // DEC2  # 48_000


def main() -> int:
    freq_hz = float(sys.argv[1]) * 1e6 if len(sys.argv) > 1 else 100_000_000.0

    # anti-alias FIRs (kept short for CPU; carry state between blocks)
    b_iq = firwin(33, 100_000, fs=FS).astype(np.float64)
    b_audio = firwin(33, 15_000, fs=FS1).astype(np.float64)
    # 50 us de-emphasis (EU broadcast)
    alpha = math.exp(-1.0 / (FS_AUDIO * 50e-6))
    de_b, de_a = [1 - alpha], [1.0, -alpha]

    zr = lfilter_zi(b_iq, 1) * 0.0
    zi = lfilter_zi(b_iq, 1) * 0.0
    za = lfilter_zi(b_audio, 1) * 0.0
    zd = lfilter_zi(de_b, de_a) * 0.0
    prev = np.complex64(0)

    sdr = SoapySDR.Device(dict(driver="hackrf"))
    sdr.setSampleRate(SOAPY_SDR_RX, 0, FS)
    sdr.setFrequency(SOAPY_SDR_RX, 0, freq_hz)
    for name, val in (("AMP", 0), ("LNA", 32), ("VGA", 30)):
        try:
            sdr.setGain(SOAPY_SDR_RX, 0, name, val)
        except Exception:  # noqa: BLE001 - gain element names vary
            pass
    st = sdr.setupStream(SOAPY_SDR_RX, SOAPY_SDR_CF32)
    sdr.activateStream(st)

    N = 240_000  # ~0.1 s per block
    buf = np.empty(N, np.complex64)
    out = sys.stdout.buffer

    try:
        while True:
            sr = sdr.readStream(st, [buf], N, timeoutUs=2_000_000)
            n = sr.ret
            if n <= 0:
                continue
            x = buf[:n]
            # low-pass IQ then decimate to 240 kHz
            xr, zr = lfilter(b_iq, 1, x.real.astype(np.float64), zi=zr)
            xi, zi = lfilter(b_iq, 1, x.imag.astype(np.float64), zi=zi)
            iq = (xr + 1j * xi)[::DEC1]
            if len(iq) < 2:
                continue
            # FM discriminator (instantaneous frequency), continuous across blocks
            seq = np.empty(len(iq) + 1, np.complex128)
            seq[0] = prev
            seq[1:] = iq
            prev = iq[-1]
            disc = np.angle(seq[1:] * np.conj(seq[:-1]))
            # audio low-pass + decimate to 48 kHz
            af, za = lfilter(b_audio, 1, disc, zi=za)
            audio = af[::DEC2]
            # de-emphasis
            audio, zd = lfilter(de_b, de_a, audio, zi=zd)
            # scale to int16 (0.4 ~ headroom for ±75 kHz deviation)
            audio = np.clip(audio * 0.4, -1.0, 1.0)
            out.write((audio * 32767).astype("<i2").tobytes())
            out.flush()
    except (BrokenPipeError, KeyboardInterrupt):
        pass
    finally:
        sdr.deactivateStream(st)
        sdr.closeStream(st)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
