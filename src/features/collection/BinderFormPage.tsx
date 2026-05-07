import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Input, PageHeader, Skeleton, useToast } from '@/shared/ui';
import { useBinder, useBinders, useCreateBinder, useUpdateBinder } from './hooks';
import { BINDER_ICONS, type BinderIconId } from './binderIcons';

export type BinderFormPageProps = {
  mode: 'create' | 'edit';
};

const NAME_MAX = 80;
const DESCRIPTION_MAX = 500;

export function BinderFormPage({ mode }: BinderFormPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { show } = useToast();
  const { id } = useParams<{ id: string }>();

  const existing = useBinder(mode === 'edit' ? id : undefined);
  const allBinders = useBinders();
  const createBinder = useCreateBinder();
  const updateBinder = useUpdateBinder();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<BinderIconId>('deck');
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && existing.data) {
      setName(existing.data.name);
      setDescription(existing.data.description ?? '');
      setIcon(BINDER_ICONS.find((opt) => opt.id === existing.data?.icon)?.id ?? 'deck');
    }
  }, [mode, existing.data]);

  if (mode === 'edit' && (existing.isPending || allBinders.isPending)) {
    return (
      <>
        <PageHeader title={t('collection.binders.editTitle')} onBack={() => navigate(-1)} />
        <div className="space-y-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </>
    );
  }

  if (mode === 'edit' && !existing.data) {
    return (
      <>
        <PageHeader title={t('collection.binders.editTitle')} onBack={() => navigate(-1)} />
        <EmptyState
          title={t('collection.binders.notFoundTitle')}
          description={t('collection.binders.notFoundDescription')}
        />
      </>
    );
  }

  const isPending = createBinder.isPending || updateBinder.isPending;

  function validate(): boolean {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('collection.binders.nameRequired'));
      return false;
    }
    if (trimmed.length > NAME_MAX) {
      setNameError(t('collection.binders.nameTooLong', { max: NAME_MAX }));
      return false;
    }
    const others = (allBinders.data ?? []).filter((b) => b.id !== id);
    if (others.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError(t('collection.binders.nameDuplicate'));
      return false;
    }
    setNameError(null);
    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (mode === 'create') {
      await createBinder.mutateAsync({
        name: trimmedName,
        icon,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      });
      show({
        title: t('collection.binders.createdToast.title'),
        description: t('collection.binders.createdToast.description', { name: trimmedName }),
        tone: 'success',
      });
    } else if (id) {
      await updateBinder.mutateAsync({
        id,
        patch: {
          name: trimmedName,
          icon,
          description: trimmedDescription,
        },
      });
      show({
        title: t('collection.binders.updatedToast.title'),
        description: t('collection.binders.updatedToast.description', { name: trimmedName }),
        tone: 'success',
      });
    }
    navigate('/collection/binders', { replace: true });
  }

  return (
    <>
      <PageHeader
        title={
          mode === 'create'
            ? t('collection.binders.createTitle')
            : t('collection.binders.editTitle')
        }
        onBack={() => navigate(-1)}
      />

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-5 p-4"
        noValidate
      >
        <div>
          <label htmlFor="binder-name" className="mb-1.5 block text-sm font-medium">
            {t('collection.binders.nameLabel')}
          </label>
          <Input
            id="binder-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (nameError) setNameError(null);
            }}
            maxLength={NAME_MAX}
            required
            aria-invalid={nameError ? 'true' : 'false'}
            aria-describedby={nameError ? 'binder-name-error' : undefined}
            placeholder={t('collection.binders.namePlaceholder')}
          />
          {nameError ? (
            <p id="binder-name-error" className="mt-1 text-xs text-danger">
              {nameError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="binder-description" className="mb-1.5 block text-sm font-medium">
            {t('collection.binders.descriptionLabel')}
          </label>
          <Input
            id="binder-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={DESCRIPTION_MAX}
            placeholder={t('collection.binders.descriptionPlaceholder')}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">{t('collection.binders.iconLabel')}</p>
          <div
            role="radiogroup"
            aria-label={t('collection.binders.iconLabel')}
            className="grid grid-cols-4 gap-2"
          >
            {BINDER_ICONS.map((option) => {
              const active = option.id === icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setIcon(option.id)}
                  className={
                    'flex aspect-square items-center justify-center rounded-md border text-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
                    (active
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-bg-raised hover:bg-fg/5')
                  }
                >
                  <span aria-label={t(`collection.binders.icons.${option.id}`)}>
                    {option.emoji}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending
            ? t('common.loading')
            : mode === 'create'
              ? t('collection.binders.create')
              : t('common.save')}
        </Button>
      </form>
    </>
  );
}
