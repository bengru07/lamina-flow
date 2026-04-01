export default function StatusBanner({ message, type }: { message: string; type: 'error' | 'info' }) {
  const bgColor = type === 'error' ? 'bg-red-100' : 'bg-blue-100';
  const textColor = type === 'error' ? 'text-red-700' : 'text-blue-700';

  return (
    <div className={`${bgColor} ${textColor} p-4 rounded mb-4 text-sm`}>
      {message}
    </div>
  );
}