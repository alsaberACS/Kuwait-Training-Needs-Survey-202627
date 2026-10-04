import { Link } from "wouter";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] paper-bg grain flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-accent"><Compass className="h-8 w-8" /></div>
        <p className="font-display mt-6 text-6xl font-bold text-primary/15">404</p>
        <h1 className="mt-2 text-2xl font-bold text-primary">الصفحة غير موجودة</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">يبدو أن الرابط غير صحيح. يمكنك العودة إلى الاستبانة والمشاركة في رسم مستقبل التدريب في الكويت.</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground" data-testid="link-home">العودة إلى الاستبانة</Link>
      </div>
    </div>
  );
}
