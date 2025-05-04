import { notFound } from "next/navigation"
import { getDynamicRouteByPath } from "@/lib/routing/dynamic-routes"
import { DynamicLayout } from "@/components/layout/dynamic-layout"
import { ErrorBoundary } from "@/components/error-boundary"

interface DynamicPageProps {
  params: {
    slug: string[]
  }
}

export default async function DynamicPage({ params }: DynamicPageProps) {
  const path = `/${params.slug.join("/")}`
  const route = await getDynamicRouteByPath(path)

  if (!route) {
    notFound()
  }

  // In a real implementation, we would dynamically load the component
  // For now, we'll render a placeholder
  return (
    <DynamicLayout defaultLayout={route.layout as any}>
      <ErrorBoundary>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{route.metadata.title || "Dynamic Page"}</h1>
          {route.metadata.description && <p className="text-muted-foreground">{route.metadata.description}</p>}
          <div className="p-6 border rounded-lg">
            <p>
              This is a dynamically rendered page for path: <code>{path}</code>
            </p>
            <p>
              Component: <code>{route.component}</code>
            </p>
            {route.params && Object.keys(route.params).length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Route Parameters:</h3>
                <pre className="bg-muted p-3 rounded-md">{JSON.stringify(route.params, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </DynamicLayout>
  )
}

export async function generateMetadata({ params }: DynamicPageProps) {
  const path = `/${params.slug.join("/")}`
  const route = await getDynamicRouteByPath(path)

  if (!route) {
    return {
      title: "Page Not Found",
    }
  }

  return {
    title: route.metadata.title || "Dynamic Page",
    description: route.metadata.description,
    keywords: route.metadata.keywords,
    ...route.metadata,
  }
}
