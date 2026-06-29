'use client'

import { useEffect, useCallback } from 'react'
import type { DesignVersion } from '@/lib/types/database'
import { CHART_COLORS } from '@/lib/utils'

interface Props {
  images: DesignVersion[]
  initialIndex: number
  versions: DesignVersion[]
  onClose: () => void
  onSelectVersion: (version: DesignVersion) => void
}

export default function ImageLightbox({ images, initialIndex, versions, onClose, onSelectVersion }: Props) {
  const image = images[initialIndex]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!image) return null

  const color = CHART_COLORS[versions.findIndex((v) => v.id === image.id) % CHART_COLORS.length]
  const designLink = image.figma_link || image.xd_link || image.prototype_link

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image */}
        <div className="rounded-2xl overflow-hidden flex-1 min-h-0 bg-slate-900 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.image_url}
            alt={image.title}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="font-semibold text-white" style={{ color }}>{image.title}</p>
          <div className="flex gap-2">
            {designLink && (
              <a
                href={designLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
              >
                View full design ↗
              </a>
            )}
            <button
              onClick={() => { onClose(); onSelectVersion(image) }}
              className="text-sm px-4 py-2 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: color }}
            >
              I prefer this
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
