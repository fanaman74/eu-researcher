import { useState, useEffect } from "react";

export interface Entity {
  id: string;
  name: string;
  party: string;
  role: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface PoliticalEvent {
  id: string;
  title: string;
  description: string;
  content: string;
  date: string;
  sourceType: "Official" | "News";
  sourceName: string;
  sourceUrl: string;
  category: string;
  impactLevel: "High" | "Medium" | "Low";
  tags: Tag[];
  entities: {
    entity: Entity;
  }[];
}

export interface FilterParams {
  q: string;
  sourceType: string;
  category: string;
  party: string;
  days: number;
}

export function usePoliticalEvents(filters: FilterParams) {
  const [events, setEvents] = useState<PoliticalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: filters.q,
        sourceType: filters.sourceType,
        category: filters.category,
        party: filters.party,
        days: filters.days.toString()
      });

      const res = await fetch(`http://localhost:5000/api/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch rolling timeline records.");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || "An issue occurred querying backend data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 250); // 250ms debouncing search inputs

    return () => clearTimeout(delayDebounceFn);
  }, [filters.q, filters.sourceType, filters.category, filters.party, filters.days]);

  return { events, loading, error, refetch: fetchEvents };
}
