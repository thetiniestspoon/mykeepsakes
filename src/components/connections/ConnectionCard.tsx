import { Card, CardContent } from '@/components/ui/card';
import { User, Building, MessageSquare } from 'lucide-react';
import type { Connection } from '@/types/conference';

interface ConnectionCardProps {
  connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm">{connection.name}</span>
          </div>

          {connection.organization && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">
                {connection.organization}
              </span>
            </div>
          )}

          {connection.met_context && (
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">
                {connection.met_context}
              </span>
            </div>
          )}

          {(connection.email || connection.phone) && (
            <div className="flex flex-col gap-1 mt-1 pl-6">
              {connection.email && (
                <a
                  href={`mailto:${connection.email}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {connection.email}
                </a>
              )}
              {connection.phone && (
                <a
                  href={`tel:${connection.phone}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {connection.phone}
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
