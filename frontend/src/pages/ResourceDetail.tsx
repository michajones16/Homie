import { useResource } from "@/hooks/use-resources";
import { Layout } from "@/components/Layout";
import { useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { Link } from "wouter";

export default function ResourceDetail() {
  const [, params] = useRoute("/resources/:id");
  const id = parseInt(params?.id || "0");
  const { data: resource, isLoading } = useResource(id);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-6">
           <Skeleton className="h-8 w-24" />
           <Skeleton className="h-12 w-3/4" />
           <Skeleton className="h-64 w-full rounded-xl" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-2/3" />
        </div>
      </Layout>
    );
  }

  if (!resource) return <Layout><div>Resource not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto pb-12">
        <Link href="/resources">
          <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
          </Button>
        </Link>
        
        <div className="space-y-6">
          <div className="flex gap-4 items-center">
            <Badge variant="secondary" className="text-primary">{resource.category}</Badge>
            {resource.readTimeMinutes && (
              <span className="text-sm text-muted-foreground flex items-center">
                <Clock className="w-3 h-3 mr-1" /> {resource.readTimeMinutes} min read
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
            {resource.title}
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed">
            {resource.description}
          </p>

          {resource.imageUrl && (
            <div className="rounded-2xl overflow-hidden shadow-lg border border-border/50 my-8">
              <img 
                src={resource.imageUrl} 
                alt={resource.title} 
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <div className="prose prose-lg prose-headings:font-display prose-headings:font-bold prose-a:text-primary max-w-none">
            {/* Simple content rendering for now - in real app use a markdown renderer */}
            {resource.content ? (
              <div className="whitespace-pre-wrap">{resource.content}</div>
            ) : (
              <p className="italic text-muted-foreground">Content coming soon...</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
