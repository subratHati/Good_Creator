import { useEffect, useRef } from 'react';

// Makes the browser/hardware back button close a modal first, instead of
// immediately navigating away from the current page.
//
// When a modal opens we push one extra history entry (same URL). Pressing back
// pops it, which fires 'popstate', and we close the modal instead of leaving
// the page. When the modal closes any other way, we remove our extra entry.
//
// Usage: useBackButtonClose(isOpen, onClose);

let selfBacks = 0; // history.back() calls we made ourselves; their popstate must not close anything
const verdicts = new WeakMap(); // popstate event -> 'own' | 'user' (decided once, shared by all listeners)
const openModals = []; // open modals, last = top-most

const useBackButtonClose = (isOpen, onClose) => {
  // always call the latest onClose, without re-running the effect
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const token = {};
    openModals.push(token);
    window.history.pushState({ modalOpen: true }, '');
    let closedByBack = false;

    const handlePopState = (event) => {
      if (!verdicts.has(event)) {
        if (selfBacks > 0) {
          selfBacks--;
          verdicts.set(event, 'own');
        } else {
          verdicts.set(event, 'user');
        }
      }
      if (verdicts.get(event) === 'own') return; // caused by our own cleanup
      if (openModals[openModals.length - 1] !== token) return; // only the top-most modal reacts
      closedByBack = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      const index = openModals.indexOf(token);
      if (index !== -1) openModals.splice(index, 1);
      // closed some other way (Cancel, Save...): remove our extra entry, but only if it is
      // still the current one, so we never undo a page navigation
      if (!closedByBack && window.history.state && window.history.state.modalOpen) {
        selfBacks++;
        window.history.back();
      }
    };
  }, [isOpen]);
};

export default useBackButtonClose;