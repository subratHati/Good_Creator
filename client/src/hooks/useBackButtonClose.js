import { useEffect, useRef } from 'react';

// Makes the browser/hardware back button close a modal first, instead of
// immediately navigating away from the current page.
//
// How it works: when the modal opens, we push one extra history entry
// (without changing the URL/route). If the user presses back, the browser
// pops that extra entry — which fires a 'popstate' event — and we use that
// event to close the modal instead of letting the navigation continue.
// A second back-press then behaves normally, since the extra entry is gone.
//
// Usage in any modal component:
//   useBackButtonClose(isOpen, onClose);
// where `isOpen` is the modal's own visibility boolean and `onClose` is
// the function that hides it (e.g. () => setModal(null)).
const useBackButtonClose = (isOpen, onClose) => {
  // tracks whether THIS hook instance pushed the extra history entry,
  // so we only pop/clean up entries we actually created
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    // push a dummy history entry marking "modal open" state
    window.history.pushState({ modalOpen: true }, '');
    pushedRef.current = true;

    const handlePopState = () => {
      // the extra entry was just popped by the back button — close the
      // modal instead of doing anything else.
      pushedRef.current = false;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // if the modal is closing for a reason OTHER than the back button
      // (e.g. clicking Cancel, clicking the backdrop, saving successfully),
      // the extra history entry we pushed is still sitting there unused.
      // Clean it up by going back one step ourselves, so the back-stack
      // stays accurate and a future back-press doesn't land on a dead entry.
      if (pushedRef.current) {
        pushedRef.current = false;
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
};

export default useBackButtonClose;