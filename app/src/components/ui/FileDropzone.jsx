import { useRef, useState } from 'react';
import { Camera, FolderOpen, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/utils/browser';
import { platform } from '@/platform';
import Button from './Button';

/**
 * Drag-and-drop + file picker + camera capture. Hands the raw File to `onFile`;
 * validation and upload happen in the service layer.
 */
export default function FileDropzone({ accept, onFile, disabled, title, hint, capture = true, className }) {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) pick(e.dataTransfer.files);
      }}
      className={cx(
        'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors',
        dragging ? 'border-forest bg-forest/5' : 'border-line bg-surface',
        disabled && 'opacity-60',
        className,
      )}
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-forest" aria-hidden="true">
        <UploadCloud className="h-7 w-7" />
      </span>
      <div>
        <p className="font-semibold">{title ?? t('upload.dropTitle')}</p>
        <p className="mt-1 text-sm text-ink-muted">{hint}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {capture ? (
          <Button
            variant="primary"
            size="lg"
            icon={Camera}
            onClick={async () => {
              if (platform.isNative) {
                const file = await platform.camera.takePhoto();
                if (file) onFile(file);
              } else cameraRef.current?.click();
            }}
            disabled={disabled}
            className={platform.isNative ? '' : 'sm:hidden'}
          >
            {t('upload.takePhoto')}
          </Button>
        ) : null}
        <Button variant="secondary" icon={FolderOpen} onClick={() => fileRef.current?.click()} disabled={disabled}>
          {t('upload.chooseFile')}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />
      {capture ? (
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = '';
          }}
        />
      ) : null}
    </div>
  );
}
