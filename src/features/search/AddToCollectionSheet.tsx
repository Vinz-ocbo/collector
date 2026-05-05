import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BottomSheet,
  Button,
  CardThumbnail,
  Chip,
  Input,
  Stepper,
  Switch,
  useToast,
} from '@/shared/ui';
import { useAddItem } from '@/features/collection';
import type { Card, CollectionItem } from '@/shared/domain';

const CONDITIONS: CollectionItem['condition'][] = ['NM', 'LP', 'MP', 'HP', 'DMG'];

export type AddToCollectionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
};

export function AddToCollectionSheet({ open, onOpenChange, card }: AddToCollectionSheetProps) {
  const { t } = useTranslation();
  const { show } = useToast();
  const addItem = useAddItem();

  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<CollectionItem['condition']>('NM');
  const [foil, setFoil] = useState(false);
  const [language, setLanguage] = useState('en');
  const [notes, setNotes] = useState('');

  async function handleAdd() {
    await addItem.mutateAsync({
      // Persist the card alongside the item so the Collection join finds it.
      // (For Scryfall-sourced cards the local `cards` table is otherwise empty.)
      card,
      cardId: card.id,
      game: card.game,
      quantity,
      condition,
      foil,
      language,
      binderId: null,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    show({
      title: t('search.addSheet.addedToast.title'),
      description: t('search.addSheet.addedToast.description', {
        name: card.name,
        quantity,
      }),
      tone: 'success',
    });
    onOpenChange(false);
    setQuantity(1);
    setNotes('');
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('search.addSheet.title')}
      description={card.name}
      footer={
        <Button fullWidth onClick={() => void handleAdd()} disabled={addItem.isPending}>
          {addItem.isPending ? t('search.addSheet.submitting') : t('search.addSheet.submit')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <CardThumbnail card={card} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{card.name}</p>
            <p className="truncate text-sm text-fg-muted">
              {card.setName} · #{card.collectorNumber}
            </p>
          </div>
        </div>

        <Field label={t('collection.edit.quantityLabel')}>
          <Stepper
            ariaLabel={t('collection.edit.quantityLabel')}
            value={quantity}
            onChange={setQuantity}
            min={1}
          />
        </Field>

        <Field label={t('collection.edit.conditionLabel')}>
          <div
            role="radiogroup"
            aria-label={t('collection.edit.conditionLabel')}
            className="flex flex-wrap gap-2"
          >
            {CONDITIONS.map((value) => (
              <Chip
                key={value}
                size="sm"
                active={condition === value}
                onClick={() => setCondition(value)}
              >
                {value}
              </Chip>
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <label htmlFor="add-foil" className="text-sm font-medium">
            {t('collection.edit.foilLabel')}
          </label>
          <Switch
            id="add-foil"
            checked={foil}
            onCheckedChange={setFoil}
            aria-label={t('collection.edit.foilLabel')}
          />
        </div>

        <Field label={t('collection.edit.languageLabel')}>
          <Input
            value={language}
            onChange={(event) => setLanguage(event.target.value.toLowerCase().slice(0, 2))}
            maxLength={2}
            className="w-20"
            aria-label={t('collection.edit.languageLabel')}
          />
        </Field>

        <Field label={t('collection.edit.notesLabel')}>
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={500}
            placeholder={t('collection.edit.notesPlaceholder')}
            aria-label={t('collection.edit.notesLabel')}
          />
        </Field>
      </div>
    </BottomSheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}
