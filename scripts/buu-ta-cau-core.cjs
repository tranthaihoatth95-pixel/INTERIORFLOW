'use strict';

/** Quyết định thuần của bưu tá; tách khỏi I/O để ca đột biến chạy được bằng sucrase-node. */
const scope = (e) => e.target_system ? `${e.target_system}:${e.target_lane}`
  : (typeof e.to === 'string' && /^(cx|cl):\d{2}$/.test(e.to) ? e.to : `legacy:${e.lane || e.to || '?'}`);
const key = (e) => `${scope(e)}|${e.type === 'HANDOFF' ? e.id : e.handoffId}`;
const tap = (events, type) => new Set(events.filter((e) => e.type === type).map(key));

function viecCanGiao(events, now = Date.now()) {
  const ack = tap(events, 'ACK');
  const seen = tap(events, 'SEEN');
  const sent = tap(events, 'SENT');
  const wake = new Set([...tap(events, 'WAKE'), ...tap(events, 'WAKE_ATTEMPTED')]);
  const attempts = new Map();
  for (const e of events) if (e.type === 'DISPATCH_ATTEMPT') attempts.set(key(e), e);
  return events.filter((e) => e.type === 'HANDOFF')
    .filter((e) => !ack.has(key(e)) && !seen.has(key(e)) && !sent.has(key(e)) && !wake.has(key(e)))
    .filter((e) => {
      const a = attempts.get(key(e));
      return !a?.nextAt || Date.parse(a.nextAt) <= now;
    });
}

function backoffMs(soLan, baseMs, maxMs) {
  return Math.min(maxMs, baseMs * (2 ** Math.max(0, soLan - 1)));
}

module.exports = { viecCanGiao, backoffMs, key };
