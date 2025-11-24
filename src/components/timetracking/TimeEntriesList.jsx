import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TIME_ENTRY_STATUS } from '@/constants/statuses';

const statusColors = {
  [TIME_ENTRY_STATUS.IN_PROGRESS]: "bg-green-100 text-green-800",
  [TIME_ENTRY_STATUS.COMPLETED]: "bg-blue-100 text-blue-800",
  [TIME_ENTRY_STATUS.PENDING_APPROVAL]: "bg-yellow-100 text-yellow-800",
  [TIME_ENTRY_STATUS.APPROVED]: "bg-purple-100 text-purple-800"
};

export default function TimeEntriesList({ entries, onEdit, onDelete, lang = 'fr' }) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">
          {lang === 'fr' ? 'Aucune entrée trouvée pour cette période' : 'No entries found for this period'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold">{lang === 'fr' ? 'Date' : 'Date'}</TableHead>
            <TableHead className="font-semibold">{lang === 'fr' ? 'Technicien' : 'Technician'}</TableHead>
            <TableHead className="font-semibold">{lang === 'fr' ? 'Arrivée' : 'Clock In'}</TableHead>
            <TableHead className="font-semibold">{lang === 'fr' ? 'Départ' : 'Clock Out'}</TableHead>
            <TableHead className="font-semibold">{lang === 'fr' ? 'Pause' : 'Break'}</TableHead>
            <TableHead className="font-semibold">{lang === 'fr' ? 'Total Heures' : 'Total Hours'}</TableHead>
            <TableHead className="font-semibold">{lang === 'fr' ? 'Statut' : 'Status'}</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-slate-50">
              <TableCell>
                {format(new Date(entry.clock_in), 'dd MMM yyyy')}
              </TableCell>
              <TableCell className="font-medium">
                {entry.technician_name}
              </TableCell>
              <TableCell>
                {format(new Date(entry.clock_in), 'HH:mm')}
              </TableCell>
              <TableCell>
                {entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : (
                  <span className="text-green-600 font-semibold">
                    {lang === 'fr' ? 'En cours...' : 'Active...'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {entry.break_minutes || 0} min
              </TableCell>
              <TableCell className="font-semibold">
                {entry.total_hours ? `${entry.total_hours.toFixed(2)}h` : '-'}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[entry.status || TIME_ENTRY_STATUS.COMPLETED]}>
                  {entry.status === TIME_ENTRY_STATUS.IN_PROGRESS && 'En cours'}
                  {entry.status === TIME_ENTRY_STATUS.COMPLETED && 'Complété'}
                  {entry.status === TIME_ENTRY_STATUS.PENDING_APPROVAL && 'En attente'}
                  {entry.status === TIME_ENTRY_STATUS.APPROVED && 'Approuvé'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(entry)}
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(entry.id)}
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}