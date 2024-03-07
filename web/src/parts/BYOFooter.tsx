import { memo, useRef, useState, useEffect } from 'react';

import { DocumentArrowUpIcon } from '@heroicons/react/24/solid';

import { ForkChoiceData, Frame, Checkpoint, ForkChoiceNode } from '@app/types/api';
import useFocus from '@contexts/focus';
import { processForkChoiceData } from '@utils/graph';

function validateCheckpoint(obj: unknown): { isValid: boolean; message?: string } {
  if (typeof obj !== 'object' || obj === null) {
    return { isValid: false, message: 'Checkpoint is not an object or is null.' };
  }
  const checkpoint = obj as Checkpoint;
  if (typeof checkpoint.epoch !== 'string') {
    return { isValid: false, message: 'Checkpoint epoch is not a string.' };
  }
  if (typeof checkpoint.root !== 'string') {
    return { isValid: false, message: 'Checkpoint root is not a string.' };
  }
  return { isValid: true };
}

function validateForkChoiceNode(obj: unknown): { isValid: boolean; message?: string } {
  if (typeof obj !== 'object' || obj === null) {
    return { isValid: false, message: 'ForkChoiceNode is not an object or is null.' };
  }
  const node = obj as ForkChoiceNode;
  if (typeof node.slot !== 'string') {
    return { isValid: false, message: 'slot is not a string' };
  }
  if (typeof node.block_root !== 'string') {
    return { isValid: false, message: 'block_root is not a string' };
  }
  if (typeof node.justified_epoch !== 'string') {
    return { isValid: false, message: 'justified_epoch is not a string' };
  }
  if (typeof node.finalized_epoch !== 'string') {
    return { isValid: false, message: 'finalized_epoch is not a string' };
  }
  if (typeof node.weight !== 'string') {
    return { isValid: false, message: 'weight is not a string' };
  }
  if (typeof node.validity !== 'string') {
    return { isValid: false, message: 'validity is not a string' };
  }
  if (typeof node.execution_block_hash !== 'string') {
    return { isValid: false, message: 'execution_block_hash is not a string' };
  }

  return { isValid: true };
}

function validateForkChoiceData(data: unknown): { isValid: boolean; message?: string } {
  if (typeof data !== 'object' || data === null) {
    return { isValid: false, message: 'Data is not an object or is null.' };
  }

  const castedData = data as ForkChoiceData;

  if (!castedData.fork_choice_nodes) {
    return { isValid: false, message: 'fork_choice_nodes is missing.' };
  }

  if (castedData.justified_checkpoint) {
    const justifiedResult = validateCheckpoint(castedData.justified_checkpoint);
    if (!justifiedResult.isValid) {
      return { isValid: false, message: `justified_checkpoint error: ${justifiedResult.message}` };
    }
  }

  if (castedData.finalized_checkpoint) {
    const finalizedResult = validateCheckpoint(castedData.finalized_checkpoint);
    if (!finalizedResult.isValid) {
      return { isValid: false, message: `finalized_checkpoint error: ${finalizedResult.message}` };
    }
  }

  if (castedData.fork_choice_nodes) {
    for (let i = 0; i < castedData.fork_choice_nodes.length; i++) {
      const nodeResult = validateForkChoiceNode(castedData.fork_choice_nodes[i]);
      if (!nodeResult.isValid) {
        return {
          isValid: false,
          message: `fork_choice_nodes[${i + 1}] error: ${nodeResult.message}`,
        };
      }
    }
  }

  return { isValid: true };
}

function BYOFooter() {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setBYOData } = useFocus();

  const readFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      try {
        const jsonData = JSON.parse(text as string);
        const validation = validateForkChoiceData(jsonData);

        if (validation.isValid) {
          const frame: Required<Frame> = {
            metadata: {
              id: `${Math.random()}`,
              node: 'byo',
              fetched_at: new Date().toISOString(),
              wall_clock_slot: 0,
              wall_clock_epoch: 0,
            },
            data: jsonData,
          };
          setBYOData(processForkChoiceData(frame));
        } else {
          setError(`Invalid fork choice json format: ${validation.message}`);
        }
      } catch (error) {
        // Not valid JSON
        setError('The file is not valid JSON.');
      }
    };

    reader.onerror = (e) => {
      console.error('Error reading file:', e);
      setError('Error reading file');
    };

    reader.readAsText(file); // Read the file as text
  };
  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      setError(undefined);
      setDragging(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      if (event.dataTransfer?.files) {
        const files = event.dataTransfer.files;
        if (files.length > 1) {
          setError('Please only upload one file');
        } else {
          readFile(files[0]);
        }
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragleave', handleDragLeave);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragleave', handleDragLeave);
    };
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length === 1) {
      readFile(files[0]);
    } else if (files && files.length > 1) {
      setError('Please only upload one file');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="fixed left-0 w-full bottom-0 bg-stone-300 dark:bg-stone-800"
      style={{ height: 148 }}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      <div className="flex h-full items-center justify-center text-stone-900 dark:text-stone-100 gap-x-10">
        <button className="flex flex-col items-center" onClick={handleButtonClick}>
          <span className="flex items-center rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5 gap-2 text-lg p-4">
            <DocumentArrowUpIcon className="h-10 w-10" />
          </span>
          {error && <div className="text-red-500">{error}</div>}
          {!error &&
            (dragging ? (
              'Drop to view'
            ) : (
              <span>
                Upload beacon API{' '}
                <a
                  href="https://ethereum.github.io/beacon-APIs/?urls.primaryName=dev#/Debug/getDebugForkChoice"
                  className="font-bold text-stone-800 dark:text-stone-50"
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noreferrer"
                >
                  /eth/v1/debug/fork_choice
                </a>{' '}
                fork choice JSON
              </span>
            ))}
        </button>
      </div>
    </div>
  );
}

export default memo(BYOFooter);
