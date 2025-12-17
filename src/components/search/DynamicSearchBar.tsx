"use client";

import dynamic from "next/dynamic";
import { SearchBarSkeleton } from "./SearchBarSkeleton";

const SearchBar = dynamic(
  () => import("./SearchBar").then((mod) => mod.SearchBar),
  {
    ssr: false,
    loading: () => <SearchBarSkeleton />,
  }
);

export function DynamicSearchBar() {
  return <SearchBar />;
}
