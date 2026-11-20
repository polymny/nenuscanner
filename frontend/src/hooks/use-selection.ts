import { useBlocker } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

const alwaysBlock = () => true;

/** Multi-selection over a list of ids: Escape clears it, and leaving the page asks for confirmation. */
export function useSelection(selectableIds: Array<number>) {
  const [rawIds, setRawIds] = useState<Array<number>>([]);
  // Drop ids that disappeared from the list (deleted acquisition, refetch).
  const selectedIds = useMemo(() => rawIds.filter((id) => selectableIds.includes(id)), [rawIds, selectableIds]);
  const hasSelection = selectedIds.length > 0;

  const toggle = useCallback(
    (id: number, selected: boolean) =>
      setRawIds((previous) => (selected ? [...previous, id] : previous.filter((other) => other !== id))),
    []
  );
  const clear = useCallback(() => setRawIds([]), []);
  const selectAll = useCallback(() => setRawIds(selectableIds), [selectableIds]);

  useEffect(() => {
    if (!hasSelection) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // Open dialogs and popovers (role="dialog") handle Escape themselves.
      if (event.key === 'Escape' && !document.querySelector('[role="dialog"]')) clear();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasSelection, clear]);

  // Downloads submit a form, which fires beforeunload: only guard in-app navigation.
  const blocker = useBlocker({
    shouldBlockFn: alwaysBlock,
    disabled: !hasSelection,
    enableBeforeUnload: false,
    withResolver: true,
  });

  return { selectedIds, toggle, clear, selectAll, blocker };
}

export type Selection = ReturnType<typeof useSelection>;
