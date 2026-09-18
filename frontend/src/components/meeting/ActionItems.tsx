import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react'
import type { ActionItem, Meeting } from '../../types'
import { api } from '../../lib/api'
import { Avatar, Button, EmptyState, cx } from '../ui'
import { useToast } from '../Toast'

export function ActionItems({ meeting }: { meeting: Meeting }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['meeting', meeting.id] })

  const toggle = useMutation({
    mutationFn: (item: ActionItem) =>
      api.updateActionItem(item.id, { status: item.status === 'open' ? 'done' : 'open' }),
    onSuccess: (item) => {
      refresh()
      toast(item.status === 'done' ? 'Action item completed' : 'Action item reopened')
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteActionItem(id),
    onSuccess: () => {
      refresh()
      toast('Action item deleted')
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  const save = useMutation({
    mutationFn: ({ id, ...body }: { id: number | null; task: string; assignee: string; due_date: string }) =>
      id
        ? api.updateActionItem(id, body)
        : api.createActionItem(meeting.id, body),
    onSuccess: () => {
      refresh()
      setAdding(false)
      setEditingId(null)
      toast('Action item saved')
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  const open = meeting.action_items.filter((item) => item.status === 'open')
  const done = meeting.action_items.filter((item) => item.status === 'done')

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          <span className="font-medium text-ink">{open.length} open</span>
          {done.length > 0 && ` · ${done.length} done`}
        </p>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus size={14} />
          Add
        </Button>
      </div>

      {adding && (
        <ActionItemForm
          onCancel={() => setAdding(false)}
          onSave={(values) => save.mutate({ id: null, ...values })}
          pending={save.isPending}
        />
      )}

      {meeting.action_items.length === 0 && !adding && (
        <EmptyState
          icon={<ListTodo size={22} />}
          title="No action items"
          description="Add one, or let the AI pull them from the transcript when a meeting is processed."
        />
      )}

      <ul className="space-y-1.5">
        {[...open, ...done].map((item) =>
          editingId === item.id ? (
            <li key={item.id}>
              <ActionItemForm
                item={item}
                onCancel={() => setEditingId(null)}
                onSave={(values) => save.mutate({ id: item.id, ...values })}
                pending={save.isPending}
              />
            </li>
          ) : (
            <li
              key={item.id}
              className="group flex items-start gap-2.5 rounded-lg border border-line bg-canvas px-3 py-2.5"
            >
              <button
                onClick={() => toggle.mutate(item)}
                aria-label={item.status === 'done' ? `Reopen: ${item.task}` : `Complete: ${item.task}`}
                className={cx(
                  'mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-[5px] border transition',
                  item.status === 'done'
                    ? 'border-positive bg-positive text-white'
                    : 'border-line-strong hover:border-accent',
                )}
              >
                {item.status === 'done' && <Check size={12} strokeWidth={3} />}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={cx(
                    'text-sm leading-snug',
                    item.status === 'done' ? 'text-ink-faint line-through' : 'text-ink',
                  )}
                >
                  {item.task}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                  {item.assignee && (
                    <span className="flex items-center gap-1.5">
                      <Avatar name={item.assignee} size={18} />
                      {item.assignee}
                    </span>
                  )}
                  {item.due_date && <span>Due {item.due_date}</span>}
                </div>
              </div>

              <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(item.id)}
                  aria-label={`Edit: ${item.task}`}
                >
                  <Pencil size={13} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => remove.mutate(item.id)}
                  aria-label={`Delete: ${item.task}`}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}

type FormValues = { task: string; assignee: string; due_date: string }

function ActionItemForm({
  item,
  onSave,
  onCancel,
  pending,
}: {
  item?: ActionItem
  onSave: (values: FormValues) => void
  onCancel: () => void
  pending: boolean
}) {
  const [values, setValues] = useState<FormValues>({
    task: item?.task ?? '',
    assignee: item?.assignee ?? '',
    due_date: item?.due_date ?? '',
  })

  const field = 'h-8 w-full rounded-lg border border-line bg-surface px-2.5 text-sm outline-none placeholder:text-ink-faint focus:border-accent'

  return (
    <form
      className="mb-2 space-y-2 rounded-lg border border-accent/40 bg-accent-soft/40 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (values.task.trim()) onSave(values)
      }}
    >
      <input
        autoFocus
        required
        value={values.task}
        onChange={(event) => setValues({ ...values, task: event.target.value })}
        placeholder="What needs to happen?"
        aria-label="Task"
        className={field}
      />
      <div className="flex gap-2">
        <input
          value={values.assignee}
          onChange={(event) => setValues({ ...values, assignee: event.target.value })}
          placeholder="Assignee"
          aria-label="Assignee"
          className={field}
        />
        <input
          value={values.due_date}
          onChange={(event) => setValues({ ...values, due_date: event.target.value })}
          placeholder="Due (e.g. Oct 12)"
          aria-label="Due date"
          className={field}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="primary" disabled={pending || !values.task.trim()}>
          Save
        </Button>
      </div>
    </form>
  )
}
