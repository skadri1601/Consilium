"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/shared/components/ui/input";
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
import { DebateCardSkeleton } from "@/components/council/debate-card-skeleton";
import {
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

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
            className="h-8 text-[13px]"
          />
        </div>
      ) : (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-[8px] text-ink-tertiary hover:text-ink-primary hover:bg-bg-2 transition-colors"
              aria-label="Debate actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-1 surface-card">
            <button
              onClick={() => {
                setMenuOpen(false);
                setRenaming(true);
                setRenameValue(debate.topic);
              }}
              className="flex items-center gap-2 w-full rounded-[6px] px-2 py-1.5 text-[13px] text-ink-secondary hover:bg-bg-2 hover:text-ink-primary transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </button>
            <button
              onClick={handleArchiveClick}
              className="flex items-center gap-2 w-full rounded-[6px] px-2 py-1.5 text-[13px] text-ink-secondary hover:bg-bg-2 hover:text-ink-primary transition-colors"
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
              className="flex items-center gap-2 w-full rounded-[6px] px-2 py-1.5 text-[13px] text-dissent hover:bg-dissent/10 transition-colors"
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
            <DialogTitle>Delete debate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this debate? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className="btn-consilium btn-consilium-ghost"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-consilium btn-consilium-primary bg-dissent/20 border-dissent/40 text-dissent hover:bg-dissent/30"
              onClick={handleDeleteConfirm}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
        active
          ? "border-warm/40 bg-warm/12 text-warm"
          : "border-white/[0.08] bg-bg-1 text-ink-tertiary hover:text-ink-primary hover:border-white/[0.18]",
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
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
    } catch {
      // silent fail
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/debates/${id}`, { method: "DELETE" });
      if (response.ok) {
        setDebates((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      // silent fail
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
    } catch {
      // silent fail
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
      <div className="mb-8">
        <div className="eyebrow mb-2">Archive</div>
        <h1 className="font-display text-[40px] tracking-[-0.02em] text-ink-primary font-light">
          Debate <em className="text-warm italic">history</em>
        </h1>
        <p className="text-[14px] text-ink-secondary mt-2">
          Review past deliberations, rename, archive, or continue conversations.
        </p>
      </div>

      <div className="surface-card p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <Input
                placeholder="Search debates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border border-white/[0.08] bg-bg-1 focus-visible:border-warm/40"
              />
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <FilterPill
              label="All"
              active={dateFilter === "all"}
              onClick={() => setDateFilter("all")}
            />
            <FilterPill
              label="Today"
              active={dateFilter === "today"}
              onClick={() => setDateFilter("today")}
            />
            <FilterPill
              label="Week"
              active={dateFilter === "week"}
              onClick={() => setDateFilter("week")}
            />
            <FilterPill
              label="Month"
              active={dateFilter === "month"}
              onClick={() => setDateFilter("month")}
            />
            <FilterPill
              label="Archived"
              active={showArchived}
              onClick={() => setShowArchived((prev) => !prev)}
              icon={Archive}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <DebateCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredDebates.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <p className="text-[14px] text-ink-tertiary">
            {searchQuery
              ? "No debates match your search."
              : showArchived
                ? "No archived debates."
                : "No debates yet. Start your first deliberation."}
          </p>
          {!searchQuery && !showArchived && (
            <Link
              href="/council"
              className="btn-consilium btn-consilium-primary mt-4 inline-flex"
            >
              Start debate
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDebates.map((debate) => (
            <div
              key={debate.id}
              className="surface-card p-5 transition-all hover:-translate-y-[1px] hover:border-white/[0.14]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-[18px] tracking-[-0.01em] text-ink-primary mb-1 truncate">
                    {debate.topic}
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    {new Date(debate.createdAt).toLocaleDateString()} ·{" "}
                    {debate.status}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/debates/${debate.id}`}
                    className="btn-consilium btn-consilium-ghost h-8 px-3 text-[11px]"
                  >
                    View
                  </Link>
                  <DebateCardMenu
                    debate={debate}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                  />
                </div>
              </div>
              <div className="flex gap-4 flex-wrap mt-4 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                <span>
                  <span className="text-ink-muted">Models:</span>{" "}
                  <span className="text-ink-secondary">
                    {debate.modelsUsed.join(", ")}
                  </span>
                </span>
                <span>
                  <span className="text-ink-muted">Cost:</span>{" "}
                  <span className="text-ink-secondary">
                    ${debate.totalCost.toFixed(4)}
                  </span>
                </span>
                {debate.goldenPrompt && (
                  <span className="text-agree">Synthesis ready</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
