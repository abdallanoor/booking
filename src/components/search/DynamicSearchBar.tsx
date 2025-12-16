"use client";

import dynamic from "next/dynamic";

const SearchBar = dynamic(
  () => import("./SearchBar").then((mod) => mod.SearchBar),
  { ssr: false }
);

export function DynamicSearchBar() {
  return <SearchBar />;
}
