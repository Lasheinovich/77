export function LoadingSpinner() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  )
}
