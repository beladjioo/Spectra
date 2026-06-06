#!/usr/bin/env python3
"""LoRa activity detector for the HackRF (no decode, no third-party code).

Listens continuously to the EU 868 MHz g1 sub-band (868.0-868.6, captured at
868.3 ± 1 MHz) and detects transmission BURSTS (uplinks) by energy: for each
burst it measures peak power and duration, keeps only LoRa-plausible durations
(~8-2500 ms), and every few seconds prints a JSON summary line:

  {"channel_mhz":868.3,"bursts_per_min":N,"last_burst_db":x,"max_burst_db":y,"noise_floor_db":z}

Indicative coverage signal — it does NOT decode LoRaWAN (no DevAddr) and may also
catch other 868 SRD bursts. Pure numpy + SoapySDR. Receive-only.
"""
from __future__ import annotations

import json
import math
import sys
import time

import numpy as np
import SoapySDR
from SoapySDR import SOAPY_SDR_CF32, SOAPY_SDR_RX

FS = 2_000_000          # covers 867.3-869.3 -> the g1 channels 868.1/.3/.5
CENTER = 868.3e6
DEC = 64                # power envelope at FS/DEC ≈ 31.25 kHz (~32 µs/sample)
SNR_TRIGGER_DB = 8.0    # a burst = > 8 dB above the noise floor
DUR_MIN_MS, DUR_MAX_MS = 8.0, 2500.0
REPORT_S = 3.0


def to_db(p: float) -> float:
    return 10.0 * math.log10(p + 1e-12)


def main() -> int:
    sdr = SoapySDR.Device(dict(driver="hackrf"))
    sdr.setSampleRate(SOAPY_SDR_RX, 0, FS)
    sdr.setFrequency(SOAPY_SDR_RX, 0, CENTER)
    for name, val in (("AMP", 0), ("LNA", 32), ("VGA", 30)):
        try:
            sdr.setGain(SOAPY_SDR_RX, 0, name, val)
        except Exception:  # noqa: BLE001
            pass
    st = sdr.setupStream(SOAPY_SDR_RX, SOAPY_SDR_CF32)
    sdr.activateStream(st)

    N = 65536
    buf = np.empty(N, np.complex64)
    noise = None
    trigger = 10 ** (SNR_TRIGGER_DB / 10)
    in_burst = False
    burst_peak = 0.0
    burst_len = 0
    bursts: list[float] = []
    last_db = None
    max_db = None
    t_report = time.time()

    try:
        while True:
            sr = sdr.readStream(st, [buf], N, timeoutUs=1_000_000)
            n = sr.ret
            if n <= 0:
                continue
            x = buf[:n]
            pw = x.real.astype(np.float32) ** 2 + x.imag.astype(np.float32) ** 2
            m = (n // DEC) * DEC
            env = pw[:m].reshape(-1, DEC).mean(axis=1)  # power per ~32 µs
            cur_noise = float(np.percentile(env, 20))
            noise = cur_noise if noise is None else 0.95 * noise + 0.05 * cur_noise
            thr = noise * trigger
            for p in env:
                if p > thr:
                    if not in_burst:
                        in_burst, burst_peak, burst_len = True, p, 1
                    else:
                        burst_peak = max(burst_peak, p); burst_len += 1
                elif in_burst:
                    dur_ms = burst_len * DEC / FS * 1000.0
                    if DUR_MIN_MS <= dur_ms <= DUR_MAX_MS:
                        bursts.append(time.time())
                        last_db = round(to_db(burst_peak), 1)
                        max_db = last_db if max_db is None else max(max_db, last_db)
                    in_burst, burst_peak, burst_len = False, 0.0, 0

            now = time.time()
            if now - t_report >= REPORT_S:
                bursts = [t for t in bursts if now - t <= 60]
                print(json.dumps({
                    "channel_mhz": round(CENTER / 1e6, 2),
                    "bursts_per_min": len(bursts),
                    "last_burst_db": last_db,
                    "max_burst_db": max_db,
                    "noise_floor_db": round(to_db(noise), 1),
                }), flush=True)
                t_report = now
                max_db = None
    except (BrokenPipeError, KeyboardInterrupt):
        pass
    finally:
        sdr.deactivateStream(st)
        sdr.closeStream(st)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
