import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Flame,
  Coins,
  Plus,
  Target,
  Calendar as CalendarIcon,
  Zap,
  BookOpen,
  Dumbbell,
  ChefHat,
  CheckCircle2,
  Circle,
  Brain,
  Wand2,
  Clock,
  Pencil,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AmigoTask — Your Productivity Bestie" },
      { name: "description", content: "AmigoTask is a warm, AI-powered planner that breaks your day into energy-aware quests, rewards focus with coins, and keeps you on streak." },
      { property: "og:title", content: "AmigoTask — Your Productivity Bestie" },
      { property: "og:description", content: "Plan your day with an AI bestie. Energy-aware time blocks, streaks, coins, and zero pressure." },
    ],
  }),
  component: Index,
});

type Category = "energy" | "study" | "creative" | "health";
type Task = {
  id: string;
  title: string;
  category: Category;
  block: string;
  done: boolean;
};

const CATEGORIES: Record<Category, { label: string; icon: typeof Zap; chip: string }> = {
  energy: { label: "⚡ Energy", icon: Zap, chip: "bg-coral/15 text-coral" },
  study: { label: "📚 Study", icon: BookOpen, chip: "bg-lilac/25 text-lilac-foreground" },
  creative: { label: "🍳 Creative", icon: ChefHat, chip: "bg-sun/40 text-sun-foreground" },
  health: { label: "💪 Health", icon: Dumbbell, chip: "bg-mint/40 text-mint-foreground" },
};

const DEFAULT_BLOCKS = ["09:00 – 11:00", "11:00 – 13:00", "14:00 – 16:00", "16:00 – 18:00"];

function Index() {
  const [blocks, setBlocks] = useState<string[]>(DEFAULT_BLOCKS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("energy");
  const [block, setBlock] = useState(blocks[0]);
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [coins, setCoins] = useState(120);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("amigotask:v1") : null;
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data.blocks) && data.blocks.length) setBlocks(data.blocks);
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (typeof data.coins === "number") setCoins(data.coins);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("amigotask:v1", JSON.stringify({ tasks, coins, blocks }));
  }, [tasks, coins, blocks]);


  useEffect(() => {
    if (!blocks.includes(block)) setBlock(blocks[0]);
  }, [blocks, block]);

  const visible = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.category === filter)),
    [tasks, filter],
  );
  const pending = tasks.filter((t) => !t.done).length;
  const completed = tasks.length - pending;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const addTask = (preset?: Partial<Task>) => {
    const t: Task = {
      id: crypto.randomUUID(),
      title: preset?.title ?? title.trim(),
      category: preset?.category ?? category,
      block: preset?.block ?? block,
      done: false,
    };
    if (!t.title) return;
    setTasks((prev) => [t, ...prev]);
    setCoins((c) => c + 10);
    if (!preset) setTitle("");
  };

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Header coins={coins} />

        <main className="mt-8 grid gap-6 lg:grid-cols-5">
          <section className="space-y-6 lg:col-span-3">
            <Orchestrator pending={pending} progress={progress} />
            <TaskComposer
              title={title}
              setTitle={setTitle}
              category={category}
              setCategory={setCategory}
              block={block}
              setBlock={setBlock}
              blocks={blocks}
              onAdd={() => addTask()}
            />
            <Shortcuts onPick={(p) => addTask(p)} />
          </section>

          <aside className="space-y-6 lg:col-span-2">
            <Rollup pending={pending} completed={completed} progress={progress} />
            <Quests
              tasks={visible}
              filter={filter}
              setFilter={setFilter}
              onToggle={toggle}
            />
            <CalSync blocks={blocks} setBlocks={setBlocks} />
          </aside>
        </main>
      </div>
    </div>
  );
}

function Header({ coins }: { coins: number }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-coral text-coral-foreground shadow-sm">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
            AmigoTask <span className="text-coral">Bestie Edition</span>
          </h1>
          <p className="text-sm text-muted-foreground">Loading your energy levels… ready when you are.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Stat icon={<Flame className="h-4 w-4" />} label="5 day streak" tone="bg-sun text-sun-foreground" />
        <Stat icon={<Coins className="h-4 w-4" />} label={`${coins} coins`} tone="bg-mint text-mint-foreground" />
      </div>
    </header>
  );
}

function Stat({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: string }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ${tone}`}>
      {icon}
      {label}
    </div>
  );
}

function Orchestrator({ pending, progress }: { pending: number; progress: number }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-background shadow-lg sm:p-8">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-coral/30 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-lilac/30 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-background/80 backdrop-blur">
          <Brain className="h-3.5 w-3.5" /> AI Orchestrator
        </div>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Your daily blueprint</h2>
        <p className="mt-2 max-w-lg text-background/70">
          “Hey! You've got a few high‑energy tasks today. Let's attack the biggest monster
          before noon and coast the afternoon.”
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-coral-foreground transition hover:opacity-90">
            <Wand2 className="h-4 w-4" /> Hyper‑focus mode
          </button>
          <span className="text-sm text-background/60">
            {pending} pending · {progress}% done
          </span>
        </div>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-background/10">
          <div
            className="h-full rounded-full bg-coral transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TaskComposer(props: {
  title: string;
  setTitle: (s: string) => void;
  category: Category;
  setCategory: (c: Category) => void;
  block: string;
  setBlock: (b: string) => void;
  blocks: string[];
  onAdd: () => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-lg font-bold text-ink">
          <Plus className="h-5 w-5 text-coral" /> Drop a task
        </h3>
        <span className="text-xs text-muted-foreground">Auto‑saves locally</span>
      </div>

      <input
        value={props.title}
        onChange={(e) => props.setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && props.onAdd()}
        placeholder="What's the quest? e.g. Outline pitch deck"
        className="mt-4 w-full rounded-2xl border border-input bg-surface px-4 py-3.5 text-base text-ink placeholder:text-muted-foreground focus:border-coral focus:outline-none focus:ring-4 focus:ring-coral/15"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select
            value={props.category}
            onChange={(e) => props.setCategory(e.target.value as Category)}
            className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium text-ink focus:border-coral focus:outline-none"
          >
            {Object.entries(CATEGORIES).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Time block">
          <select
            value={props.block}
            onChange={(e) => props.setBlock(e.target.value)}
            className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm font-medium text-ink focus:border-coral focus:outline-none"
          >
            {props.blocks.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>
      </div>

      <button
        onClick={props.onAdd}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-sm font-semibold text-background transition hover:opacity-90"
      >
        Lock it in <span className="rounded-full bg-coral px-2 py-0.5 text-xs text-coral-foreground">+10 coins</span>
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Shortcuts({ onPick }: { onPick: (p: Partial<Task>) => void }) {
  const items: { title: string; category: Category; emoji: string }[] = [
    { title: "Gym setup", category: "health", emoji: "🏋️" },
    { title: "Study session", category: "study", emoji: "📖" },
    { title: "Kitchen time", category: "creative", emoji: "🥧" },
  ];
  return (
    <div className="rounded-3xl border border-border bg-surface p-6">
      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Quick bestie shortcuts</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <button
            key={i.title}
            onClick={() => onPick({ title: i.title, category: i.category })}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink transition hover:border-coral hover:text-coral"
          >
            <span>{i.emoji}</span> {i.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function Rollup({ pending, completed, progress }: { pending: number; completed: number; progress: number }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-coral">
        <Sparkles className="h-4 w-4" /> AI rollup summary
      </div>
      <p className="mt-2 text-ink">
        {pending === 0
          ? "Clear horizons! Zero pending items. Ready to stack up some wins?"
          : `You're juggling ${pending} quest${pending === 1 ? "" : "s"} — ${completed} already in the bag. Keep the rhythm.`}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <MiniStat label="Done" value={completed} tone="bg-mint text-mint-foreground" />
        <MiniStat label="Pending" value={pending} tone="bg-sun text-sun-foreground" />
        <MiniStat label="Focus" value={`${progress}%`} tone="bg-lilac text-lilac-foreground" />
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className={`rounded-2xl px-3 py-3 ${tone}`}>
      <div className="text-xl font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}

function Quests({
  tasks,
  filter,
  setFilter,
  onToggle,
}: {
  tasks: Task[];
  filter: "all" | Category;
  setFilter: (f: "all" | Category) => void;
  onToggle: (id: string) => void;
}) {
  const filters: { key: "all" | Category; label: string }[] = [
    { key: "all", label: "All" },
    { key: "energy", label: "⚡ Energy" },
    { key: "study", label: "📚 Study" },
    { key: "health", label: "💪 Health" },
  ];
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-lg font-bold text-ink">
          <Target className="h-5 w-5 text-coral" /> Active quests
        </h3>
        <span className="text-xs text-muted-foreground">{tasks.length} shown</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              filter === f.key
                ? "bg-ink text-background"
                : "bg-surface text-muted-foreground hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {tasks.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing here — drop a quest to begin.
          </li>
        )}
        {tasks.map((t) => {
          const cat = CATEGORIES[t.category];
          return (
            <li
              key={t.id}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 transition hover:border-coral/40"
            >
              <button onClick={() => onToggle(t.id)} aria-label="toggle">
                {t.done ? (
                  <CheckCircle2 className="h-5 w-5 text-coral" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground group-hover:text-coral" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-semibold ${t.done ? "text-muted-foreground line-through" : "text-ink"}`}>
                  {t.title}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${cat.chip}`}>{cat.label}</span>
                  <span>· {t.block}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CalSync() {
  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-lilac/40 to-mint/40 p-6">
      <h3 className="inline-flex items-center gap-2 text-lg font-bold text-ink">
        <CalendarIcon className="h-5 w-5" /> Cal‑sync & time blocks
      </h3>
      <p className="mt-1.5 text-sm text-ink/70">
        Pipe your quests straight into Google or Apple Calendar. Bestie keeps the colors tidy.
      </p>
      <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90">
        Sync calendar
      </button>
    </div>
  );
}
