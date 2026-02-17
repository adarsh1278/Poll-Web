export default function ErrorCard({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}
