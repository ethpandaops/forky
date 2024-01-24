import { useState, useRef, useEffect, HTMLAttributes, KeyboardEvent } from 'react';

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
    if (type === 'number') {
      return Number.parseInt(`${value}`) as ValueType[T];
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
    <>
      {isEditing ? (
        <input
          id={id}
          ref={inputRef}
          type={type}
          className="pl-2 bg-stone-100 dark:bg-stone-500 block w-full rounded-md border-0 py-1 text-stone-900 dark:text-stone-100 shadow-sm ring-1 ring-inset ring-stone-300 dark:ring-stone-700 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-stone-600 text-sm leading-6"
          value={formattedValue(inputValue)}
          onChange={(e) => setInputValue(e.target.value as unknown as ValueType[T])}
          onBlur={handleSave}
          step="1"
          onKeyDownCapture={handleKeyPress}
        />
      ) : (
        <input
          id={id}
          type={type}
          className="pl-2 bg-stone-100 dark:bg-stone-600 block w-full rounded-md border-0 py-1 text-stone-900 dark:text-stone-100 shadow-sm ring-1 ring-inset ring-stone-300 dark:ring-stone-700 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-stone-600 text-sm leading-6"
          value={formattedValue(value)}
          readOnly
          step="1"
          onFocus={() => setIsEditing(true)}
        />
      )}
    </>
  );
}

export default EditableInput;
