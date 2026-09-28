import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Download,
  File,
  FileArchive,
  FileImage,
  FileMusic,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  HardDrive,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatBytes } from '@/utils/format'
import { api } from '@/services/api'
import type { FileNode } from '@/types/api'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { TextField } from '@/components/ui/TextField'

const FILE_ICONS: Record<string, typeof File> = {
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  mp4: FileVideo,
  mkv: FileVideo,
  mov: FileVideo,
  mp3: FileMusic,
  wav: FileMusic,
  flac: FileMusic,
  zip: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
  txt: FileText,
  md: FileText,
  pdf: FileText,
}

function iconFor(node: FileNode) {
  if (node.kind === 'folder') return Folder
  const extension = node.extension ?? node.name.split('.').pop()?.toLowerCase() ?? ''
  return FILE_ICONS[extension] ?? File
}

/** Read-only browser for the APEX file system (GET /api/files). */
export function FilesPage() {
  const toast = useToast()
  const [path, setPath] = useState('/Users/APEX')
  const [nodes, setNodes] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async (target: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.listFiles(target)
      setNodes(result.nodes ?? [])
      setPath(result.path ?? target)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to list this folder')
      setNodes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(path)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parent = path.split('/').slice(0, -1).join('/') || '/'

  const open = async (node: FileNode) => {
    if (node.kind === 'folder') {
      void load(node.path)
      return
    }
    setBusy(node.path)
    try {
      const result = await api.openPath(node.path)
      toast.success(result.message ?? `Opening ${node.name}`)
    } catch (err) {
      toast.error('Could not open file', err instanceof Error ? err.message : undefined)
    } finally {
      setBusy(null)
    }
  }

  const download = async (node: FileNode) => {
    setBusy(node.path)
    try {
      const result = await api.downloadFile(node.path)
      toast.success(result.message ?? `Preparing ${node.name}`)
    } catch (err) {
      toast.error('Could not prepare download', err instanceof Error ? err.message : undefined)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
      <PageHeader
        title="Files"
        description="Browse folders on APEX and open them remotely. Listing is read-only from the browser."
        icon={<FolderOpen className="h-5 w-5" />}
        actions={
          <>
            <IconButton
              label="Go up one folder"
              disabled={path === '/' || loading}
              onClick={() => void load(parent)}
              icon={<ArrowLeft className="h-5 w-5" />}
            />
            <IconButton
              label="Refresh folder"
              disabled={loading}
              onClick={() => void load(path)}
              icon={<RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />}
            />
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <TextField label="Current path" value={path} onChange={setPath} icon={<HardDrive className="h-4 w-4" />} />
          <Button variant="primary" onClick={() => void load(path)} loading={loading}>
            Open
          </Button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-3xl" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6" />}
              title="Cannot read this folder"
              description={error}
              action={
                <Button size="sm" variant="primary" onClick={() => void load('/Users/APEX')}>
                  Back to home folder
                </Button>
              }
            />
          ) : nodes.length === 0 ? (
            <EmptyState icon={<Folder className="h-6 w-6" />} title="This folder is empty" />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {nodes.map((node) => {
                const Icon = iconFor(node)
                const isFolder = node.kind === 'folder'
                return (
                  <div
                    key={node.path}
                    className={cn(
                      'press glass-soft group relative flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-3xl px-3 py-4 text-center',
                      'hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]',
                    )}
                  >
                    <button
                      type="button"
                      onDoubleClick={() => void open(node)}
                      onClick={() => (isFolder ? void open(node) : undefined)}
                      className="absolute inset-0 rounded-3xl"
                      aria-label={`Open ${node.name}`}
                    />
                    <span
                      className={cn(
                        'grid h-12 w-12 place-items-center rounded-2xl border border-white/10',
                        isFolder ? 'bg-amber-400/15 text-amber-300' : 'bg-white/5 text-slate-300',
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="w-full truncate text-[13px] font-semibold text-slate-100">{node.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {isFolder ? 'Folder' : node.sizeBytes ? formatBytes(node.sizeBytes) : 'File'}
                    </span>
                    {!isFolder ? (
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="!min-h-9 !px-2.5 !text-[11px]"
                          loading={busy === node.path}
                          onClick={() => void open(node)}
                        >
                          Open
                        </Button>
                        <IconButton
                          label={`Download ${node.name}`}
                          size="sm"
                          className="!h-9 !w-9"
                          onClick={() => void download(node)}
                          icon={<Download className="h-4 w-4" />}
                        />
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
