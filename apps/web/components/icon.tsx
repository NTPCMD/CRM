import {
  LayoutGrid, Users, Filter, FolderKanban, CircleCheck, Calendar, MessageSquare,
  File, FileText, ReceiptText, ChartNoAxesColumn, Shield, Plug, Zap, Settings,
  Search, Bell, Sun, Moon, Plus, Download, DollarSign, PenLine, Home, Circle,
  ArrowLeft, Building2, LogOut, ChevronRight,
  type LucideProps,
} from "lucide-react";

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  LayoutGrid, Users, Filter, FolderKanban, CircleCheck, Calendar, MessageSquare,
  File, FileText, ReceiptText, ChartNoAxesColumn, Shield, Plug, Zap, Settings,
  Search, Bell, Sun, Moon, Plus, Download, DollarSign, PenLine, Home, Circle,
  ArrowLeft, Building2, LogOut, ChevronRight,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = MAP[name] ?? Circle;
  return <C className={className} />;
}
