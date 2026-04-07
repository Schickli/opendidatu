"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Clock,
  FileWarning,
  Hourglass,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsData } from "@/lib/contracts";
import { fetchAnalytics } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const TIME_PRESETS = [
  { label: "Letzte Stunde", hours: 1 },
  { label: "Letzte 6h", hours: 6 },
  { label: "Letzte 24h", hours: 24 },
  { label: "Letzte 7 Tage", hours: 168 },
  { label: "Alles", hours: 0 },
] as const;

const POSTEN_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(188, 85%, 45%)",
  "hsl(330, 81%, 60%)",
  "hsl(25, 95%, 53%)",
  "hsl(173, 80%, 40%)",
  "hsl(291, 64%, 42%)",
];

const TYPE_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(188, 85%, 45%)",
  "hsl(330, 81%, 60%)",
  "hsl(25, 95%, 53%)",
];

const HOUR_MS = 60 * 60 * 1000;

function floorToHour(timestamp: number) {
  return Math.floor(timestamp / HOUR_MS) * HOUR_MS;
}

function buildHourBuckets(startAt: number, endAt: number) {
  if (endAt < startAt) return [] as number[];

  const buckets: number[] = [];
  for (
    let hour = floorToHour(startAt);
    hour <= floorToHour(endAt);
    hour += HOUR_MS
  ) {
    buckets.push(hour);
  }

  return buckets;
}

function formatHour(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(4); // "Alles" default
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [loadedRange, setLoadedRange] = useState<{
    rangeStartAt?: number;
    rangeEndAt?: number;
  }>({});

  const loadDataWithRange = useCallback(
    async (rangeStartAt?: number, rangeEndAt?: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const options =
          rangeStartAt !== undefined ? { rangeStartAt, rangeEndAt } : undefined;
        const result = await fetchAnalytics(options);
        setData(result);
        setLoadedRange({ rangeStartAt, rangeEndAt });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Fehler beim Laden der Daten.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (activePreset === null) return;
    const hours = TIME_PRESETS[activePreset].hours;
    if (hours > 0) {
      const now = Date.now();
      loadDataWithRange(now - hours * 60 * 60 * 1000, now);
    } else {
      loadDataWithRange();
    }
  }, [activePreset, loadDataWithRange]);

  function handlePresetClick(index: number) {
    setActivePreset(index);
    setCustomStart("");
    setCustomEnd("");
  }

  function handleCustomRangeApply() {
    const start = customStart ? new Date(customStart).getTime() : undefined;
    const end = customEnd ? new Date(customEnd).getTime() : undefined;
    if (start === undefined && end === undefined) return;
    setActivePreset(null);
    setRangeOpen(false);
    loadDataWithRange(start, end);
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background font-mono text-sm text-muted-foreground">
        Analyse wird geladen...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background font-mono text-sm text-destructive">
        <span>{error}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (activePreset !== null) {
              const hours = TIME_PRESETS[activePreset].hours;
              if (hours > 0) {
                const now = Date.now();
                loadDataWithRange(now - hours * 60 * 60 * 1000, now);
              } else {
                loadDataWithRange();
              }
            } else {
              const start = customStart
                ? new Date(customStart).getTime()
                : undefined;
              const end = customEnd ? new Date(customEnd).getTime() : undefined;
              loadDataWithRange(start, end);
            }
          }}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
            Datenqualität
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {TIME_PRESETS.map((preset, i) => (
            <Button
              key={preset.label}
              variant={activePreset === i ? "default" : "ghost"}
              size="sm"
              className="font-mono text-xs h-7"
              onClick={() => handlePresetClick(i)}
            >
              {preset.label}
            </Button>
          ))}
          <div className="h-4 w-px bg-border mx-1" />
          <Popover open={rangeOpen} onOpenChange={setRangeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={activePreset === null ? "default" : "ghost"}
                size="sm"
                className="font-mono text-xs h-7 gap-1.5"
              >
                <CalendarRange className="h-3.5 w-3.5" />
                Zeitraum
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 space-y-3">
              <p className="font-mono text-xs font-medium text-foreground">
                Zeitraum wählen
              </p>
              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground">
                  Von
                </label>
                <Input
                  type="datetime-local"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="font-mono text-xs h-8"
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground">
                  Bis
                </label>
                <Input
                  type="datetime-local"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="font-mono text-xs h-8"
                />
              </div>
              <Button
                size="sm"
                className="w-full font-mono text-xs h-7"
                onClick={handleCustomRangeApply}
                disabled={!customStart && !customEnd}
              >
                Anwenden
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary cards */}
        <SummaryCards data={data} />

        {/* Row: Pie chart + bar chart */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ValidityPieChart data={data} />
          <MessagesByTypeChart data={data} />
        </div>

        {/* Hourly trend */}
        <HourlyTrendChart data={data} />

        {/* Compliance & validity per posten detail */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ValidityByPostenBar data={data} />
        </div>

        {/* Compliance heatmap - full width */}
        <ComplianceHeatmap
          data={data}
          rangeStartAt={loadedRange.rangeStartAt}
          rangeEndAt={loadedRange.rangeEndAt}
        />
      </div>
    </div>
  );
}

// ─── Summary Cards ───────────────────────────────────────────────────────────

function SummaryCards({ data }: { data: AnalyticsData }) {
  const validityRate =
    data.totalMeldungen > 0
      ? Math.round((data.validMeldungen / data.totalMeldungen) * 1000) / 10
      : 0;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium font-mono">
            Total Meldungen
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {data.totalMeldungen.toLocaleString("de-CH")}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium font-mono">
            Gültig
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {data.validMeldungen.toLocaleString("de-CH")}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {validityRate}% Gültigkeitsrate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium font-mono">
            Zu prüfen
          </CardTitle>
          <Hourglass className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {data.reviewMeldungen.toLocaleString("de-CH")}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {data.totalMeldungen > 0
              ? `${Math.round((data.reviewMeldungen / data.totalMeldungen) * 1000) / 10}% Prüfquote`
              : "0% Prüfquote"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium font-mono">
            Ungültig
          </CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-red-600">
            {data.invalidMeldungen.toLocaleString("de-CH")}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {data.totalMeldungen > 0
              ? `${Math.round((data.invalidMeldungen / data.totalMeldungen) * 1000) / 10}% Ungültigkeitsrate`
              : "0% Ungültigkeitsrate"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium font-mono">
            Posten
          </CardTitle>
          <FileWarning className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">
            {data.validityByPosten.length}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            mit Meldungen
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Validity Pie Chart ──────────────────────────────────────────────────────

function ValidityPieChart({ data }: { data: AnalyticsData }) {
  const { pieData, chartConfig } = useMemo(() => {
    if (
      data.invalidMeldungen === 0 &&
      data.reviewMeldungen === 0 &&
      data.validMeldungen === 0
    ) {
      return {
        pieData: [],
        chartConfig: { value: { label: "Anteil" } } as ChartConfig,
      };
    }

    const total = data.totalMeldungen;
    const slices: Array<{
      name: string;
      value: number;
      percent: number;
      count: number;
      fill: string;
    }> = [];

    if (data.validMeldungen > 0) {
      const pct = Math.round((data.validMeldungen / total) * 1000) / 10;
      slices.push({
        name: "Gültig",
        value: pct,
        percent: pct,
        count: data.validMeldungen,
        fill: "hsl(142, 71%, 45%)",
      });
    }

    const reviewPosten = data.validityByPosten.filter((p) => p.review > 0);
    reviewPosten.forEach((p, i) => {
      const pct = Math.round((p.review / total) * 1000) / 10;
      slices.push({
        name: `${p.postenName} (zu prüfen)`,
        value: pct,
        percent: pct,
        count: p.review,
        fill: `hsl(${40 + (i % 4) * 8}, 92%, 50%)`,
      });
    });

    const invalidPosten = data.validityByPosten.filter((p) => p.invalid > 0);
    invalidPosten.forEach((p, i) => {
      const pct = Math.round((p.invalid / total) * 1000) / 10;
      slices.push({
        name: `${p.postenName} (ungültig)`,
        value: pct,
        percent: pct,
        count: p.invalid,
        fill: POSTEN_COLORS[i % POSTEN_COLORS.length],
      });
    });

    const cfg: ChartConfig = { value: { label: "Anteil" } };
    for (const slice of slices) {
      cfg[slice.name] = { label: slice.name, color: slice.fill };
    }

    return { pieData: slices, chartConfig: cfg };
  }, [data]);

  if (pieData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-mono">Gültigkeitsverteilung</CardTitle>
          <CardDescription className="font-mono">
            Anteil gültiger vs. ungültiger Meldungen nach Posten
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
          Keine Daten vorhanden
        </CardContent>
      </Card>
    );
  }

  const legendData = [...pieData].sort((left, right) => right.value - left.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono">Gültigkeitsverteilung</CardTitle>
        <CardDescription className="font-mono">
          Prozentualer Anteil — gültige Meldungen vs. ungültige nach
          Herkunfts-Posten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-[320px] max-h-[320px] w-full max-w-[320px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="name"
                  formatter={(value, name, item) => (
                    <span className="font-mono">
                      {name}: {(item.payload as { percent: number }).percent}% (
                      {(item.payload as { count: number }).count.toLocaleString(
                        "de-CH",
                      )}
                      )
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              strokeWidth={2}
              stroke="hsl(var(--background))"
              label={false}
            >
              {pieData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="grid max-h-44 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {legendData.map((entry) => (
            <div
              key={entry.name}
              className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5"
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.fill }}
              />
              <div className="min-w-0 font-mono text-[11px] leading-4">
                <div className="truncate text-foreground">{entry.name}</div>
                <div className="text-muted-foreground">
                  {entry.percent}% · {entry.count.toLocaleString("de-CH")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Messages by Type Bar Chart ──────────────────────────────────────────────

function MessagesByTypeChart({ data }: { data: AnalyticsData }) {
  const { chartData, typeNames, chartConfig } = useMemo(() => {
    const typeNameSet = new Set<string>();
    const postenNameSet = new Set<string>();

    for (const row of data.messagesByType) {
      typeNameSet.add(row.typeName);
      postenNameSet.add(row.postenName);
    }

    const typeNames = Array.from(typeNameSet);
    const postenNames = Array.from(postenNameSet);

    // Pivot: one entry per posten, with a key per type
    const chartData = postenNames.map((postenName) => {
      const entry: Record<string, string | number> = { posten: postenName };
      for (const typeName of typeNames) {
        const match = data.messagesByType.find(
          (r) => r.postenName === postenName && r.typeName === typeName,
        );
        entry[typeName] = match?.count ?? 0;
      }
      return entry;
    });

    const cfg: ChartConfig = {};
    typeNames.forEach((name, i) => {
      cfg[name] = { label: name, color: TYPE_COLORS[i % TYPE_COLORS.length] };
    });

    return { chartData, typeNames, chartConfig: cfg };
  }, [data.messagesByType]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-mono">Meldungen nach Typ</CardTitle>
          <CardDescription className="font-mono">
            Anzahl pro Meldungstyp je Posten
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
          Keine Daten vorhanden
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono">Meldungen nach Typ</CardTitle>
        <CardDescription className="font-mono">
          Anzahl pro Meldungstyp je Posten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="posten"
              type="category"
              width={100}
              tickLine={false}
              axisLine={false}
              className="font-mono text-[10px]"
            />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {typeNames.map((name, i) => (
              <Bar
                key={name}
                dataKey={name}
                stackId="a"
                fill={TYPE_COLORS[i % TYPE_COLORS.length]}
                radius={i === typeNames.length - 1 ? [0, 4, 4, 0] : 0}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ─── Hourly Trend Line Chart ─────────────────────────────────────────────────

function HourlyTrendChart({ data }: { data: AnalyticsData }) {
  const { chartData, postenNames, chartConfig } = useMemo(() => {
    const postenNameSet = new Set<string>();
    for (const row of data.hourlyTrend) {
      postenNameSet.add(row.postenName);
    }
    const postenNames = Array.from(postenNameSet);

    // Group by hour, pivot by posten with validity rate
    const hourMap = new Map<number, Record<string, number | string>>();
    for (const row of data.hourlyTrend) {
      const entry = hourMap.get(row.hour) ?? {
        hour: row.hour,
        hourLabel: formatHour(row.hour),
      };
      const rate =
        row.total > 0 ? Math.round((row.valid / row.total) * 100) : 100;
      entry[row.postenName] = rate;
      // Accumulate for overall
      entry[`_total_${row.postenName}`] = row.total;
      entry[`_valid_${row.postenName}`] = row.valid;
      hourMap.set(row.hour, entry);
    }

    // Compute overall rate per hour
    const chartData = Array.from(hourMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, entry]) => {
        let totalSum = 0;
        let validSum = 0;
        for (const pn of postenNames) {
          totalSum += (entry[`_total_${pn}`] as number) ?? 0;
          validSum += (entry[`_valid_${pn}`] as number) ?? 0;
        }
        const overall =
          totalSum > 0 ? Math.round((validSum / totalSum) * 100) : 100;

        // Clean up temp keys
        const clean: Record<string, number | string> = {
          hour: entry.hour,
          hourLabel: entry.hourLabel as string,
          Gesamt: overall,
        };
        for (const pn of postenNames) {
          clean[pn] = (entry[pn] as number) ?? 100;
        }
        return clean;
      });

    const cfg: ChartConfig = {
      Gesamt: { label: "Gesamt", color: "hsl(0, 0%, 45%)" },
    };
    postenNames.forEach((name, i) => {
      cfg[name] = {
        label: name,
        color: POSTEN_COLORS[i % POSTEN_COLORS.length],
      };
    });

    return { chartData, postenNames, chartConfig: cfg };
  }, [data.hourlyTrend]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-mono">30-Minuten-Qualitätstrend</CardTitle>
          <CardDescription className="font-mono">
            Gültigkeitsrate pro 30 Minuten
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
          Keine Daten vorhanden
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono flex items-center gap-2">
          <Clock className="h-4 w-4" />
          30-Minuten-Qualitätstrend
        </CardTitle>
        <CardDescription className="font-mono">
          Gültigkeitsrate (%) pro 30 Minuten je Posten und gesamt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hourLabel"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              interval="preserveStartEnd"
              className="font-mono text-[10px]"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              className="font-mono text-[10px]"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="font-mono">
                      {name}: {value}%
                    </span>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="Gesamt"
              stroke="hsl(0, 0%, 45%)"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
            />
            {postenNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={POSTEN_COLORS[i % POSTEN_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ─── Validity per Posten Bar Chart ───────────────────────────────────────────

function ValidityByPostenBar({ data }: { data: AnalyticsData }) {
  const chartConfig: ChartConfig = {
    validPct: { label: "Gültig %", color: "hsl(142, 71%, 45%)" },
    reviewPct: { label: "Zu prüfen %", color: "hsl(38, 92%, 50%)" },
    invalidPct: { label: "Ungültig %", color: "hsl(0, 84%, 60%)" },
  };

  const chartData = data.validityByPosten.map((p) => {
    const total = p.valid + p.review + p.invalid;
    return {
      posten: p.postenName,
      validPct: total > 0 ? Math.round((p.valid / total) * 1000) / 10 : 0,
      reviewPct: total > 0 ? Math.round((p.review / total) * 1000) / 10 : 0,
      invalidPct: total > 0 ? Math.round((p.invalid / total) * 1000) / 10 : 0,
      review: p.review,
      valid: p.valid,
      invalid: p.invalid,
      total,
    };
  });

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-mono">Qualität je Posten</CardTitle>
          <CardDescription className="font-mono">
            Gültigkeitsrate pro Posten in Prozent
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
          Keine Daten vorhanden
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono">Qualität je Posten</CardTitle>
        <CardDescription className="font-mono">
          Gültigkeitsrate pro Posten in Prozent (100% = alle gültig)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="posten"
              type="category"
              width={100}
              tickLine={false}
              axisLine={false}
              className="font-mono text-[10px]"
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const d = item.payload as {
                      review: number;
                      valid: number;
                      invalid: number;
                      total: number;
                    };
                    if (name === "validPct")
                      return (
                        <span className="font-mono">
                          Gültig: {value}% ({d.valid.toLocaleString("de-CH")})
                        </span>
                      );
                    if (name === "reviewPct") {
                      return (
                        <span className="font-mono">
                          Zu prüfen: {value}% ({d.review.toLocaleString("de-CH")})
                        </span>
                      );
                    }
                    return (
                      <span className="font-mono">
                        Ungültig: {value}% ({d.invalid.toLocaleString("de-CH")})
                      </span>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="validPct"
              stackId="a"
              fill="hsl(142, 71%, 45%)"
              radius={0}
            />
            <Bar
              dataKey="reviewPct"
              stackId="a"
              fill="hsl(38, 92%, 50%)"
              radius={0}
            />
            <Bar
              dataKey="invalidPct"
              stackId="a"
              fill="hsl(0, 84%, 60%)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ─── Compliance Heatmap ──────────────────────────────────────────────────────

function ComplianceHeatmap({
  data,
  rangeStartAt,
  rangeEndAt,
}: {
  data: AnalyticsData;
  rangeStartAt?: number;
  rangeEndAt?: number;
}) {
  const complianceTypes = useMemo(() => {
    const seen = new Map<
      number,
      { typeId: number; typeName: string; minPerHour: number }
    >();
    for (const row of data.compliance) {
      if (row.minPerHour > 0 && !seen.has(row.typeId)) {
        seen.set(row.typeId, {
          typeId: row.typeId,
          typeName: row.typeName,
          minPerHour: row.minPerHour,
        });
      }
    }
    return Array.from(seen.values()).sort((left, right) =>
      left.typeName.localeCompare(right.typeName),
    );
  }, [data.compliance]);

  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    complianceTypes[0]?.typeId.toString() ?? "",
  );

  // Reset selection when compliance types change
  useEffect(() => {
    if (
      complianceTypes.length > 0 &&
      !complianceTypes.find((t) => t.typeId.toString() === selectedTypeId)
    ) {
      setSelectedTypeId(complianceTypes[0].typeId.toString());
    }
  }, [complianceTypes, selectedTypeId]);

  const selectedType = complianceTypes.find(
    (t) => t.typeId.toString() === selectedTypeId,
  );

  const { hours, postenRows, stats } = useMemo(() => {
    if (!selectedType)
      return {
        hours: [] as number[],
        postenRows: [] as Array<{
          postenName: string;
          cells: Array<{ hour: number; count: number; reached: boolean }>;
        }>,
        stats: { totalSlots: 0, reachedSlots: 0 },
      };

    const typeId = selectedType.typeId;
    const min = selectedType.minPerHour;

    const filtered = data.hourlyByType.filter((r) => r.typeId === typeId);

    const postenNameSet = new Set<string>();
    for (const row of data.compliance) {
      if (row.typeId === typeId) {
        postenNameSet.add(row.postenName);
      }
    }

    const observedHours = filtered.map((row) => row.hour);
    const fallbackHours =
      data.hourlyByType.length > 0
        ? data.hourlyByType.map((row) => row.hour)
        : data.hourlyTrend.map((row) => floorToHour(row.hour));

    for (const row of filtered) {
      postenNameSet.add(row.postenName);
    }

    if (postenNameSet.size === 0) {
      for (const p of data.validityByPosten) {
        postenNameSet.add(p.postenName);
      }
    }

    const postenNames = Array.from(postenNameSet).sort();
    const observedHourStart =
      observedHours.length > 0 ? Math.min(...observedHours) : undefined;
    const observedHourEnd =
      observedHours.length > 0 ? Math.max(...observedHours) : undefined;
    const fallbackHourStart =
      fallbackHours.length > 0 ? Math.min(...fallbackHours) : undefined;
    const fallbackHourEnd =
      fallbackHours.length > 0 ? Math.max(...fallbackHours) : undefined;
    const resolvedStart =
      rangeStartAt ?? observedHourStart ?? fallbackHourStart ?? rangeEndAt;
    const resolvedEnd =
      rangeEndAt ?? observedHourEnd ?? fallbackHourEnd ?? resolvedStart;
    const hours =
      resolvedStart !== undefined && resolvedEnd !== undefined
        ? buildHourBuckets(resolvedStart, resolvedEnd)
        : [];

    const cellMap = new Map<string, { count: number; reached: boolean }>();
    for (const row of filtered) {
      cellMap.set(`${row.postenName}:${row.hour}`, {
        count: row.count,
        reached: row.count >= min,
      });
    }

    const postenRows = postenNames
      .map((postenName) => {
        const cells = hours.map((hour) => {
          const cell = cellMap.get(`${postenName}:${hour}`) ?? {
            count: 0,
            reached: false,
          };

          return {
            hour,
            count: cell.count,
            reached: cell.reached,
          };
        });

        return {
          postenName,
          cells,
        };
      })
      .sort((left, right) => left.postenName.localeCompare(right.postenName));

    const totalSlots = postenRows.length * hours.length;
    const reachedSlots = postenRows.reduce(
      (sum, row) => sum + row.cells.filter((cell) => cell.reached).length,
      0,
    );

    return {
      hours,
      postenRows,
      stats: { totalSlots, reachedSlots },
    };
  }, [
    data.compliance,
    data.hourlyByType,
    data.hourlyTrend,
    data.validityByPosten,
    rangeEndAt,
    rangeStartAt,
    selectedType,
  ]);

  if (complianceTypes.length === 0) {
    return (
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="font-mono">Meldepflicht-Erfüllung</CardTitle>
          <CardDescription className="font-mono">
            Wurde das Ziel pro Stunde und Posten erreicht?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground font-mono text-sm">
          Keine Meldungstypen mit Mindestanforderung (min/h)
        </CardContent>
      </Card>
    );
  }

  const reachedPct =
    stats.totalSlots > 0
      ? Math.round((stats.reachedSlots / stats.totalSlots) * 100)
      : 0;

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="font-mono">Meldepflicht-Erfüllung</CardTitle>
            <CardDescription className="font-mono">
              Tabelle pro Posten und Stunde. Ziel: {selectedType?.minPerHour ?? "–"}
              {" "}Meldungen/h.
              <span className="ml-2">
                Erfüllte Stunden-Slots:{" "}
                <span
                  className={cn(
                    "font-bold",
                    reachedPct >= 80 ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {reachedPct}%
                </span>{" "}
                ({stats.reachedSlots}/{stats.totalSlots})
              </span>
            </CardDescription>
          </div>
          <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
            <SelectTrigger size="sm" className="font-mono text-xs w-auto">
              <SelectValue placeholder="Meldungstyp wählen" />
            </SelectTrigger>
            <SelectContent>
              {complianceTypes.map((t) => (
                <SelectItem
                  key={t.typeId}
                  value={t.typeId.toString()}
                  className="font-mono text-xs"
                >
                  {t.typeName} (min. {t.minPerHour}/h)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {hours.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground font-mono text-sm">
            Keine Daten im gewählten Zeitraum
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto rounded-md border border-border">
            <div className="min-w-max">
              <table className="border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="sticky left-0 z-10 border-b border-r border-border bg-muted/30 px-3 py-2 text-left font-medium text-foreground">
                    Posten
                  </th>
                  {hours.map((hour) => (
                    <th
                      key={hour}
                      className="border-b border-border px-3 py-2 text-center font-medium text-foreground"
                    >
                      {formatHour(hour)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {postenRows.map((row) => (
                  <tr key={row.postenName} className="border-b border-border/60 last:border-b-0">
                    <td className="sticky left-0 z-10 border-r border-border bg-background px-3 py-2 text-left font-medium text-foreground whitespace-nowrap">
                      {row.postenName}
                    </td>
                    {row.cells.map((cell) => (
                      <td
                        key={`${row.postenName}-${cell.hour}`}
                        title={`${formatHour(cell.hour)}: ${cell.count} Meldungen (${cell.reached ? "Ziel erreicht" : "Ziel verfehlt"})`}
                        className={cn(
                          "border-l border-border/40 px-3 py-2 text-center tabular-nums whitespace-nowrap",
                          cell.reached
                            ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-500/12 text-red-700 dark:text-red-400",
                        )}
                      >
                        {cell.reached ? `${cell.count}` : `${cell.count}`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
