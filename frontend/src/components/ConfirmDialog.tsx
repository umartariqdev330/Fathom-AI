import { Button } from './ui'
import { Modal } from './Modal'

/** Confirmation for an action that cannot be undone. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            className="bg-critical"
            onClick={onConfirm}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
    </Modal>
  )
}
