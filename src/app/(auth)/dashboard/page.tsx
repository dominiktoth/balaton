"use client";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { SectionCards } from "~/components/section-cards";
import { ChartAreaInteractive } from "~/components/chart-area-interactive";
import { supabase } from "~/server/auth/supabaseClient";
import React from "react";

export default function DashboardPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");

  const { data: stores, isLoading } = api.store.getAllStores.useQuery();
  const { data: expenses, isLoading: isExpensesLoading } =
    api.expense.getAllExpenses.useQuery();
  const { data: todayTotal = 0 } = api.order.getStoreOrders.useQuery(
    { storeId: selectedStoreId },
    { enabled: selectedStoreId !== "all" },
  );
  const { data: allOrders = [] } = api.order.getStoreOrders.useQuery({
    storeId: selectedStoreId,
  });
  const [user, setUser] = React.useState<{
    name: string;
    email: string;
    avatar: string;
  } | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then((response) => {
      console.log(response);
      if (response.data?.user) {
        setUser({
          name: response.data.user.email || "Unknown",
          email: response.data.user.role || "Unknown",
          avatar: response.data.user.user_metadata.avatar_url || "",
        });
      }
    });
  }, []);

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
                  date: expense.date.toISOString(),
                  storeId: expense.storeId,
                  amount: expense.amount,
                })) || []
              }
            />{" "}
          </div>
        </div>
      </div>
    </div>
  );
}
