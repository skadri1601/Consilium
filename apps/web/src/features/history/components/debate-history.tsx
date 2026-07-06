"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { DebateCardSkeleton } from "@/components/shared/skeletons";
import {
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
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

function DebateCardMenu({
  debate,
  onRename,
  onDelete,
  onArchive,
}: {
  debate: Debate;
  onRename: (id: string, newTopic: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(debate.topic);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const isArchived = debate.status === "archived";

  const handleRenameSubmit = useCallback(() => {
    if (renameValue.trim() && renameValue.trim() !== debate.topic) {
      onRename(debate.id, renameValue.trim());
    }
    setRenaming(false);
  }, [renameValue, debate.id, debate.topic, onRename]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleRenameSubmit();
      }
      if (e.key === "Escape") {
        setRenaming(false);
        setRenameValue(debate.topic);
      }
    },
    [handleRenameSubmit, debate.topic],
  );

  const handleDeleteConfirm = useCallback(() => {
    onDelete(debate.id);
    setDeleteOpen(false);
  }, [debate.id, onDelete]);

  const handleArchiveClick = useCallback(() => {
    onArchive(debate.id, !isArchived);
    setMenuOpen(false);
  }, [debate.id, isArchived, onArchive]);

  return (
    <>
      {renaming ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameSubmit}
            autoFocus
            className="h-8 text-sm"
          />
        </div>
      ) : (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1">
            <button
              onClick={() => {
                setMenuOpen(false);
                setRenaming(true);
                setRenameValue(debate.topic);
              }}
              className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </button>
            <button
              onClick={handleArchiveClick}
              className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              {isArchived ? (
                <>
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </>
              )}
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
              className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </PopoverContent>
        </Popover>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Debate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this debate? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DebateHistory() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  const fetchDebates = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const response = await fetch(`/api/debates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDebates(data);
      }
    } catch (error) {
      console.error("Failed to fetch debates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebates(debouncedSearch);
  }, [dateFilter, debouncedSearch, fetchDebates]);

  const handleRename = useCallback(async (id: string, newTopic: string) => {
    try {
      const response = await fetch(`/api/debates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: newTopic }),
      });
      if (response.ok) {
        setDebates((prev) =>
          prev.map((d) => (d.id === id ? { ...d, topic: newTopic } : d)),
        );
      }
    } catch (error) {
      console.error("Failed to rename debate", id, error);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/debates/${id}`, { method: "DELETE" });
      if (response.ok) {
        setDebates((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete debate", id, error);
    }
  }, []);

  const handleArchive = useCallback(async (id: string, archived: boolean) => {
    try {
      const response = await fetch(`/api/debates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (response.ok) {
        setDebates((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, status: archived ? "archived" : "completed" }
              : d,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to archive debate", id, error);
    }
  }, []);

  const checkDateFilter = useCallback(
    (dateString: string, filter: string): boolean => {
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
    },
    [],
  );

  const filteredDebates = debates.filter((debate) => {
    const matchesDate =
      dateFilter === "all" || checkDateFilter(debate.createdAt, dateFilter);
    const matchesArchive = showArchived
      ? debate.status === "archived"
      : debate.status !== "archived" && debate.status !== "deleted";
    return matchesDate && matchesArchive;
  });

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Debate History</h1>
        <p className="text-muted-foreground">
          View and manage your past debate sessions
        </p>
      </div>

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
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived((prev) => !prev)}
              >
                <Archive className="h-3.5 w-3.5 mr-1" />
                Archived
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                {searchQuery
                  ? "No debates match your search."
                  : showArchived
                    ? "No archived debates."
                    : "No debates yet. Start your first debate!"}
              </p>
              {!searchQuery && !showArchived && (
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2 truncate">
                      {debate.topic}
                    </CardTitle>
                    <CardDescription>
                      {new Date(debate.createdAt).toLocaleDateString()} •{" "}
                      {debate.status}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/debates/${debate.id}`}>View</Link>
                    </Button>
                    <DebateCardMenu
                      debate={debate}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Models: {debate.modelsUsed.join(", ")}</span>
                  <span>Cost: ${debate.totalCost.toFixed(4)}</span>
                  {debate.goldenPrompt && (
                    <span className="text-green-600">Synthesis</span>
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
