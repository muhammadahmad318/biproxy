import AdminNavbar from '../../components/admin/AdminNavbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <AdminNavbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
