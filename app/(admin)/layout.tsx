import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { auth } from '@/auth';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="min-h-screen bg-slate-50 font-display">
            <AdminSidebar user={user ? { name: user.name ?? null } : undefined} />
            <main className="pl-64 min-h-screen">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
