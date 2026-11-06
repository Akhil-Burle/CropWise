import { useState } from 'react';
import { FileText, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/utils/browser';

/**
 * Shows the uploaded card with OCR-detected regions highlighted. Regions are fractions of the
 * image supplied by the service; `activeKey` emphasises the field being edited.
 */
export default function SoilCardViewer({ imageUrl, values = [], activeKey, onSelect }) {
  const { t } = useTranslation();
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(false);
  const regions = values.filter((v) => v.region);

  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-surface-2">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2">
        <figcaption className="text-sm font-semibold">{t('ocr.originalCard')}</figcaption>
        <div className="flex gap-1">
          <button
            type="button"
            className="grid min-h-touch min-w-touch place-items-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            aria-label={t('upload.rotate')}
            title={t('upload.rotate')}
          >
            <RotateCw className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="grid min-h-touch min-w-touch place-items-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink"
            onClick={() => setZoom((z) => !z)}
            aria-pressed={zoom}
            aria-label={zoom ? t('upload.zoomOut') : t('upload.zoomIn')}
            title={zoom ? t('upload.zoomOut') : t('upload.zoomIn')}
          >
            {zoom ? <ZoomOut className="h-5 w-5" aria-hidden="true" /> : <ZoomIn className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div className={cx('relative overflow-auto', zoom ? 'max-h-[70vh]' : 'max-h-[60vh]')}>
        {imageUrl ? (
          <div
            className="relative mx-auto origin-center transition-transform duration-300"
            style={{ transform: `rotate(${rotation}deg)`, width: zoom ? '160%' : '100%' }}
          >
            <img src={imageUrl} alt={t('ocr.cardAlt')} className="block w-full select-none" draggable="false" />
            {rotation === 0
              ? regions.map((v) => {
                  const active = v.key === activeKey;
                  const low = v.needsReview;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => onSelect?.(v.key)}
                      className={cx(
                        'absolute rounded-sm border-2 transition-all',
                        low ? 'border-warn bg-warn/15' : 'border-forest bg-forest/10',
                        active && 'ring-4 ring-ochre/70',
                      )}
                      style={{
                        left: `${v.region.x * 100}%`,
                        top: `${v.region.y * 100}%`,
                        width: `${v.region.w * 100}%`,
                        height: `${v.region.h * 100}%`,
                      }}
                      aria-label={t('ocr.regionLabel', { field: t(`soil.nutrient.${v.key}`) })}
                    >
                      <span
                        className={cx(
                          'absolute -top-2.5 left-1 rounded px-1 text-[10px] font-bold leading-4',
                          low ? 'bg-warn text-white dark:text-forest-deep' : 'bg-forest text-on-forest',
                        )}
                      >
                        {v.key}
                      </span>
                    </button>
                  );
                })
              : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-ink-muted">
            <FileText className="h-10 w-10" aria-hidden="true" />
            <p>{t('ocr.noImage')}</p>
          </div>
        )}
      </div>
      {regions.length ? (
        <div className="flex flex-wrap gap-4 border-t border-line bg-surface px-3 py-2 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-2 border-forest bg-forest/10" aria-hidden="true" /> {t('ocr.legendRead')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-2 border-warn bg-warn/15" aria-hidden="true" /> {t('ocr.legendCheck')}
          </span>
        </div>
      ) : null}
    </figure>
  );
}
