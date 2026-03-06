import { Listbox, Transition } from "@headlessui/react";
import React, { Fragment } from "react";
import * as Icons from "../icons";

const { ChevronsUpDown, Check } = Icons;

const SelectList = ({ lists, selected, setSelected, label, error }) => {
  return (
    <div className='w-full flex flex-col gap-2'>
      {label && <p className='text-sm font-medium text-gray-700'>{label}</p>}
      <Listbox value={selected} onChange={setSelected}>
        {({ open }) => (
          <div className='relative mt-1'>
            <Listbox.Button className={`relative w-full cursor-default rounded-lg bg-white pl-3 pr-10 text-left px-3 py-2.5 2xl:py-3 border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}>
              <span className='block truncate text-gray-900'>{selected}</span>
              <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                <ChevronsUpDown
                  className={`${open ? "rotate-180 text-blue-500" : "text-gray-400"
                    } h-4 w-4 transition-transform`}
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave='transition ease-in duration-100'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'
            >
              <Listbox.Options className='z-50 absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm'>
                {lists.map((list, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2.5 pl-10 pr-4 ${active ? "bg-blue-50 text-blue-900" : "text-gray-900"
                      }`
                    }
                    value={list}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${selected ? "font-medium" : "font-normal"
                            }`}
                        >
                          {list}
                        </span>
                        {selected ? (
                          <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600'>
                            <Check className='h-5 w-5' aria-hidden='true' />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
      {error && (
        <p className='text-xs text-red-600 flex items-center gap-1 mt-1'>
          <span className='text-red-500'>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default SelectList;
