import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <PageContainer className="pt-20">
      <EmptyState icon={<Compass className="size-6" />} title="This tiffin is empty"
        actions={<><Link to="/"><Button>Back to your picks</Button></Link><Link to="/discover"><Button variant="secondary">Discover</Button></Link></>}>
        The page you were looking for doesn’t exist.
      </EmptyState>
    </PageContainer>
  )
}
