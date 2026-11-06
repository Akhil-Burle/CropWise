import { useState } from 'react';
import { AlertTriangle, ChefHat, Clock, Hourglass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Checkbox, Modal } from '@/components/ui';
import ReadAloudButton from '../common/ReadAloudButton';

/** DIY bio-input recipe: ingredient checklist plus numbered steps, with read-aloud. */
export default function RecipeViewer({ recipe }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [have, setHave] = useState({});
  const text = () => [recipe.title, ...recipe.ingredients.map((i) => `${i.quantity} ${i.name}`), ...recipe.steps].join('. ');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-lg border border-organic/30 bg-organic-soft p-3 text-left hover:border-organic"
      >
        <ChefHat className="h-6 w-6 shrink-0 text-organic" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{recipe.title}</span>
          <span className="block text-sm text-ink-muted">
            {recipe.yields} · {recipe.prepTime}
          </span>
        </span>
        <span className="text-sm font-semibold text-organic">{t('advisory.viewRecipe')}</span>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={recipe.title}
        description={t('advisory.recipeSubtitle')}
        size="lg"
        footer={
          <>
            <ReadAloudButton getText={text} />
            <Button onClick={() => setOpen(false)}>{t('common.done')}</Button>
          </>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="organic" icon={Clock}>{recipe.prepTime}</Badge>
          <Badge tone="neutral">{recipe.yields}</Badge>
          <Badge tone="neutral" icon={Hourglass}>{recipe.shelfLife}</Badge>
        </div>
        <h3 className="mb-2 font-sans text-base font-semibold">{t('advisory.ingredients')}</h3>
        <ul className="mb-5 divide-y divide-line rounded-lg border border-line">
          {recipe.ingredients.map((ing) => (
            <li key={ing.name} className="flex items-center justify-between gap-3 px-3">
              <Checkbox checked={Boolean(have[ing.name])} onChange={(v) => setHave((h) => ({ ...h, [ing.name]: v }))} label={ing.name} tone="organic" />
              <span className="shrink-0 font-semibold tabular">{ing.quantity}</span>
            </li>
          ))}
        </ul>
        <h3 className="mb-2 font-sans text-base font-semibold">{t('advisory.steps')}</h3>
        <ol className="space-y-3">
          {recipe.steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-organic font-bold text-white dark:text-forest-deep">{i + 1}</span>
              <p className="pt-1">{s}</p>
            </li>
          ))}
        </ol>
        {recipe.caution ? (
          <p className="mt-5 flex gap-2 rounded-lg border border-warn/50 bg-warn/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
            {recipe.caution}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
