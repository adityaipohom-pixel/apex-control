import { Compass } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from '@/hooks/useRouter'

export function NotFoundPage() {
  const { navigate } = useRouter()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pt-6">
      <PageHeader title="Page not found" description="That route does not exist on this dashboard." icon={<Compass className="h-5 w-5" />} />
      <Card className="text-center">
        <p className="text-sm text-slate-400">Use the navigation to get back to a working section.</p>
        <div className="mt-4 flex justify-center">
          <Button variant="primary" onClick={() => navigate('home')}>
            Back to dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}
