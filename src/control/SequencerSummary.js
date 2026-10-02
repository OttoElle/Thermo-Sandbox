/**
 * SequencerSummary.js
 * One-line summaries of step actions and transitions for the timeline.
 */
import { SequencerConditions } from './SequencerConditions.js';
import { summarizeAction } from './SequencerActions.js';
import { summarizeCondition } from './SequencerConditionFields.js';

export class SequencerSummary {
  static getActionSummary(act, item = null) {
    return summarizeAction(act, item);
  }

  static getTransitionSummary(trans, engine = null) {
    if (!trans) return 'Immediately';
    const norm = SequencerConditions.normalizeTransition(trans);
    const op = (o, fallback) => ((o || fallback).toUpperCase() === 'OR' || o === '||' ? '||' : '&');
    const rows = norm.rows.map(row => {
      const parts = [];
      row.conditions.forEach((c, i) => {
        parts.push(summarizeCondition(c, engine));
        if (i < row.conditions.length - 1) parts.push(op(row.operators[i], 'AND'));
      });
      const text = parts.join(' ');
      return norm.rows.length > 1 && row.conditions.length > 1 ? `(${text})` : text;
    });
    const out = [];
    rows.forEach((r, i) => {
      out.push(r);
      if (i < rows.length - 1) out.push(op(norm.rowOperators[i], 'OR'));
    });
    const timeout = norm.fallbackTimeout > 0 ? ` · max ${norm.fallbackTimeout} s` : '';
    return out.join(' ') + timeout;
  }
}
