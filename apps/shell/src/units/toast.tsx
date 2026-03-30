import { cn } from '@/lib/utils.js'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export class Toast extends gl.Unit {
  error(message: string, data: Parameters<typeof toast.error>[1]) {
    toast.error(message, {
      icon: <AlertCircle className="relative top-0.75 size-4 text-destructive" />,
      closeButton: true,
      ...data,
      className: cn('items-start!', '**:data-close-button:cursor-default!', data?.className),
    })
  }
}
