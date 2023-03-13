import React, { useState } from 'react';

const Checkbox = ({
  id,
  label,
  onChange,
}: {
  id: string;
  label?: string;
  onChange?: (value: boolean) => void;
}) => {
  const [isChecked, setIsChecked] = useState(false);

  const onChangeEvent = () => {
    const newValue = !isChecked;
    if (onChange) onChange(newValue);
    setIsChecked(newValue);
  };

  return (
    <>
      <div className="relative flex items-start py-4">
        {label && (
          <div className="flex-1 min-w-0 text-sm">
            <label htmlFor={`person-${id}`} className="font-medium text-gray-700 select-none">
              {label}
            </label>
          </div>
        )}
        <div className="flex items-center h-5 ml-3">
          <input
            id={`person-${id}`}
            name={`person-${id}`}
            data-testid="input"
            type="checkbox"
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            onChange={onChangeEvent}
          />
        </div>
      </div>
    </>
  );
};

export default Checkbox;
