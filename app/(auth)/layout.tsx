export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="font-display bg-gray-50 text-slate-900 min-h-screen flex items-center justify-center p-4">
            {children}
        </div>
    );
}
