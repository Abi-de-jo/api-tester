'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { type HeaderPair } from '@/types'
import { XIcon } from 'lucide-react'

interface HeaderEditorProps {
  headers: HeaderPair[]
  onChange: (headers: HeaderPair[]) => void
}

export function HeaderEditor({ headers, onChange }: HeaderEditorProps) {
  const addHeader = () => {
    onChange([...headers, { key: '', value: '', enabled: true }])
  }

  const removeHeader = (index: number) => {
    onChange(headers.filter((_, i) => i !== index))
  }

  const updateHeader = (index: number, field: keyof HeaderPair, value: string | boolean) => {
    onChange(
      headers.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {headers.map((header, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={header.enabled}
            onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
            className="size-4"
          />
          <Input
            placeholder="Key"
            value={header.key}
            onChange={(e) => updateHeader(index, 'key', e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Value"
            value={header.value}
            onChange={(e) => updateHeader(index, 'value', e.target.value)}
            className="flex-[2]"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removeHeader(index)}
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addHeader} className="w-fit">
        Add Header
      </Button>
    </div>
  )
}
