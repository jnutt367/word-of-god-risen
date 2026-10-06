import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlan, getAllPlans } from "@/lib/plans";
import PlanDetail from "@/components/PlanDetail";

export function generateStaticParams() {
  return getAllPlans().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const plan = getPlan(id);
  if (!plan) return { title: "Reading plan" };
  return {
    title: plan.title,
    description: `${plan.tagline}. ${plan.description}`,
    alternates: { canonical: `/plans/${plan.id}` },
    openGraph: {
      title: `${plan.title} · Word of God Risen`,
      description: `${plan.tagline}. ${plan.description}`,
    },
  };
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getPlan(id)) notFound();
  return <PlanDetail planId={id} />;
}
