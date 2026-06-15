import Navbar from "@/components/Navbar";
import ChatAssistant from "@/components/dashboard/ChatAssistant";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {children}
      </main>
      <ChatAssistant />
    </div>
  );
}
