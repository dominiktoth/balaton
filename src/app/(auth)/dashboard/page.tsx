"use client";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { SectionCards } from "~/components/section-cards";
import { ChartAreaInteractive } from "~/components/chart-area-interactive";
import { supabase } from "~/server/auth/supabaseClient";
import React from "react";
import { IncomeDialog } from "~/components/IncomeDialog";
import { WorkshiftDialog } from "~/components/WorkshiftDialog";
import { ExpenseDialog } from "~/components/ExpenseDialog";

export default function DashboardPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");

  const { data: stores, isLoading } = api.store.getAllStores.useQuery();
  const { data: expenses, isLoading: isExpensesLoading, refetch: refetchExpenses } =
    api.expense.getAllExpenses.useQuery();
  const { data: todayTotal = 0 } = api.order.getStoreOrders.useQuery(
    { storeId: selectedStoreId },
    { enabled: selectedStoreId !== "all" },
  );
  const { data: allOrders = [] } = api.order.getStoreOrders.useQuery({
    storeId: selectedStoreId,
  });

  // Fetch incomes
  const { data: allIncomes = [], refetch: refetchAllIncomes } = api.income.getAllIncomes.useQuery(undefined, {
    enabled: selectedStoreId === "all",
  });
  const { data: incomes = [], refetch: refetchIncomes } = api.income.getIncomesByStore.useQuery(
    { storeId: selectedStoreId },
    { enabled: selectedStoreId !== "all" && !!selectedStoreId }
  );

  // Use correct incomes array for chart and summary
  const incomesToShow = selectedStoreId === "all" ? allIncomes : incomes;

  // Debug: log incomesToShow
  console.log('incomesToShow', incomesToShow);

  // Fetch workers
  const { data: workers = [], refetch: refetchWorkers } = api.worker.getWorkers.useQuery();

  // Refetch all relevant data after dialog actions
  const handleDataRefresh = () => {
    void refetchExpenses();
    void refetchIncomes();
    void refetchAllIncomes();
    void refetchWorkers();
  };

  const [user, setUser] = React.useState<{
    name: string;
    email: string;
    avatar: string;
  } | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then((response) => {
      if (response.data?.user) {
        setUser({
          name: response.data.user.email || "Unknown",
          email: response.data.user.role || "Unknown",
          avatar: response.data.user.user_metadata.avatar_url || "",
        });
      }
    });
  }, []);

  // Calculate profit if incomes and expenses are available
  const totalIncome = incomesToShow.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = (expenses || []).reduce((sum, e) => sum + e.amount, 0);
  const profit = totalIncome - totalExpense;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Tabs
            value={selectedStoreId}
            onValueChange={(val) => setSelectedStoreId(val)}
            className="px-4 lg:px-6"
          >
            <div className="relative">
              <TabsList
                className="scrollbar-hide flex w-full gap-2 overflow-x-auto px-1 pb-2"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <TabsTrigger
                  value="all"
                  className="border-muted bg-background hover:bg-muted data-[state=active]:bg-primary data-[state=active]:border-primary min-w-max rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition data-[state=active]:text-white"
                >
                  Összes bolt
                </TabsTrigger>
                {!isLoading &&
                  stores?.map((store) => (
                    <TabsTrigger
                      key={store.id}
                      value={store.id}
                      className="border-muted bg-background hover:bg-muted data-[state=active]:bg-primary data-[state=active]:border-primary min-w-max rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition data-[state=active]:text-white"
                    >
                      {store.name}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </div>
          </Tabs>

          {/* Dialogs for income, expense, and workshift */}
          <div className="flex gap-4 px-4 lg:px-6">
            {stores && stores.length > 0 && (
              <>
                <IncomeDialog stores={stores} onSuccess={handleDataRefresh} />
                <ExpenseDialog stores={stores} onSuccess={handleDataRefresh} />
              </>
            )}
            {stores && stores.length > 0 && workers && workers.length > 0 && (
              <WorkshiftDialog stores={stores} workers={workers} onSuccess={handleDataRefresh} />
            )}
          </div>

          {/* Summary Section */}
          <div className="px-4 lg:px-6 flex gap-8 mt-4">
            <div>
              <div className="font-bold">Bevételek összesen</div>
              <div>{totalIncome.toLocaleString()} Ft</div>
            </div>
            <div>
              <div className="font-bold">Kiadások összesen</div>
              <div>{totalExpense.toLocaleString()} Ft</div>
            </div>
            <div>
              <div className="font-bold">Profit</div>
              <div>{profit.toLocaleString()} Ft</div>
            </div>
          </div>

          <SectionCards
            storeId={selectedStoreId}
            todayTotal={todayTotal}
            expenses={expenses || []}
          />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive
              storeId={selectedStoreId}
              expenses={
                expenses?.map((expense) => ({
                  date: typeof expense.date === 'string' ? expense.date : expense.date.toISOString(),
                  storeId: expense.storeId,
                  amount: expense.amount,
                })) || []
              }
              incomes={
                incomesToShow?.map((income) => ({
                  date: typeof income.date === 'string' ? income.date : income.date.toISOString(),
                  storeId: income.storeId,
                  amount: income.amount,
                })) || []
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
