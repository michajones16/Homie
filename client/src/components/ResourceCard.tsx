import { type Resource } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "wouter";

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
      {resource.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img 
            src={resource.imageUrl} 
            alt={resource.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {resource.category}
          </span>
          {resource.readTimeMinutes && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {resource.readTimeMinutes} min read
            </div>
          )}
        </div>
        <CardTitle className="text-xl font-display group-hover:text-primary transition-colors">
          {resource.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="line-clamp-3">
          {resource.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/resources/${resource.id}`} className="w-full">
          <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
            Read Guide <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
