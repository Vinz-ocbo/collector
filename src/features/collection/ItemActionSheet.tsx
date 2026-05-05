import { Copy, FolderInput, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/shared/ui';
import type { CollectionItemWithCard } from './repository';

export type ItemActionSheetProps = {
  item: CollectionItemWithCard | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: CollectionItemWithCard) => void;
  onDuplicate: (item: CollectionItemWithCard) => void;
  onMove: (item: CollectionItemWithCard) => void;
  onDelete: (item: CollectionItemWithCard) => void;
};

export function ItemActionSheet({
  item,
  onOpenChange,
  onEdit,
  onDuplicate,
  onMove,
  onDelete,
}: ItemActionSheetProps) {
  const { t } = useTranslation();
  const open = item !== null;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={item ? item.card.name : t('collection.itemMenu.title')}
      description={t('collection.itemMenu.description')}
    >
      {item ? (
        <ul className="flex flex-col gap-1">
          <ActionButton
            icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
            label={t('common.edit')}
            onClick={() => onEdit(item)}
          />
          <ActionButton
            icon={<Copy className="h-4 w-4" aria-hidden="true" />}
            label={t('collection.itemMenu.duplicate')}
            onClick={() => onDuplicate(item)}
          />
          <ActionButton
            icon={<FolderInput className="h-4 w-4" aria-hidden="true" />}
            label={t('collection.itemMenu.move')}
            onClick={() => onMove(item)}
          />
          <ActionButton
            icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
            label={t('common.delete')}
            onClick={() => onDelete(item)}
            destructive
          />
        </ul>
      ) : null}
    </BottomSheet>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={
          'flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
          (destructive ? 'text-danger' : 'text-fg')
        }
      >
        <span className={destructive ? 'text-danger' : 'text-fg-muted'}>{icon}</span>
        {label}
      </button>
    </li>
  );
}
