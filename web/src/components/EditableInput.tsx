import { useState, useRef, useEffect, HTMLAttributes, KeyboardEvent } from 'react';

import { CheckCircleIcon } from '@heroicons/react/20/solid';

type InputType = 'text' | 'number' | 'datetime-local';

type ValueType = {
  [key in InputType]: key extends 'text'
    ? string
    : key extends 'number' | 'datetime-local'
    ? number
    : never;
};

interface Props<T extends InputType>
  extends Omit<HTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: ValueType[T];
  onChange: (newValue: ValueType[T]) => void;
  type: T;
}

function EditableInput<T extends InputType>({ value, onChange, type, id }: Props<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState<ValueType[T]>(value);

  function formattedValue(value: ValueType[T]): string | number {
    if (type === 'datetime-local') {
      const now = new Date(value);
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 19);
    }
    return value;
  }

  function parsedValue(value: string | number): ValueType[T] {
    if (type === 'datetime-local') {
      const now = new Date(value);
      return now.getTime() as ValueType[T];
    }
    return value as ValueType[T];
  }

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value);
    }
  }, [value, isEditing]);

  const handleSave = () => {
    if (isEditing) {
      setIsEditing(false);
      if (inputValue !== value) {
        onChange(parsedValue(inputValue));
      }
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="mt-2 flex rounded-md shadow-sm h-10">
      {isEditing ? (
        <>
          <input
            id={id}
            ref={inputRef}
            type={type}
            className="block w-48 rounded-none rounded-l-md border-0 py-1.5 text-stone-900 ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-stone-600 sm:text-sm sm:leading-6"
            value={formattedValue(inputValue)}
            onChange={(e) => setInputValue(e.target.value as unknown as ValueType[T])}
            onBlur={handleSave}
            step="1"
            onKeyDownCapture={handleKeyPress}
          />
          <button
            type="button"
            tabIndex={-1}
            className="relative w-8 inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm bg-blue-600 font-semibold text-stone-900 ring-1 ring-inset ring-stone-300 hover:bg-blue-500"
          >
            <CheckCircleIcon className="-m-1 h-5 w-5 text-white" aria-hidden="true" />
          </button>
        </>
      ) : (
        <input
          id={id}
          type={type}
          className="block w-56 rounded-md py-1.5 text-stone-900 ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-stone-600 sm:text-sm sm:leading-6"
          value={formattedValue(value)}
          readOnly
          step="1"
          onFocus={() => setIsEditing(true)}
        />
      )}
    </div>
  );
}

export default EditableInput;
