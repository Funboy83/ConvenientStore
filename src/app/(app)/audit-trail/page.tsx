import { PageHeader } from '@/components/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { auditLogs } from '@/lib/data';
import { format } from 'date-fns';

export default function AuditTrailPage() {
  return (
    <>
      <PageHeader
        title="Audit Trail"
        description="A detailed log of all actions taken within the system."
      />
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Review all system events to ensure security and accountability.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.user}</div>
                    <div className="text-sm text-muted-foreground">{log.role}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                        log.action.includes('LOGIN') || log.action.includes('SALE') ? 'secondary' :
                        log.action.includes('UPDATE') ? 'default' :
                        'destructive'
                    }>{log.action}</Badge>
                  </TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
