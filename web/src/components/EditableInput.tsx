import { useState, useRef, useEffect, HTMLAttributes, KeyboardEvent } from 'react';

type InputType = 'text' | 'number' | 'datetime-local';

type ValueType = {
  [key in InputType]: key extends 'text'
    ? string
    : key extends 'number' | 'datetime-local'
      ? number
      : never;
};

interface Props<T extends InputType> extends Omit<
  HTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  value: ValueType[T];
  onChange: (newValue: ValueType[T]) => void;
  type: T;
}

const DEFAULT_CLASSES =
  'block w-full rounded-lg border border-border-strong bg-field px-2.5 py-1.5 font-mono text-xs/5 tabular-nums text-foreground transition-colors duration-150 placeholder:text-faint focus:border-accent focus:outline-hidden';

function EditableInput<T extends InputType>({ value, onChange, type, id, className }: Props<T>) {
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

  // Sync the draft with the external value outside of editing, adjusting
  // state during render instead of in an effect.
  const [prevSync, setPrevSync] = useState({ value, isEditing });
  if (prevSync.value !== value || prevSync.isEditing !== isEditing) {
    setPrevSync({ value, isEditing });
    if (!isEditing) {
      setInputValue(value);
    }
  }

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
          className={className ?? DEFAULT_CLASSES}
          value={formattedValue(inputValue)}
          onChange={e => setInputValue(e.target.value as unknown as ValueType[T])}
          onBlur={handleSave}
          step="1"
          onKeyDownCapture={handleKeyPress}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={className ?? DEFAULT_CLASSES}
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
