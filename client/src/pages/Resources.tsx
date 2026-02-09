import { Layout } from "@/components/Layout";
import { useResources } from "@/hooks/use-resources";
import { ResourceCard } from "@/components/ResourceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

export default function Resources() {
  const { data: resources, isLoading } = useResources();
  const [search, setSearch] = useState("");

  const filteredResources = resources?.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-display font-bold">Resource Library</h1>
          <p className="text-muted-foreground text-lg">
            Expert guides, tools, and advice to help you navigate the real estate market.
          </p>
          
          <div className="relative max-w-lg mx-auto mt-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search for guides, terms, or tips..." 
              className="pl-10 h-12 text-lg rounded-full shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources?.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
            
            {filteredResources?.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No resources found matching "{search}".</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
