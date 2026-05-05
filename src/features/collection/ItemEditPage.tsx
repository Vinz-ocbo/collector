import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  CardThumbnail,
  Chip,
  Input,
  PageHeader,
  Stepper,
  Switch,
  useToast,
} from '@/shared/ui';
import { useCollectionItem, useDeleteItem, useUpdateItem } from './hooks';
import type { CollectionItem } from '@/shared/domain';
import type { UpdateItemInput } from './repository';

const CONDITIONS: CollectionItem['condition'][] = ['NM', 'LP', 'MP', 'HP', 'DMG'];

export function ItemEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: item, isPending } = useCollectionItem(id);
  const update = useUpdateItem();
  const remove = useDeleteItem();
  const { show } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<CollectionItem['condition']>('NM');
  const [foil, setFoil] = useState(false);
  const [language, setLanguage] = useState('en');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setCondition(item.condition);
      setFoil(item.foil);
      setLanguage(item.language);
      setNotes(item.notes ?? '');
    }
  }, [item]);

  if (!id) return <Navigate to="/" replace />;
  if (isPending || !item) {
    return (
      <>
        <PageHeader title={t('collection.edit.title')} onBack={() => navigate(-1)} />
        <p className="p-4 text-fg-muted">{t('common.loading')}</p>
      </>
    );
  }

  async function handleSave() {
    if (quantity === 0) {
      await remove.mutateAsync({ id: id! });
      show({ title: t('collection.item.deletedToast.title'), tone: 'neutral' });
      navigate('/', { replace: true });
      return;
    }
    const patch: UpdateItemInput = {
      quantity,
      condition,
      foil,
      language,
      notes: notes.trim() ? notes.trim() : undefined,
    };
    await update.mutateAsync({ id: id!, patch });
    show({ title: t('collection.edit.savedToast'), tone: 'success' });
    navigate(`/collection/items/${id!}`, { replace: true });
  }

  return (
    <>
      <PageHeader
        title={t('collection.edit.title')}
        onBack={() => navigate(-1)}
        actions={
          <Button size="sm" onClick={() => void handleSave()} disabled={update.isPending}>
            {update.isPending ? t('collection.edit.saving') : t('collection.edit.save')}
          </Button>
        }
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
        className="flex flex-col gap-5 p-4"
      >
        <div className="flex items-center gap-3">
          <CardThumbnail card={item.card} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{item.card.name}</p>
            <p className="truncate text-sm text-fg-muted">
              {item.card.setName} · #{item.card.collectorNumber}
            </p>
          </div>
        </div>

        <Field label={t('collection.edit.quantityLabel')} htmlFor="qty">
          <Stepper
            ariaLabel={t('collection.edit.quantityLabel')}
            value={quantity}
            onChange={setQuantity}
            min={0}
          />
          {quantity === 0 ? (
            <p className="mt-1 text-xs text-warning">{t('collection.edit.quantityZeroWarning')}</p>
          ) : null}
        </Field>

        <Field label={t('collection.edit.conditionLabel')} htmlFor="condition">
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
          <label htmlFor="foil" className="text-sm font-medium">
            {t('collection.edit.foilLabel')}
          </label>
          <Switch
            id="foil"
            checked={foil}
            onCheckedChange={setFoil}
            aria-label={t('collection.edit.foilLabel')}
          />
        </div>

        <Field label={t('collection.edit.languageLabel')} htmlFor="language">
          <Input
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value.toLowerCase().slice(0, 2))}
            maxLength={2}
            placeholder="en"
            className="w-20"
          />
        </Field>

        <Field label={t('collection.edit.notesLabel')} htmlFor="notes">
          <Input
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={500}
            placeholder={t('collection.edit.notesPlaceholder')}
          />
        </Field>
      </form>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
