/** Puts one detector back to the settings it started with */
export default function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded border border-gray-300 transition-colors"
      >
        Reset to default
      </button>
    </div>
  )
}
