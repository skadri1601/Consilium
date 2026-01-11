"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { DebateCardSkeleton } from "@/components/council/debate-card-skeleton";
import { Search, Calendar, Filter } from "lucide-react";
import Link from "next/link";

interface Debate {
  id: string;
  topic: string;
  status: string;
  modelsUsed: string[];
  totalCost: number;
  goldenPrompt: string | null;
  createdAt: string;
}

export function DebateHistory() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    fetchDebates();
  }, [dateFilter]);

  const fetchDebates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/debates?limit=50&offset=0`);
      if (response.ok) {
        const data = await response.json();
        setDebates(data);
      }
    } catch (error) {
      console.error("Failed to fetch debates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDebates = debates.filter((debate) => {
    const matchesSearch = debate.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter === "all" || checkDateFilter(debate.createdAt, dateFilter);
    return matchesSearch && matchesDate;
  });

  const checkDateFilter = (dateString: string, filter: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    const daysAgo = now.getTime() - date.getTime();
    const days = daysAgo / (1000 * 60 * 60 * 24);

    switch (filter) {
      case "today":
        return days < 1;
      case "week":
        return days < 7;
      case "month":
        return days < 30;
      default:
        return true;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Debate History</h1>
        <p className="text-muted-foreground">
          View and manage your past debate sessions
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search debates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter("all")}
              >
                All
              </Button>
              <Button
                variant={dateFilter === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter("today")}
              >
                Today
              </Button>
              <Button
                variant={dateFilter === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter("week")}
              >
                This Week
              </Button>
              <Button
                variant={dateFilter === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateFilter("month")}
              >
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debate List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <DebateCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredDebates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No debates match your search." : "No debates yet. Start your first debate!"}
              </p>
              {!searchQuery && (
                <Button asChild className="mt-4">
                  <Link href="/council">Start Debate</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDebates.map((debate) => (
            <Card key={debate.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{debate.topic}</CardTitle>
                    <CardDescription>
                      {new Date(debate.createdAt).toLocaleDateString()} • {debate.status}
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/debates/${debate.id}`}>View</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Models: {debate.modelsUsed.join(", ")}</span>
                  <span>Cost: ${debate.totalCost.toFixed(4)}</span>
                  {debate.goldenPrompt && (
                    <span className="text-green-600">✓ Golden Prompt</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

