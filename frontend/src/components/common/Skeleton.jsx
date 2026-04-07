// src/components/common/Skeleton.jsx — Reusable skeleton loading UI

import React from 'react'

export function SongCardSkeleton() {
  return (
    <div className="bg-surface-2 rounded-xl p-4 space-y-3">
      <div className="skeleton w-full aspect-square rounded-lg" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  )
}

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="skeleton w-12 h-12 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-3 w-32" />
      </div>
      <div className="skeleton h-3 w-10" />
    </div>
  )
}

export function PlaylistCardSkeleton() {
  return (
    <div className="bg-surface-2 rounded-xl p-4 space-y-3">
      <div className="skeleton w-full aspect-square rounded-lg" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-3 w-1/3" />
    </div>
  )
}
