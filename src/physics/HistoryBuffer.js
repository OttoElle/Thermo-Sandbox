// Time series of the global system and of sensor zones. Samples are kept for
// the whole run: the most recent HISTORY_FULL_RES samples at full resolution,
// older ones merged pairwise whenever the buffer exceeds HISTORY_MAX, so memory
// stays bounded while the complete history remains plottable.

export const HISTORY_KEYS = [
  'historyTime', 'historyTemp', 'historyPressure', 'historyVolume',
  'historyCount', 'historyKineticEnergy', 'historyDrift', 'historyCycle'
];

export const HISTORY_INTERVAL = 0.045; // s of simulation time between samples
const HISTORY_FULL_RES = 900;           // ~40 s at full resolution
const HISTORY_MAX = 4000;

// Shared sample context: the engine sets the current sequencer cycle each
// step so global and sensor samples carry the same cycle index (P-V loops).
export const historyClock = { cycle: 0 };

export function resetHistory(target) {
  for (const k of HISTORY_KEYS) target[k] = [];
  target._historyBucket = 0;
}

// Appends one sample { t, temp, pressure, volume, count, kinetic, drift }.
export function appendHistory(target, s) {
  if (!target.historyCycle) target.historyCycle = [];
  target.historyTime.push(s.t);
  target.historyTemp.push(s.temp);
  target.historyPressure.push(s.pressure);
  target.historyVolume.push(s.volume);
  target.historyCount.push(s.count);
  target.historyKineticEnergy.push(s.kinetic);
  target.historyDrift.push(s.drift);
  target.historyCycle.push(historyClock.cycle);
  if (target.historyTime.length > HISTORY_MAX) compactHistory(target);
}

// Re-samples everything but the most recent samples into uniform time buckets
// (bucket width doubles as the run grows), so the older history keeps an even
// resolution. Values are averaged; a bucket keeps its last cycle index.
function compactHistory(target) {
  const n = target.historyTime.length;
  const old = n - HISTORY_FULL_RES;
  const t = target.historyTime;
  const t0 = t[0], span = t[old - 1] - t0;
  let bucket = target._historyBucket || HISTORY_INTERVAL;
  while (span / bucket > (HISTORY_MAX - HISTORY_FULL_RES) / 2) bucket *= 2;
  target._historyBucket = bucket;

  const out = Object.fromEntries(HISTORY_KEYS.map(k => [k, []]));
  let i = 0;
  while (i < old) {
    const b = Math.floor((t[i] - t0) / bucket);
    let j = i;
    while (j < old && Math.floor((t[j] - t0) / bucket) === b) j++;
    for (const k of HISTORY_KEYS) {
      const a = target[k];
      if (k === 'historyCycle') { out[k].push(a[j - 1]); continue; }
      let sum = 0;
      for (let m = i; m < j; m++) sum += a[m];
      out[k].push(sum / (j - i));
    }
    i = j;
  }
  for (const k of HISTORY_KEYS) target[k] = out[k].concat(target[k].slice(old));
}

export function lastHistoryTime(target) {
  const t = target.historyTime;
  return t && t.length > 0 ? t[t.length - 1] : null;
}
