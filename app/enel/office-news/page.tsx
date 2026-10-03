"use client";

import React from "react";
import { Page } from "@/components/ui";
import { OfficeNews, OfficeNewsSourceNote, useOfficeNews } from "@/components/OfficeNews";

export default function OfficeNewsPage() {
  const news = useOfficeNews();
  return (
    <Page title="Office news" description="Regulatory, funding and consultation updates with a timely follow-up for the Enel team.">
      <OfficeNews data={news.data} loading={news.loading} error={news.error} onRetry={news.reload} showSchedule />
      <OfficeNewsSourceNote data={news.data} />
    </Page>
  );
}
