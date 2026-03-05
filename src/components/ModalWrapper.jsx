
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useRef } from "react";
import { X } from "lucide-react";

/**
 * Enhanced ModalWrapper with title and close button support
 */
const ModalWrapper = ({ isOpen, open, onClose, setOpen, title, children, panelClassName = '' }) => {
  const cancelButtonRef = useRef(null);

  // Handle both isOpen/onClose and open/setOpen patterns
  const finalOpen = isOpen !== undefined ? isOpen : open;
  // If setOpen is provided but no onClose, use setOpen(false) or just setOpen depending on usage
  // To be safe with useState setters involved in direct callbacks, we need care.
  // However, based on analysis: setOpen(undefined) -> undefined -> falsy work for show prop.
  // But let's be robust.
  const finalClose = onClose || setOpen;

  return (
    <Transition.Root show={!!finalOpen} as={Fragment}>
      <Dialog
        as='div'
        className='relative z-50'
        initialFocus={cancelButtonRef}
        onClose={finalClose}
      >
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm' />
        </Transition.Child>

        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center sm:p-0'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
              enterTo='opacity-100 translate-y-0 sm:scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 translate-y-0 sm:scale-100'
              leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            >
              <Dialog.Panel className={`relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-2xl ${panelClassName}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={finalClose}
                    ref={cancelButtonRef}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ModalWrapper;
