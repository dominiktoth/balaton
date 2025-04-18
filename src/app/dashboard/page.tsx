'use client'
import { useState } from "react";
import { api } from "~/trpc/react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { SectionCards } from "~/components/section-cards";
import { ChartAreaInteractive } from "~/components/chart-area-interactive";
import { supabase } from "~/server/auth/supabaseClient";

export default function DashboardPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  const { data: stores, isLoading } = api.store.getAllStores.useQuery();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Tabs
            value={selectedStoreId}
            onValueChange={(val) => setSelectedStoreId(val)}
            className="px-4 lg:px-6"
          >
            <TabsList className="flex w-full overflow-x-auto py-2 md:py-4 ">
              <TabsTrigger value="all" className="min-w-max px-4 py-2">
                Összes bolt
              </TabsTrigger>
              {!isLoading &&
                stores?.map((store) => (
                  <TabsTrigger
                    key={store.id}
                    value={store.id}
                    className="min-w-max px-4 py-2"
                  >
                    {store.name}
                  </TabsTrigger>
                ))}
            </TabsList>
          </Tabs>

          <SectionCards storeId={selectedStoreId} />

          <div className="px-4 lg:px-6">
            <ChartAreaInteractive storeId={selectedStoreId} />
          </div>
        </div>
      </div>
    </div>
  );
}
