//! ADS-B (Mode S extended squitter, DF17/18) decoder — 1090 MHz.
//!
//! Real decoding, not presence detection: pulse-position demodulation at
//! 2 MSps, CRC-24 validation, then DF17 message parsing (callsign, altitude,
//! airborne position via global CPR, ground speed/track). The decoder keeps a
//! small table of aircraft tracks which is attached to every `Frame` while the
//! radio is tuned to 1090 MHz.
//!
//! References: ICAO Annex 10 vol IV; "The 1090 Megahertz Riddle" (Sun, 2021).

use std::collections::HashMap;
use std::time::Instant;

use num_complex::Complex;
use serde::Serialize;

pub const ADSB_FREQ_HZ: f64 = 1090e6;
const DEMOD_RATE: f64 = 2e6; // Mode S PPM decodes at 2 samples/µs
const PRE: usize = 16; // preamble length in samples (8 µs)
const LONG: usize = PRE + 112 * 2; // full extended squitter (120 µs)
const TRACK_TTL_S: f64 = 60.0; // drop aircraft not heard for this long
const CPR_PAIR_S: f64 = 10.0; // max even/odd age difference for a global fix

/// One aircraft as exposed to the UI.
#[derive(Clone, Serialize)]
pub struct Aircraft {
    pub icao: String,
    pub callsign: Option<String>,
    pub alt_ft: Option<i32>,
    pub speed_kt: Option<f32>,
    pub track_deg: Option<f32>,
    pub vrate_fpm: Option<i32>,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub msgs: u32,
    pub age_s: f32,
}

#[derive(Default)]
struct Track {
    callsign: Option<String>,
    alt_ft: Option<i32>,
    speed_kt: Option<f32>,
    track_deg: Option<f32>,
    vrate_fpm: Option<i32>,
    lat: Option<f64>,
    lon: Option<f64>,
    cpr_even: Option<(u32, u32, Instant)>,
    cpr_odd: Option<(u32, u32, Instant)>,
    msgs: u32,
    last: Option<Instant>,
}

pub struct AdsbDecoder {
    tracks: HashMap<u32, Track>,
    mag: Vec<f32>, // magnitude stream at 2 MSps
    dec_max: f32, // max-decimation carry across feed() calls
    dec_cnt: usize,
    dec_n: usize,
}

impl AdsbDecoder {
    pub fn new() -> Self {
        Self { tracks: HashMap::new(), mag: Vec::new(), dec_max: 0.0, dec_cnt: 0, dec_n: 1 }
    }

    /// Feed raw IQ at the SDR rate; magnitudes are max-decimated to 2 MSps
    /// (max, not mean: the 0.5 µs pulses must survive decimation).
    pub fn feed(&mut self, iq: &[Complex<f32>], fs: f64) {
        let d = (fs / DEMOD_RATE).round().max(1.0) as usize;
        if d != self.dec_n {
            self.dec_n = d;
            self.dec_max = 0.0;
            self.dec_cnt = 0;
        }
        self.mag.reserve(iq.len() / d + 1);
        for s in iq {
            self.dec_max = self.dec_max.max(s.norm_sqr());
            self.dec_cnt += 1;
            if self.dec_cnt >= self.dec_n {
                self.mag.push(self.dec_max);
                self.dec_max = 0.0;
                self.dec_cnt = 0;
            }
        }
        self.scan();
    }

    fn scan(&mut self) {
        let len = self.mag.len();
        if len < LONG {
            return;
        }
        let mut i = 0;
        while i + LONG <= len {
            if !preamble_at(&self.mag, i) {
                i += 1;
                continue;
            }
            let mut msg = [0u8; 14];
            for b in 0..112 {
                if self.mag[i + PRE + 2 * b] > self.mag[i + PRE + 2 * b + 1] {
                    msg[b / 8] |= 0x80 >> (b % 8);
                }
            }
            let df = msg[0] >> 3;
            if (df == 17 || df == 18) && crc24(&msg) == 0 {
                self.on_frame(&msg);
                i += LONG;
            } else {
                i += 1;
            }
        }
        // keep an un-scanned tail so a frame split across feeds still decodes
        self.mag.drain(..len - (LONG - 1));
    }

    fn on_frame(&mut self, msg: &[u8; 14]) {
        let icao = ((msg[1] as u32) << 16) | ((msg[2] as u32) << 8) | msg[3] as u32;
        let now = Instant::now();
        let t = self.tracks.entry(icao).or_default();
        t.msgs += 1;
        t.last = Some(now);

        let tc = msg[4] >> 3;
        match tc {
            1..=4 => t.callsign = decode_callsign(msg),
            9..=18 => {
                t.alt_ft = decode_alt(msg);
                let odd = me_bits(msg, 22, 1) == 1;
                let lat = me_bits(msg, 23, 17);
                let lon = me_bits(msg, 40, 17);
                if odd {
                    t.cpr_odd = Some((lat, lon, now));
                } else {
                    t.cpr_even = Some((lat, lon, now));
                }
                if let (Some(e), Some(o)) = (t.cpr_even, t.cpr_odd) {
                    let dt = if e.2 > o.2 { e.2 - o.2 } else { o.2 - e.2 };
                    if dt.as_secs_f64() <= CPR_PAIR_S {
                        if let Some((la, lo)) = cpr_global((e.0, e.1), (o.0, o.1), !odd) {
                            t.lat = Some(la);
                            t.lon = Some(lo);
                        }
                    }
                }
            }
            19 => {
                if let Some((gs, trk, vr)) = decode_velocity(msg) {
                    t.speed_kt = Some(gs);
                    t.track_deg = Some(trk);
                    t.vrate_fpm = Some(vr);
                }
            }
            _ => {}
        }
    }

    /// Current aircraft table (pruned), newest first.
    pub fn snapshot(&mut self) -> Vec<Aircraft> {
        let now = Instant::now();
        self.tracks.retain(|_, t| {
            t.last.map(|l| now.duration_since(l).as_secs_f64() < TRACK_TTL_S).unwrap_or(false)
        });
        let mut out: Vec<Aircraft> = self
            .tracks
            .iter()
            .map(|(icao, t)| Aircraft {
                icao: format!("{icao:06X}"),
                callsign: t.callsign.clone(),
                alt_ft: t.alt_ft,
                speed_kt: t.speed_kt,
                track_deg: t.track_deg,
                vrate_fpm: t.vrate_fpm,
                lat: t.lat,
                lon: t.lon,
                msgs: t.msgs,
                age_s: t.last.map(|l| now.duration_since(l).as_secs_f32()).unwrap_or(0.0),
            })
            .collect();
        out.sort_by(|a, b| a.age_s.partial_cmp(&b.age_s).unwrap());
        out
    }
}

/// dump1090-style preamble check: pulses at 0, 2, 7, 9 µs·2; quiet elsewhere.
fn preamble_at(m: &[f32], j: usize) -> bool {
    let p = &m[j..j + PRE];
    if !(p[0] > p[1]
        && p[1] < p[2]
        && p[2] > p[3]
        && p[3] < p[0]
        && p[4] < p[0]
        && p[5] < p[0]
        && p[6] < p[0]
        && p[7] > p[8]
        && p[8] < p[9]
        && p[9] > p[6])
    {
        return false;
    }
    let high = (p[0] + p[2] + p[7] + p[9]) / 6.0;
    p[11] < high && p[12] < high && p[13] < high && p[14] < high
}

/// Mode S CRC-24 (generator 0x1FFF409) over the whole 112-bit message;
/// a valid DF17/18 frame leaves a zero remainder.
fn crc24(msg: &[u8; 14]) -> u32 {
    let mut crc: u32 = 0;
    for &byte in msg {
        crc ^= (byte as u32) << 16;
        for _ in 0..8 {
            crc <<= 1;
            if crc & 0x0100_0000 != 0 {
                crc ^= 0x01FF_F409;
            }
        }
    }
    crc & 0xFF_FFFF
}

/// Bits `start..start+len` (1-based) of the 56-bit ME field (message bit 33+).
fn me_bits(msg: &[u8; 14], start: u32, len: u32) -> u32 {
    let mut v = 0u32;
    for k in 0..len {
        let bit = 32 + start - 1 + k; // 0-based bit index into the 112-bit message
        let b = (msg[(bit / 8) as usize] >> (7 - bit % 8)) & 1;
        v = (v << 1) | b as u32;
    }
    v
}

const CS_CHARSET: &[u8; 64] =
    b"#ABCDEFGHIJKLMNOPQRSTUVWXYZ##### ###############0123456789######";

fn decode_callsign(msg: &[u8; 14]) -> Option<String> {
    let mut s = String::with_capacity(8);
    for i in 0..8 {
        let c = CS_CHARSET[me_bits(msg, 9 + 6 * i, 6) as usize];
        if c != b'#' {
            s.push(c as char);
        }
    }
    let s = s.trim().to_string();
    (!s.is_empty()).then_some(s)
}

/// 12-bit AC field of airborne-position messages; only the Q=1 (25 ft) case.
fn decode_alt(msg: &[u8; 14]) -> Option<i32> {
    let ac = me_bits(msg, 9, 12);
    if ac & 0x10 == 0 {
        return None; // Q=0 (100 ft Gillham encoding) — rare above FL500, skip
    }
    let n = ((ac & 0xFE0) >> 1) | (ac & 0x0F);
    Some((n as i32) * 25 - 1000)
}

/// TC19 subtype 1/2: ground speed (kt), track (°), vertical rate (ft/min).
fn decode_velocity(msg: &[u8; 14]) -> Option<(f32, f32, i32)> {
    let st = me_bits(msg, 6, 3);
    if st != 1 && st != 2 {
        return None; // subtypes 3/4 are airspeed-only (no ground vector)
    }
    let vew = me_bits(msg, 15, 10);
    let vns = me_bits(msg, 26, 10);
    if vew == 0 || vns == 0 {
        return None;
    }
    let scale = if st == 2 { 4.0 } else { 1.0 }; // supersonic subtype
    let vx = (vew as f32 - 1.0) * scale * if me_bits(msg, 14, 1) == 1 { -1.0 } else { 1.0 };
    let vy = (vns as f32 - 1.0) * scale * if me_bits(msg, 25, 1) == 1 { -1.0 } else { 1.0 };
    let gs = (vx * vx + vy * vy).sqrt();
    let trk = (vx.atan2(vy).to_degrees() + 360.0) % 360.0;
    let vr_raw = me_bits(msg, 38, 9);
    let vr = if vr_raw == 0 {
        0
    } else {
        (vr_raw as i32 - 1) * 64 * if me_bits(msg, 37, 1) == 1 { -1 } else { 1 }
    };
    Some((gs, trk, vr))
}

fn pmod(a: f64, b: f64) -> f64 {
    let r = a % b;
    if r < 0.0 {
        r + b
    } else {
        r
    }
}

/// Number of longitude zones at a given latitude (ICAO NL function).
fn nl(lat: f64) -> f64 {
    let a = lat.abs();
    if a < 1e-9 {
        return 59.0;
    }
    if a >= 87.0 {
        return if a > 87.0 { 1.0 } else { 2.0 };
    }
    let x = 1.0 - (std::f64::consts::PI / 30.0).cos();
    let c = (std::f64::consts::PI * lat / 180.0).cos();
    (2.0 * std::f64::consts::PI / (1.0 - x / (c * c)).acos()).floor()
}

/// Globally-unambiguous CPR decode from an even/odd pair of airborne
/// positions. `recent_even` selects which frame fixes the final position.
fn cpr_global(even: (u32, u32), odd: (u32, u32), recent_even: bool) -> Option<(f64, f64)> {
    let scale = 131072.0; // 2^17
    let (lat_e, lon_e) = (even.0 as f64 / scale, even.1 as f64 / scale);
    let (lat_o, lon_o) = (odd.0 as f64 / scale, odd.1 as f64 / scale);

    let j = (59.0 * lat_e - 60.0 * lat_o + 0.5).floor();
    let mut rlat_e = (360.0 / 60.0) * (pmod(j, 60.0) + lat_e);
    let mut rlat_o = (360.0 / 59.0) * (pmod(j, 59.0) + lat_o);
    if rlat_e >= 270.0 {
        rlat_e -= 360.0;
    }
    if rlat_o >= 270.0 {
        rlat_o -= 360.0;
    }
    if nl(rlat_e) != nl(rlat_o) {
        return None; // pair straddles a zone boundary — wait for the next one
    }

    let (rlat, lon_cpr, parity) = if recent_even { (rlat_e, lon_e, 0.0) } else { (rlat_o, lon_o, 1.0) };
    let nl_v = nl(rlat);
    let m = (lon_e * (nl_v - 1.0) - lon_o * nl_v + 0.5).floor();
    let ni = (nl_v - parity).max(1.0);
    let mut lon = (360.0 / ni) * (pmod(m, ni) + lon_cpr);
    if lon >= 180.0 {
        lon -= 360.0;
    }
    if !(-90.0..=90.0).contains(&rlat) {
        return None;
    }
    Some((rlat, lon))
}

/// Fake traffic for the simulator: a few aircraft orbiting Montpellier so the
/// ADS-B mission demos (and auto-validates) without any hardware.
pub fn sim_aircraft(t: f64) -> Vec<Aircraft> {
    let planes = [
        ("AFR1295", 0x39C4A1u32, 36000, 460.0, 0.0),
        ("EZY42QD", 0x440172u32, 24000, 410.0, 2.1),
        ("RYR9PD", 0x4CA8E5u32, 38000, 445.0, 4.2),
    ];
    planes
        .iter()
        .enumerate()
        .map(|(i, &(cs, icao, alt, kt, ph))| {
            let w = t / 120.0 + ph; // slow orbit
            Aircraft {
                icao: format!("{icao:06X}"),
                callsign: Some(cs.to_string()),
                alt_ft: Some(alt),
                speed_kt: Some(kt as f32),
                track_deg: Some(((w.to_degrees() + 90.0) % 360.0) as f32),
                vrate_fpm: Some(0),
                lat: Some(43.61 + 0.25 * w.sin() + i as f64 * 0.08),
                lon: Some(3.88 + 0.32 * w.cos() - i as f64 * 0.05),
                msgs: 40 + (t as u32 % 60) * (i as u32 + 1),
                age_s: (i as f32) * 1.7,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hex(s: &str) -> [u8; 14] {
        let mut m = [0u8; 14];
        for i in 0..14 {
            m[i] = u8::from_str_radix(&s[2 * i..2 * i + 2], 16).unwrap();
        }
        m
    }

    #[test]
    fn crc_accepts_valid_and_rejects_corrupt() {
        let good = hex("8D4840D6202CC371C32CE0576098");
        assert_eq!(crc24(&good), 0);
        let mut bad = good;
        bad[5] ^= 0x40;
        assert_ne!(crc24(&bad), 0);
    }

    #[test]
    fn decodes_callsign_klm1023() {
        // canonical example from "The 1090 MHz Riddle"
        let msg = hex("8D4840D6202CC371C32CE0576098");
        assert_eq!(msg[0] >> 3, 17);
        assert_eq!(decode_callsign(&msg).as_deref(), Some("KLM1023"));
    }

    #[test]
    fn decodes_altitude_and_global_position() {
        let even = hex("8D40621D58C382D690C8AC2863A7");
        let odd = hex("8D40621D58C386435CC412692AD6");
        assert_eq!(crc24(&even), 0);
        assert_eq!(crc24(&odd), 0);
        assert_eq!(decode_alt(&even), Some(38000));

        let e = (me_bits(&even, 23, 17), me_bits(&even, 40, 17));
        let o = (me_bits(&odd, 23, 17), me_bits(&odd, 40, 17));
        assert_eq!(e, (93000, 51372));
        assert_eq!(o, (74158, 50194));

        let (lat, lon) = cpr_global(e, o, true).unwrap();
        assert!((lat - 52.25720).abs() < 0.0005, "lat {lat}");
        assert!((lon - 3.91937).abs() < 0.0005, "lon {lon}");
    }

    #[test]
    fn decodes_ground_speed_and_track() {
        // TC19 subtype 1: 159.20 kt, 182.88°, -832 ft/min
        let msg = hex("8D485020994409940838175B284F");
        let (gs, trk, vr) = decode_velocity(&msg).unwrap();
        assert!((gs - 159.20).abs() < 0.05, "gs {gs}");
        assert!((trk - 182.88).abs() < 0.05, "trk {trk}");
        assert_eq!(vr, -832);
    }

    /// End-to-end: synthesize the RF pulse train of a real frame, feed IQ at
    /// 2 MSps, and expect the aircraft to appear in the table.
    #[test]
    fn demodulates_a_synthesized_frame() {
        let msg = hex("8D4840D6202CC371C32CE0576098");
        let floor = 0.05f32;
        let mut amp = vec![floor; 300];
        // preamble: pulses at 0, 1, 3.5, 4.5 µs (2 samples per µs)
        let mut pre = vec![floor; PRE];
        for k in [0, 2, 7, 9] {
            pre[k] = 1.0;
        }
        amp.extend_from_slice(&pre);
        for b in 0..112 {
            let bit = (msg[b / 8] >> (7 - b % 8)) & 1;
            if bit == 1 {
                amp.push(1.0);
                amp.push(floor);
            } else {
                amp.push(floor);
                amp.push(1.0);
            }
        }
        amp.extend(vec![floor; 300]);

        let iq: Vec<Complex<f32>> = amp.iter().map(|&a| Complex::new(a, 0.0)).collect();
        let mut dec = AdsbDecoder::new();
        dec.feed(&iq, DEMOD_RATE);
        let ac = dec.snapshot();
        assert_eq!(ac.len(), 1);
        assert_eq!(ac[0].icao, "4840D6");
        assert_eq!(ac[0].callsign.as_deref(), Some("KLM1023"));
    }
}
