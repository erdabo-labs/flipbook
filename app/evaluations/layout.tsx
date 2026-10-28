import { CollectionLayout } from "@/components/CollectionLayout";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <CollectionLayout kind="evaluations">{children}</CollectionLayout>;
}
