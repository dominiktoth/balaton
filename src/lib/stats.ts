/**
 * Statisztika-számítás: tiszta függvények, UI nélkül.
 *
 * Minden dátum "nap-kulcs" (YYYY-MM-DD) formában, UTC alapon van kezelve.
 * Az alkalmazás a dátumokat nap pontossággal rögzíti (a form YYYY-MM-DD-t küld,
 * amiből UTC éjfél lesz), így az UTC alapú bontás determinisztikus, és nem
 * csúszik el szerver/kliens időzóna szerint.
 */

export type MoneyRow = { date: string; storeId: string | null; amount: number };
export type InvestmentRow = MoneyRow & { note: string | null };
export type WageRow = MoneyRow & {
  workerId: string;
  paid: boolean;
  paidAmount: number;
};
export type ShiftRow = { date: string; storeId: string; workerId: string };
export type StoreRef = { id: string; name: string };
export type WorkerRef = {
  id: string;
  name: string;
  dailyWage: number | null;
  advanceBalance: number;
};

export type StatsPayload = {
  stores: StoreRef[];
  workers: WorkerRef[];
  incomes: MoneyRow[];
  expenses: MoneyRow[];
  investments: InvestmentRow[];
  wages: WageRow[];
  shifts: ShiftRow[];
};

/* ------------------------------------------------------------------ */
/* Dátum segédfüggvények                                               */
/* ------------------------------------------------------------------ */

export const WEEKDAY_NAMES = [
  "Hétfő",
  "Kedd",
  "Szerda",
  "Csütörtök",
  "Péntek",
  "Szombat",
  "Vasárnap",
] as const;

export const WEEKDAY_SHORT = ["H", "K", "Sze", "Cs", "P", "Szo", "V"] as const;

const MONTHS_SHORT = [
  "jan.",
  "febr.",
  "márc.",
  "ápr.",
  "máj.",
  "jún.",
  "júl.",
  "aug.",
  "szept.",
  "okt.",
  "nov.",
  "dec.",
] as const;

const MONTHS_LONG = [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december",
] as const;

/** Dátum (ISO string vagy Date) -> YYYY-MM-DD nap-kulcs, UTC alapon. */
export function dayKey(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10);
}

export function keyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function addDays(key: string, days: number): string {
  const d = keyToDate(key);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(fromKey: string, toKey: string): number {
  return Math.round(
    (keyToDate(toKey).getTime() - keyToDate(fromKey).getTime()) / 86_400_000,
  );
}

/** 0 = hétfő … 6 = vasárnap */
export function weekdayIndex(key: string): number {
  return (keyToDate(key).getUTCDay() + 6) % 7;
}

/** A kulcshoz tartozó hét hétfője. */
export function weekStart(key: string): string {
  return addDays(key, -weekdayIndex(key));
}

/** ISO hétszám (a magyar gyakorlat is ezt használja). */
export function isoWeek(key: string): { year: number; week: number } {
  const d = keyToDate(key);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // az adott hét csütörtöke
  const isoYear = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3,
  );
  const week =
    1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return { year: isoYear, week };
}

export function monthKey(key: string): string {
  return key.slice(0, 7);
}

/* ------------------------------------------------------------------ */
/* Formázás                                                            */
/* ------------------------------------------------------------------ */

const HUF = new Intl.NumberFormat("hu-HU", {
  style: "currency",
  currency: "HUF",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 });

export function formatHuf(value: number): string {
  return HUF.format(Math.round(value));
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

/** Tengelyekhez / szűk helyre: 120 M · 1,2 M · 850 e */
export function formatShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000_000) return `${formatNumber(value / 1_000_000)} M`;
  if (abs >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)} M`;
  if (abs >= 1_000) return `${formatNumber(value / 1_000)} e`;
  return NUM.format(Math.round(value));
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "–";
  return `${formatNumber(value, digits)}%`;
}

/** "júl. 7." */
export function formatDay(key: string): string {
  const d = keyToDate(key);
  return `${MONTHS_SHORT[d.getUTCMonth()] ?? ""} ${d.getUTCDate()}.`;
}

/** "2025. júl. 7. (H)" */
export function formatDayFull(key: string): string {
  const d = keyToDate(key);
  return `${d.getUTCFullYear()}. ${MONTHS_SHORT[d.getUTCMonth()] ?? ""} ${d.getUTCDate()}. (${
    WEEKDAY_SHORT[weekdayIndex(key)] ?? ""
  })`;
}

/** "2025. július" */
export function formatMonth(key: string): string {
  const [year, month] = key.split("-");
  const idx = Number(month) - 1;
  return `${year ?? ""}. ${MONTHS_LONG[idx] ?? ""}`;
}

/* ------------------------------------------------------------------ */
/* Szűrés / bontás                                                     */
/* ------------------------------------------------------------------ */

export function scopeToStore(data: StatsPayload, storeId: string): StatsPayload {
  if (storeId === "all") return data;
  return {
    stores: data.stores.filter((s) => s.id === storeId),
    workers: data.workers,
    incomes: data.incomes.filter((r) => r.storeId === storeId),
    expenses: data.expenses.filter((r) => r.storeId === storeId),
    investments: data.investments.filter((r) => r.storeId === storeId),
    wages: data.wages.filter((r) => r.storeId === storeId),
    shifts: data.shifts.filter((r) => r.storeId === storeId),
  };
}

export type DayBucket = {
  key: string;
  income: number;
  expense: number;
  wage: number;
  investment: number;
  shifts: number;
  workers: number;
  profit: number;
};

/**
 * Napi bontás a teljes [from, to] intervallumra — a hiányzó napok
 * nullákkal töltve, hogy a diagram és a heti/napi átlagok helyesek legyenek.
 */
export function buildDailyBuckets(
  data: StatsPayload,
  from: string,
  to: string,
): DayBucket[] {
  const map = new Map<string, DayBucket>();
  const workerSets = new Map<string, Set<string>>();

  const ensure = (key: string): DayBucket => {
    let bucket = map.get(key);
    if (!bucket) {
      bucket = {
        key,
        income: 0,
        expense: 0,
        wage: 0,
        investment: 0,
        shifts: 0,
        workers: 0,
        profit: 0,
      };
      map.set(key, bucket);
      workerSets.set(key, new Set());
    }
    return bucket;
  };

  if (from <= to) {
    const span = Math.min(diffDays(from, to), 3_000);
    for (let i = 0; i <= span; i++) ensure(addDays(from, i));
  }

  for (const row of data.incomes) ensure(dayKey(row.date)).income += row.amount;
  for (const row of data.expenses) ensure(dayKey(row.date)).expense += row.amount;
  for (const row of data.wages) ensure(dayKey(row.date)).wage += row.amount;
  for (const row of data.investments)
    ensure(dayKey(row.date)).investment += row.amount;
  for (const row of data.shifts) {
    const key = dayKey(row.date);
    ensure(key).shifts += 1;
    workerSets.get(key)?.add(row.workerId);
  }

  return [...map.values()]
    .map((b) => ({
      ...b,
      workers: workerSets.get(b.key)?.size ?? 0,
      profit: b.income - b.expense - b.wage,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Aktív (nyitott) nap: volt bevétel vagy volt műszak. */
export function isActiveDay(day: DayBucket): boolean {
  return day.income > 0 || day.shifts > 0;
}

export type GroupBucket = {
  key: string;
  label: string;
  sublabel: string;
  income: number;
  expense: number;
  wage: number;
  investment: number;
  profit: number;
  shifts: number;
  days: number;
  activeDays: number;
  avgIncome: number;
  margin: number;
  wageRatio: number;
};

export type GroupMode = "day" | "week" | "month" | "weekday";

export function groupDaily(
  daily: DayBucket[],
  mode: GroupMode,
): GroupBucket[] {
  type Acc = Omit<GroupBucket, "avgIncome" | "margin" | "wageRatio"> & {
    sortKey: string;
  };
  const map = new Map<string, Acc>();

  for (const day of daily) {
    let key: string;
    let sortKey: string;
    let label: string;
    let sublabel: string;

    if (mode === "day") {
      key = day.key;
      sortKey = day.key;
      label = formatDay(day.key);
      sublabel = WEEKDAY_NAMES[weekdayIndex(day.key)] ?? "";
    } else if (mode === "week") {
      const start = weekStart(day.key);
      const { week } = isoWeek(day.key);
      key = start;
      sortKey = start;
      label = `${week}. hét`;
      sublabel = `${formatDay(start)} – ${formatDay(addDays(start, 6))}`;
    } else if (mode === "month") {
      key = monthKey(day.key);
      sortKey = key;
      label = formatMonth(key);
      sublabel = "";
    } else {
      const idx = weekdayIndex(day.key);
      key = String(idx);
      sortKey = String(idx);
      label = WEEKDAY_NAMES[idx] ?? "";
      sublabel = "";
    }

    let acc = map.get(key);
    if (!acc) {
      acc = {
        key,
        sortKey,
        label,
        sublabel,
        income: 0,
        expense: 0,
        wage: 0,
        investment: 0,
        profit: 0,
        shifts: 0,
        days: 0,
        activeDays: 0,
      };
      map.set(key, acc);
    }
    acc.income += day.income;
    acc.expense += day.expense;
    acc.wage += day.wage;
    acc.investment += day.investment;
    acc.profit += day.profit;
    acc.shifts += day.shifts;
    acc.days += 1;
    if (isActiveDay(day)) acc.activeDays += 1;
  }

  return [...map.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey, undefined, { numeric: true }))
    .map(({ sortKey: _sortKey, ...acc }) => ({
      ...acc,
      avgIncome: acc.activeDays > 0 ? acc.income / acc.activeDays : 0,
      margin: acc.income > 0 ? (acc.profit / acc.income) * 100 : 0,
      wageRatio: acc.income > 0 ? (acc.wage / acc.income) * 100 : 0,
    }));
}

/* ------------------------------------------------------------------ */
/* Összesítők                                                          */
/* ------------------------------------------------------------------ */

export type Totals = {
  income: number;
  expense: number;
  wage: number;
  investment: number;
  profit: number;
  /** Eredmény a befektetéseket is beleszámítva (cash-flow nézet). */
  cashFlow: number;
  days: number;
  activeDays: number;
  shifts: number;
  avgIncome: number;
  avgProfit: number;
  avgWage: number;
  avgExpense: number;
  margin: number;
  wageRatio: number;
  expenseRatio: number;
  incomePerShift: number;
  wagePerShift: number;
  /** Az időszakban keletkezett, még ki nem fizetett bér. */
  unpaidWage: number;
  best: DayBucket | null;
  worst: DayBucket | null;
};

export function computeTotals(daily: DayBucket[], data: StatsPayload): Totals {
  const income = sum(daily, (d) => d.income);
  const expense = sum(daily, (d) => d.expense);
  const wage = sum(daily, (d) => d.wage);
  const investment = sum(daily, (d) => d.investment);
  const shifts = sum(daily, (d) => d.shifts);
  const profit = income - expense - wage;
  const activeDays = daily.filter(isActiveDay).length;
  const withIncome = daily.filter((d) => d.income > 0);

  const best = withIncome.reduce<DayBucket | null>(
    (acc, d) => (!acc || d.income > acc.income ? d : acc),
    null,
  );
  const worst = withIncome.reduce<DayBucket | null>(
    (acc, d) => (!acc || d.income < acc.income ? d : acc),
    null,
  );

  const unpaidWage = data.wages.reduce(
    (acc, w) => acc + Math.max(0, w.amount - w.paidAmount),
    0,
  );

  return {
    income,
    expense,
    wage,
    investment,
    profit,
    cashFlow: profit - investment,
    days: daily.length,
    activeDays,
    shifts,
    avgIncome: activeDays > 0 ? income / activeDays : 0,
    avgProfit: activeDays > 0 ? profit / activeDays : 0,
    avgWage: activeDays > 0 ? wage / activeDays : 0,
    avgExpense: activeDays > 0 ? expense / activeDays : 0,
    margin: income > 0 ? (profit / income) * 100 : 0,
    wageRatio: income > 0 ? (wage / income) * 100 : 0,
    expenseRatio: income > 0 ? (expense / income) * 100 : 0,
    incomePerShift: shifts > 0 ? income / shifts : 0,
    wagePerShift: shifts > 0 ? wage / shifts : 0,
    unpaidWage,
    best,
    worst,
  };
}

export type StoreStat = {
  id: string;
  name: string;
  income: number;
  expense: number;
  wage: number;
  investment: number;
  profit: number;
  shifts: number;
  activeDays: number;
  avgIncome: number;
  margin: number;
  wageRatio: number;
  incomePerShift: number;
  share: number;
};

export function perStore(
  data: StatsPayload,
  from: string,
  to: string,
): StoreStat[] {
  const totalIncome = data.incomes.reduce((acc, r) => acc + r.amount, 0);
  return data.stores
    .map((store) => {
      const scoped = scopeToStore(data, store.id);
      const daily = buildDailyBuckets(scoped, from, to);
      const totals = computeTotals(daily, scoped);
      return {
        id: store.id,
        name: store.name,
        income: totals.income,
        expense: totals.expense,
        wage: totals.wage,
        investment: totals.investment,
        profit: totals.profit,
        shifts: totals.shifts,
        activeDays: totals.activeDays,
        avgIncome: totals.avgIncome,
        margin: totals.margin,
        wageRatio: totals.wageRatio,
        incomePerShift: totals.incomePerShift,
        share: totalIncome > 0 ? (totals.income / totalIncome) * 100 : 0,
      };
    })
    .sort((a, b) => b.income - a.income);
}

export type WorkerStat = {
  id: string;
  name: string;
  shifts: number;
  wage: number;
  paid: number;
  unpaid: number;
  advanceBalance: number;
  avgWage: number;
  /** A dolgozó bére az időszak összes bérének hány százaléka. */
  share: number;
};

export function perWorker(data: StatsPayload): WorkerStat[] {
  const totalWage = data.wages.reduce((acc, w) => acc + w.amount, 0);
  const byWorker = new Map<string, { shifts: number; wage: number; paid: number }>();

  const ensure = (id: string) => {
    let acc = byWorker.get(id);
    if (!acc) {
      acc = { shifts: 0, wage: 0, paid: 0 };
      byWorker.set(id, acc);
    }
    return acc;
  };

  for (const shift of data.shifts) ensure(shift.workerId).shifts += 1;
  for (const wage of data.wages) {
    const acc = ensure(wage.workerId);
    acc.wage += wage.amount;
    acc.paid += Math.min(wage.paidAmount, wage.amount);
  }

  const nameOf = new Map(data.workers.map((w) => [w.id, w] as const));

  return [...byWorker.entries()]
    .map(([id, acc]) => {
      const worker = nameOf.get(id);
      return {
        id,
        name: worker?.name ?? "Ismeretlen dolgozó",
        shifts: acc.shifts,
        wage: acc.wage,
        paid: acc.paid,
        unpaid: Math.max(0, acc.wage - acc.paid),
        advanceBalance: worker?.advanceBalance ?? 0,
        avgWage: acc.shifts > 0 ? acc.wage / acc.shifts : 0,
        share: totalWage > 0 ? (acc.wage / totalWage) * 100 : 0,
      };
    })
    .filter((w) => w.shifts > 0 || w.wage > 0)
    .sort((a, b) => b.wage - a.wage);
}

/** Kumulált eredmény- és befektetés-görbe (megtérülés követéshez). */
export function buildCumulative(
  daily: DayBucket[],
  opening: { profit: number; investment: number } = { profit: 0, investment: 0 },
) {
  let profit = opening.profit;
  let investment = opening.investment;
  return daily.map((day) => {
    profit += day.profit;
    investment += day.investment;
    return {
      key: day.key,
      profit,
      investment,
      net: profit - investment,
    };
  });
}

export function delta(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function sum<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((acc, row) => acc + pick(row), 0);
}

/* ------------------------------------------------------------------ */
/* Időszak-preset-ek                                                   */
/* ------------------------------------------------------------------ */

export type PeriodPreset =
  | "season"
  | "last30"
  | "last7"
  | "year"
  | "prevYear"
  | "all"
  | "custom";

/** A strandszezon: május 1. – szeptember 30. */
export function seasonRange(year: number): { from: string; to: string } {
  return { from: `${year}-05-01`, to: `${year}-09-30` };
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function resolvePeriod(
  preset: PeriodPreset,
  year: number,
  custom: { from: string; to: string },
  firstActivity?: string | null,
): { from: string; to: string } {
  const today = todayKey();
  switch (preset) {
    case "season":
      return seasonRange(year);
    case "last30":
      return { from: addDays(today, -29), to: today };
    case "last7":
      return { from: addDays(today, -6), to: today };
    case "year":
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case "prevYear":
      return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    case "all":
      return { from: firstActivity ?? `${year - 4}-01-01`, to: today };
    default:
      return custom;
  }
}

/** Az összehasonlító időszak: ugyanaz a hossz közvetlenül előtte, vagy az előző év azonos szakasza. */
export function comparisonRange(
  range: { from: string; to: string },
  mode: "previous" | "lastYear",
): { from: string; to: string } {
  if (mode === "lastYear") {
    return {
      from: shiftYear(range.from, -1),
      to: shiftYear(range.to, -1),
    };
  }
  const length = diffDays(range.from, range.to) + 1;
  return {
    from: addDays(range.from, -length),
    to: addDays(range.to, -length),
  };
}

function shiftYear(key: string, years: number): string {
  const d = keyToDate(key);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

/** CSV export a bontás-táblákhoz. */
export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(";"),
    )
    .join("\n");
}
