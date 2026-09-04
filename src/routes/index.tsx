import { createFileRoute } from "@tanstack/react-router";
import Index from "@/views/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Meal Planner — Cook what's expiring first" },
      {
        name: "description",
        content:
          "Track your groceries, see what's expiring soon, and get recipe suggestions that use up your food before it goes to waste.",
      },
      { property: "og:title", content: "Smart Meal Planner — Cook what's expiring first" },
      {
        property: "og:description",
        content:
          "Track your groceries, see what's expiring soon, and get recipe suggestions that use up your food before it goes to waste.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
