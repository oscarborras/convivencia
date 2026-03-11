import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 flex-col md:flex-row">
            <Sidebar userEmail={user.email} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
