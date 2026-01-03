import { HistoryList } from "@/features/history";

export default function HistoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">
          View your past council sessions and conversations
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
