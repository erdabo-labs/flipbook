import { CollectionLayout } from "@/components/CollectionLayout";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <CollectionLayout kind="acquisitions">{children}</CollectionLayout>;
}
