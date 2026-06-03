'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Link = { id: string; title: string; url: string; icon: string | null; clickCount: number; order: number; createdAt: string }

interface DndLinkListProps {
  links: Link[]
  onReorder: (ids: string[]) => Promise<void>
  onEdit: (link: Link) => void
  onDelete: (id: string) => Promise<void>
}

function SortableLink({ link, onEdit, onDelete }: { link: Link; onEdit: (l: Link) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <button className="cursor-grab text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{link.title}</p>
        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
      </div>
      <span className="text-xs text-muted-foreground">{link.clickCount} clicks</span>
      <Button variant="ghost" size="icon" onClick={() => onEdit(link)}>
        <Pencil size={16} />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(link.id)}>
        <Trash2 size={16} className="text-red-500" />
      </Button>
    </div>
  )
}

export default function DndLinkList({ links: initial, onReorder, onEdit, onDelete }: DndLinkListProps) {
  const [links, setLinks] = useState(initial)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = links.findIndex((l) => l.id === active.id)
    const newIndex = links.findIndex((l) => l.id === over.id)
    const reordered = arrayMove(links, oldIndex, newIndex)
    setLinks(reordered)
    await onReorder(reordered.map((l) => l.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {links.map((link) => (
            <SortableLink key={link.id} link={link} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
