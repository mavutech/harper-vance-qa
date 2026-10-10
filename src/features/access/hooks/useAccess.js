import {useContext} from 'react';
import {AccessContext} from '../AccessContext';

/**
 * Returns the signed-in customer's access state.
 *
 * @returns {Object} Access context
 */
export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) throw new Error('useAccess must be used inside AccessProvider.');
  return context;
};
