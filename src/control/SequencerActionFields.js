/**
 * SequencerActionFields.js
 * Action form for the sequencer: renders the element's sequencer fields from
 * the element schema (same controls as the tool dialog and properties panel)
 * and builds the action snapshot from the edited values.
 */
import { renderPropertyForm } from '../app/propertyForm.js';
import { actionTypeOf, actionValues, makeAction } from './SequencerActions.js';

export class SequencerActionFields {
  static getElementType(item) {
    return actionTypeOf(item) || 'unknown';
  }

  // `existingAction` may be an action or a plain set of values (e.g. defaults).
  static renderFields(container, item, existingAction = {}, onChange = null) {
    const type = actionTypeOf(item);
    if (!container || !type) return;
    const values = actionValues(item, existingAction && Object.keys(existingAction).length ? { type, ...existingAction } : null);
    container._seqValues = values;
    renderPropertyForm(container, type, values, {
      context: 'sequencer',
      onChange: () => { if (onChange) onChange(makeAction(item, values, existingAction)); }
    });
  }

  static extractSnapshot(container, item, existingAction = {}) {
    return makeAction(item, { ...(container._seqValues || actionValues(item)) }, existingAction);
  }
}
